// backend/utils/hashEvent.cjs
const crypto = require("crypto");

// Build the event object in a fixed order & shape (deterministic)
function buildEventForHash({ batchId, certificateID, eventType, actor, payload = {}, createdAt }) {
  const createdAtNum = Number(createdAt);

  return {
    batchId: String(batchId ?? "").trim(),
    certificateID: String(certificateID ?? "").trim(),
    eventType: String(eventType ?? "").trim(),
    actor: String(actor ?? "").trim(),
    payload: {
      gps: payload?.gps ?? null,
      pesticides: payload?.pesticides ?? null,
      carbon: payload?.carbon ?? null,
      notes: payload?.notes ?? null,
      sha256: payload?.sha256 ?? null, // <-- include file hash if present
    },
    createdAt: Number.isFinite(createdAtNum) ? createdAtNum : 0, // number (ms)
  };
}

// Deterministic SHA-256 -> 0x + 64 hex chars
function hashEvent(e) {
  const body = JSON.stringify(buildEventForHash(e)); // stable because keys are fixed
  return "0x" + crypto.createHash("sha256").update(body).digest("hex");
}

module.exports = { buildEventForHash, hashEvent };
