// backend/routes/credibility.cjs
// SPDX-License-Identifier: MIT

const express = require("express");
const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient, GetCommand, QueryCommand } = require("@aws-sdk/lib-dynamodb");

const router = express.Router();

/* ---------- Env & Dynamo ---------- */
const {
  AWS_REGION = "eu-north-1",                       // match your stack
  CERTIFICATES_TABLE = "Certificates",
  LIFECYCLE_EVENTS_TABLE = "LifecycleEvents",
  LIFECYCLE_EVENTS_GSI1 = "GSI1_CertificateIdCreatedAt", // your GSI name (PK: certificateID, SK: createdAt)
  ALPHA = "0.25",
  BETA  = "0.25",
  GAMMA = "0.25",
  DELTA = "0.25",
} = process.env;

const ddb = new DynamoDBClient({ region: AWS_REGION });
const doc = DynamoDBDocumentClient.from(ddb);

/* ---------- Helpers ---------- */
const num = (v, d = 0) => (isNaN(Number(v)) ? d : Number(v));
const clamp01 = (x) => Math.max(0, Math.min(1, x));
const pct = (x) => Math.round(clamp01(x) * 100);

// events in DB store details under `payload`; fall back to `meta` if present
const getMeta = (e) => e?.payload || e?.meta || {};

function weightedAverage(parts, weights) {
  const keys = Object.keys(parts);
  const wsum = keys.reduce((s, k) => s + num(weights[k], 0), 0);
  if (!wsum) return 0;
  const score = keys.reduce((s, k) => s + num(parts[k], 0) * num(weights[k], 0), 0);
  return Math.round(score / wsum);
}

function diffHours(a, b) {
  const ta = new Date(a).getTime();
  const tb = new Date(b).getTime();
  if (!Number.isFinite(ta) || !Number.isFinite(tb)) return 0;
  return Math.abs(ta - tb) / 36e5;
}

function hasGpsPoint(ev) {
  const m = getMeta(ev);
  return (
    (m.gps && ((m.gps.lat && m.gps.lng) || (m.gps.latitude && m.gps.longitude))) ||
    (Array.isArray(m.locations) && m.locations.some((p) => p.lat && p.lng)) ||
    !!m.location
  );
}

/* ---------- Component scores ---------- */

// E: Ethics (policy acceptance + violations)
function scoreEthics(certificate, events) {
  const policyAccepted = !!certificate?.meta?.policyAccepted;
  const nViol = events.filter((e) => getMeta(e)?.violation === true).length;

  let base = policyAccepted ? 0.7 : 0.4;           // 70 if accepted, else 40 (before penalties)
  const penalty = Math.min(nViol, 3) * 0.15;       // up to -45 for 3+ violations
  let E = (base - penalty) * 100;

  return Math.max(0, Math.min(100, Math.round(E)));
}

// C: Documentation (expiry, issuer, signature, types)
function scoreDocs(certificate) {
  const meta = certificate?.meta || {};
  const now = Date.now();
  const expiresAt = meta.expiresAt ? new Date(meta.expiresAt).getTime() : null;
  const notExpired = expiresAt ? expiresAt > now : true;

  const issuer = meta.issuer || certificate?.issuer || null;
  const signature = meta.signature || null;

  const certTypes = Array.isArray(meta.types) ? meta.types : meta.type ? [meta.type] : [];
  const typeBonusMap = new Map([
    ["Organic", 0.15],
    ["FairTrade", 0.10],
    ["ISO22000", 0.10],
    ["HACCP", 0.08],
    ["RainforestAlliance", 0.08],
  ]);
  const typeBonus = certTypes.reduce((s, t) => s + (typeBonusMap.get(String(t)) || 0.05), 0);
  const cappedTypeBonus = Math.max(0, Math.min(0.30, typeBonus));

  let C = 0.4;
  if (notExpired) C += 0.35;
  if (issuer)    C += 0.15;
  if (signature) C += 0.10;
  C += cappedTypeBonus;

  return Math.max(0, Math.min(100, Math.round(C * 100)));
}

