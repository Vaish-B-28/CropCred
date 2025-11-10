// backend/routes/cert.cjs
const express = require("express");
const router = express.Router();
const { cropCred, wallet: signer } = require("../blockchain.cjs");

// Dynamo
const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const {
  DynamoDBDocumentClient,
  PutCommand,
  GetCommand,
  QueryCommand,
  ScanCommand,
} = require("@aws-sdk/lib-dynamodb");

const ddb = DynamoDBDocumentClient.from(
  new DynamoDBClient({ region: process.env.AWS_REGION })
);
const CERTS_TABLE = process.env.DYNAMO_TABLE || "Certificates";
const EVENTS_TABLE = process.env.DYNAMO_EVENTS_TABLE || "LifecycleEvents";

const jwt = require("jsonwebtoken");

// --------- helpers ---------
function requireBody(req, res, next) {
  const b = req.body || {};
  if (!b.certificateID || !b.ownerAddress) {
    return res
      .status(400)
      .json({ error: "certificateID and ownerAddress are required" });
  }
  if (!/^0x[a-fA-F0-9]{40}$/.test(b.ownerAddress)) {
    return res
      .status(400)
      .json({ error: "ownerAddress must be a 0x…40 address" });
  }
  next();
}

// auth (JWT) — minimal guard so we can attach farmerId/farmerName
function requireAuth(roles = []) {
  return (req, res, next) => {
    const token = (req.headers.authorization || "").replace(/^Bearer\s+/i, "");
    try {
      const user = jwt.verify(token, process.env.JWT_SECRET);
      req.user = user; // { sub, email, role, name, address? }
      if (roles.length && !roles.includes(user.role)) {
        return res.status(403).json({ error: "Forbidden" });
      }
      next();
    } catch {
      return res.status(401).json({ error: "Unauthorized" });
    }
  };
}

// credibility helper (quick model using lifecycle event count)
async function computeCredibilityForBatch(batchId) {
  const r = await ddb.send(
    new QueryCommand({
      TableName: EVENTS_TABLE,
      KeyConditionExpression: "batchId = :b",
      ExpressionAttributeValues: { ":b": batchId },
    })
  );
  const n = (r.Items || []).length;
  const E = 0.9,
    C = 0.8,
    D = Math.min(0.6 + n * 0.05, 0.95),
    S = 0.75;
  return Math.round(((E + C + D + S) / 4) * 100); // 0..100
}

// --------- routes ---------

// POST /api/cert/issue
// body: { certificateID, ownerAddress, meta?: { ... }, s3Key?, sha256? }
router.post("/issue", requireBody, async (req, res) => {
  try {
    const { certificateID, ownerAddress, meta, s3Key, sha256 } = req.body;
    const id = String(certificateID).trim();

    // ensure backend signer is contract owner
    const onChainOwner = await cropCred.owner();
    const backendAddr = await signer.getAddress();
    if (onChainOwner.toLowerCase() !== backendAddr.toLowerCase()) {
      return res.status(403).json({
        error: "forbidden_not_owner",
        details: `Backend signer ${backendAddr} is not contract owner ${onChainOwner}`,
      });
    }

    // idempotency
    const existing = await ddb.send(
      new GetCommand({
        TableName: CERTS_TABLE,
        Key: { certificateID: id },
      })
    );
    if (existing.Item) {
      return res
        .status(200)
        .json({ ok: true, alreadyIssued: true, record: existing.Item });
    }

    // on-chain call
    const tx = await cropCred.issueCertificate(id, ownerAddress);
    await tx.wait();

    // persist
    const issuedAt = Date.now();
    const record = {
      certificateID: id,
      ownerAddress,
      issuedAt,
      txHash: tx.hash,
      network: process.env.CHAIN_ID || "31337",
      meta: meta || null,
      s3Key: s3Key || null,
      sha256: sha256 || null,
    };

    await ddb.send(
      new PutCommand({
        TableName: CERTS_TABLE,
        Item: record,
        ConditionExpression: "attribute_not_exists(certificateID)",
      })
    );

    return res
      .status(201)
      .json({ ok: true, message: "Certificate issued", record });
  } catch (err) {
    console.error("CERT_ISSUE_ERROR:", err);
    const msg = err?.shortMessage || err?.message || String(err);
    if (/Ownable|only owner|caller is not the owner/i.test(msg)) {
      return res
        .status(403)
        .json({ error: "Not contract owner (onlyOwner)", detail: msg });
    }
    if (/ConditionalCheckFailedException/i.test(msg)) {
      return res
        .status(409)
        .json({ error: "duplicate_certificate", detail: "Already exists" });
    }
    return res.status(500).json({ error: "Issue failed", detail: msg });
  }
});

