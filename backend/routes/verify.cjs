// backend/routes/verify.cjs
const express = require("express");
const router = express.Router();
const crypto = require("crypto");

const { cropCred } = require("../blockchain.cjs");
const { buildEventForHash, hashEvent } = require("../utils/hashEvent.cjs");

const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient, GetCommand, QueryCommand } = require("@aws-sdk/lib-dynamodb");
const { S3Client, GetObjectCommand, ListObjectsV2Command } = require("@aws-sdk/client-s3");

const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({ region: process.env.AWS_REGION }));
const s3  = new S3Client({ region: process.env.AWS_REGION });

const CERTS_TABLE  = process.env.DYNAMO_TABLE      || "Certificates";
const EVENTS_TABLE = process.env.EVENTS_TABLE      || "LifecycleEvents";
const S3_BUCKET    = process.env.S3_BUCKET         || "cropcred-certificates";

/** helper: buffer an S3 Body stream */
async function streamToBuffer(stream) {
  const chunks = [];
  for await (const chunk of stream) chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  return Buffer.concat(chunks);
}

/**
 * GET /api/verify/:certificateID
 * Steps:
 * 1) fetch DB cert
 * 2) fetch latest S3 object (by cert.s3Key if present, else by prefix)
 * 3) sha256 the PDF
 * 4) fetch events for this certificate (GSI), rebuild canonical JSONs → keccak
 * 5) fetch on-chain getEventHashes(batchId)
 * 6) compare arrays and return verdict
 */
router.get("/:certificateID", async (req, res) => {
  try {
    const certificateID = String(req.params.certificateID).trim();

    // (1) DB cert
    const certResp = await ddb.send(new GetCommand({
      TableName: CERTS_TABLE,
      Key: { certificateID },
    }));
    const cert = certResp.Item;
    if (!cert) return res.status(404).json({ ok: false, error: "cert_not_found" });

    // (2) S3 object
    // Prefer explicit key from DB; otherwise try common prefixes
    let s3Key = cert.s3Key || null;
    if (!s3Key) {
      const prefix = `certs/${certificateID}`;
      const list = await s3.send(new ListObjectsV2Command({
        Bucket: S3_BUCKET,
        Prefix: prefix, // e.g., certs/CERT-123.pdf or certs/CERT-123/latest.pdf
      }));
      if (list.Contents && list.Contents.length > 0) {
        // choose the newest by LastModified
        list.Contents.sort((a, b) => new Date(b.LastModified) - new Date(a.LastModified));
        s3Key = list.Contents[0].Key;
      }
    }

    let s3Sha256 = null;
    let s3Url = null;

    if (s3Key) {
      const obj = await s3.send(new GetObjectCommand({ Bucket: S3_BUCKET, Key: s3Key }));
      const buf = await streamToBuffer(obj.Body);
      s3Sha256 = crypto.createHash("sha256").update(buf).digest("hex");
      // a presigned URL is nicer, but for now just return the canonical path
      s3Url = `s3://${S3_BUCKET}/${s3Key}`;
    }

    // (3) Events → canonical → keccak
    // Use the GSI by certificateID to gather the full timeline
    const evResp = await ddb.send(new QueryCommand({
      TableName: EVENTS_TABLE,
      IndexName: "GSI1_CertificateIdCreatedAt",
      KeyConditionExpression: "certificateID = :c",
      ExpressionAttributeValues: { ":c": certificateID },
      ScanIndexForward: true, // ascending by createdAt
    }));
    const events = evResp.Items || [];

    // Find batchId (prefer explicit payload.batchId if present)
    // Find batchId (prefer payload.batchId; fall back to the event's top-level batchId; then cert meta)
    const firstWithBatch = events.find(e => e.payload?.batchId) || events[0];
    const batchId =
      firstWithBatch?.payload?.batchId ||
      firstWithBatch?.batchId ||      // <-- this is the key fallback
      cert?.meta?.batchId ||
      cert?.batchId ||
      null;

    // Rebuild canonical and hash
    const canonicalEvents = events.map(e => buildEventForHash({
      batchId: e.batchId,
      certificateID: e.certificateID,
      eventType: e.eventType,
      actor: e.actor,
      payload: e.payload || {},
      createdAt: e.createdAt, // ms epoch
    }));
    const recomputedHashes = canonicalEvents.map(evt => hashEvent(evt));

    // (4) On-chain
    let onChainHashes = [];
    if (batchId) {
      onChainHashes = await cropCred.getEventHashes(batchId);
      // normalize to lowercase hex strings
      onChainHashes = onChainHashes.map(h => h.toLowerCase());
    }

    // Compare (order & membership)
    const local = recomputedHashes.map(h => h.toLowerCase());
    const chain = onChainHashes;
    const valid =
      batchId &&
      local.length === chain.length &&
      local.every((h, i) => h === chain[i]); // strict order match (createdAt asc)

    // (5) Build response
    const mismatches = [];
    if (batchId) {
      // collect diffs if not valid
      for (let i = 0; i < Math.max(local.length, chain.length); i++) {
        if (local[i] !== chain[i]) {
          mismatches.push({ index: i, recomputed: local[i] || null, onChain: chain[i] || null });
        }
      }
    }

    return res.json({
      ok: true,
      valid,
      db: cert,
      s3: { key: s3Key || null, sha256: s3Sha256, storedSha256: cert.sha256 || null, url: s3Url },
      events: { count: events.length },
      onChain: { batchId: batchId || null, count: chain.length, hashes: chain },
      mismatches,
    });
  } catch (err) {
    console.error("VERIFY_ERROR:", err);
    return res.status(500).json({ ok: false, error: "verify_failed", detail: err?.message || String(err) });
  }
});

module.exports = router;