// D: Delivery (on-time vs planned + cadence/no long gaps)
function scoreDelivery(events) {
  if (!events?.length) return 50;

  const withPlan = events.filter((e) => getMeta(e)?.plannedAt);
  const onTime = withPlan.filter((e) => diffHours(e.createdAt, getMeta(e).plannedAt) <= 24);
  const onTimePct = withPlan.length ? onTime.length / withPlan.length : 0.5;

  const sorted = [...events].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
  const gaps = [];
  for (let i = 1; i < sorted.length; i++) {
    gaps.push(diffHours(sorted[i].createdAt, sorted[i - 1].createdAt));
  }
  const badGaps = gaps.filter((h) => h > 336).length; // >14 days
  const cadenceScore = gaps.length ? 1 - badGaps / gaps.length : 0.7;

  return pct(0.7 * onTimePct + 0.3 * cadenceScore);
}

// S: Sustainability (pesticides, carbon, GPS traceability, telemetry)
function scoreSustainability(events) {
  if (!events?.length) return 50;
  const n = events.length;

  // pesticides
  const pesticideFlags = events.map((e) => {
    const m = getMeta(e);
    if (typeof m.pesticidesUsed === "boolean") return m.pesticidesUsed ? 1 : 0;
    if (typeof m.pesticidesKgPerAcre === "number") return m.pesticidesKgPerAcre > 0 ? 1 : 0;
    if (typeof m.pesticideUse === "number") return m.pesticideUse > 0 ? 1 : 0;
    return 0.5;
  });
  const pesticideBad = pesticideFlags.reduce((a, b) => a + b, 0) / n;
  const pesticideScore = 1 - pesticideBad;

  // carbon (normalize around 150..600 kg/ton)
  const carbonVals = events
    .map((e) => {
      const m = getMeta(e);
      return Number.isFinite(Number(m.carbonKgPerTon))
        ? Number(m.carbonKgPerTon)
        : Number.isFinite(Number(m.carbon))
        ? Number(m.carbon)
        : NaN;
    })
    .filter((v) => !isNaN(v));
  const carbonScore = carbonVals.length
    ? clamp01(1 - (carbonVals.reduce((a, b) => a + b, 0) / carbonVals.length - 150) / (600 - 150))
    : 0.6;

  const gpsShare = events.filter((e) => hasGpsPoint(e)).length / n;

  const telemetryShare =
    events.filter((e) => {
      const m = getMeta(e);
      return (
        m.soil ||
        m.weather ||
        typeof m.soilMoisture === "number" ||
        typeof m.rainfallMm === "number" ||
        typeof m.temperatureC === "number"
      );
    }).length / n;

  return pct(0.35 * pesticideScore + 0.25 * carbonScore + 0.25 * gpsShare + 0.15 * telemetryShare);
}

/* ---------- Route ---------- */
router.get("/:certificateID", async (req, res) => {
  try {
    const certificateID = decodeURIComponent(req.params.certificateID);

    // 1) Certificate row
    const certResp = await doc.send(
      new GetCommand({
        TableName: CERTIFICATES_TABLE,
        Key: { certificateID },
      })
    );
    const certificate = certResp.Item;
    if (!certificate) {
      return res.status(404).json({ message: "Certificate not found" });
    }

    // 2) Events via GSI (PK: certificateID, SK: createdAt ASC)
    const eventsResp = await doc.send(
      new QueryCommand({
        TableName: LIFECYCLE_EVENTS_TABLE,
        IndexName: LIFECYCLE_EVENTS_GSI1,
        KeyConditionExpression: "certificateID = :cid",
        ExpressionAttributeValues: { ":cid": certificateID },
        ScanIndexForward: true,
      })
    );
    const events = (eventsResp.Items || []).map((e) => ({
      ...e,
      createdAt: e.createdAt || e.timestamp || e.created_at,
    }));

    // 3) Component scores
    const E = scoreEthics(certificate, events);
    const C = scoreDocs(certificate);
    const D = scoreDelivery(events);
    const S = scoreSustainability(events);

    // 4) Weighted combine
    const weights = {
      E: num(ALPHA, 0.25),
      C: num(BETA, 0.25),
      D: num(GAMMA, 0.25),
      S: num(DELTA, 0.25),
    };
    const credibilityScore = weightedAverage({ E, C, D, S }, weights);

    return res.json({
      certificateID,
      credibilityScore,
      breakdown: { E, C, D, S, weights },
      counts: { events: events.length },
    });
  } catch (err) {
    console.error("[credibility] error", err);
    return res.status(500).json({ message: "Internal error", error: String(err?.message || err) });
  }
});

module.exports = router;