// POST /api/cert/batch  (create batch metadata + farmer linkage)
// body: { batchId, name, cropType, harvestDate, origin, ownerAddress }
router.post(
  "/batch",
  requireAuth(["farmer", "org", "admin"]),
  async (req, res) => {
    try {
      const b = req.body || {};
      if (!b.batchId || !b.name) {
        return res
          .status(400)
          .json({ error: "batchId and name are required" });
      }

      const certificateID = `CERT-${String(b.batchId).trim()}`;

      // link batch to logged in farmer
      const farmerId = (req.user?.sub || req.user?.email || "unknown") + "";
      const farmerName = (req.user?.name || req.user?.email || "Farmer") + "";

      const now = Date.now();
      const record = {
        certificateID,
        batchId: b.batchId,
        name: b.name,
        cropType: b.cropType || null,
        harvestDate: b.harvestDate || null,
        origin: b.origin || null,
        ownerAddress: b.ownerAddress || req.user?.address || null,
        farmerId,
        farmerName,
        createdAt: now,
        network: process.env.CHAIN_ID || "31337",
      };

      await ddb.send(
        new PutCommand({
          TableName: CERTS_TABLE,
          Item: record,
          ConditionExpression: "attribute_not_exists(certificateID)",
        })
      );

      return res
        .status(201)
        .json({ ok: true, certificateID, batchId: b.batchId });
    } catch (e) {
      if (/ConditionalCheckFailedException/i.test(e?.message)) {
        return res
          .status(409)
          .json({ error: "duplicate_certificate", detail: "Already exists" });
      }
      console.error("BATCH_CREATE_ERROR:", e);
      return res
        .status(500)
        .json({ error: "batch_create_failed", detail: e?.message || String(e) });
    }
  }
);

// GET /api/cert/public/batches  -> consumer marketplace cards with real credibility
router.get("/public/batches", async (_req, res) => {
  try {
    const scan = await ddb.send(
      new ScanCommand({ TableName: CERTS_TABLE, Limit: 50 })
    );
    const items = await Promise.all(
      (scan.Items || []).map(async (c) => {
        const batchId = c.batchId || (c.certificateID || "").replace(/^CERT-/, "");
        return {
          id: batchId,
          crop: c.name || c.cropType || "Crop",
          farmer: c.farmerName || "Farmer",
          location: c.origin || "—",
          score: await computeCredibilityForBatch(batchId),
        };
      })
    );
    res.json({ items });
  } catch (e) {
    console.error("PUBLIC_BATCHES_ERROR:", e);
    res
      .status(500)
      .json({ error: "public_batches_failed", detail: e?.message || String(e) });
  }
});

// GET /api/cert/farmer/batches  -> farmer's own list with real credibility
router.get(
  "/farmer/batches",
  requireAuth(["farmer", "org", "admin"]),
  async (req, res) => {
    try {
      const farmerId = (req.user?.sub || req.user?.email || "").toString();
      if (!farmerId) return res.status(401).json({ error: "No farmerId" });

      // For demo speed: scan + filter (add a GSI post-review)
      const scan = await ddb.send(new ScanCommand({ TableName: CERTS_TABLE }));
      const mine = (scan.Items || []).filter((c) => c.farmerId === farmerId);

      const items = await Promise.all(
        mine.map(async (c) => {
          const batchId =
            c.batchId || (c.certificateID || "").replace(/^CERT-/, "");
          return {
            id: batchId,
            crop: c.name || c.cropType || "Crop",
            created: new Date(c.createdAt || c.issuedAt || Date.now())
              .toISOString()
              .slice(0, 10),
            cred: await computeCredibilityForBatch(batchId),
          };
        })
      );
      res.json({ items });
    } catch (e) {
      console.error("FARMER_BATCHES_ERROR:", e);
      res.status(500).json({
        error: "farmer_batches_failed",
        detail: e?.message || String(e),
      });
    }
  }
);

// GET /api/cert/:id
router.get("/:id", async (req, res) => {
  try {
    const { Item } = await ddb.send(
      new GetCommand({
        TableName: CERTS_TABLE,
        Key: { certificateID: req.params.id },
      })
    );

    // Also read from chain for source-of-truth proof
    let onChain = null;
    try {
      const [id, owner, issuedAt] = await cropCred.verifyCertificate(
        req.params.id
      );
      if (id && id.length > 0) {
        onChain = { certificateID: id, owner, issuedAt: Number(issuedAt) };
      }
    } catch {}

    res.json({ ok: true, db: Item || null, onChain });
  } catch (e) {
    res.status(500).json({ error: "read_failed", detail: e.message });
  }
});

module.exports = router;
