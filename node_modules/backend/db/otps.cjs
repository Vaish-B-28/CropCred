const { PutCommand, GetCommand, DeleteCommand } = require("@aws-sdk/lib-dynamodb");
const crypto = require("crypto");
const ddb = require("./client.cjs");
const TABLE = process.env.OTPS_TABLE;

function sha256(s){ return crypto.createHash("sha256").update(s).digest("hex"); }

async function saveOtp({ nonce, email, role, otp, ttlSec }) {
  const expiresAt = Math.floor(Date.now()/1000) + (ttlSec || 300);
  const item = {
    nonce,
    email: email.toLowerCase().trim(),
    role, // "farmer" | "consumer"
    otpHash: sha256(otp),
    attempts: 0,
    maxAttempts: 5,
    expiresAt
  };
  await ddb.send(new PutCommand({ TableName: TABLE, Item: item }));
  return { nonce, expiresAt };
}
async function getOtp(nonce) {
  const out = await ddb.send(new GetCommand({ TableName: TABLE, Key: { nonce } }));
  return out.Item;
}
async function delOtp(nonce) {
  await ddb.send(new DeleteCommand({ TableName: TABLE, Key: { nonce } }));
}
function verifyOtpCode(item, otp) {
  if (!item) return { ok:false, reason:"missing" };
  if (item.expiresAt < Math.floor(Date.now()/1000)) return { ok:false, reason:"expired" };
  const ok = (sha256(otp) === item.otpHash);
  return { ok, reason: ok ? null : "mismatch" };
}

module.exports = { saveOtp, getOtp, delOtp, verifyOtpCode };
