// backend/routes/auth.cjs
const express = require('express');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const { otpLimiter } = require('../middleware/rateLimiter.cjs');
const { saveOtp, getOtp, delOtp, verifyOtpCode } = require('../db/otps.cjs');
const { getByEmailRole, create, upsertLastLogin } = require('../db/users.cjs');
const { issueToken } = require('../middleware/auth.cjs');

const router = express.Router();

/**
 * SIGN UP (step 1) - send OTP
 * body: { email, role, name, extra }
 */
router.post('/send-otp', otpLimiter, async (req, res) => {
  try {
    const { email, role, name, extra } = req.body;
    if (!email) return res.status(400).json({ error: "Email is required" });
    if (!role || !["farmer","consumer"].includes(role)) return res.status(400).json({ error: "role must be 'farmer' or 'consumer'" });

    const otp = process.env.NODE_ENV === "production"
      ? Math.floor(100000 + Math.random() * 900000).toString()
      : (process.env.DEV_OTP || "000000");

    const nonce = crypto.randomBytes(16).toString("hex");
    await saveOtp({ nonce, email, role, otp, ttlSec: Number(process.env.OTP_TTL_SECONDS) || 300 });

    // TODO: send via email/SMS in prod
    res.status(200).json({ message: "OTP sent", nonce, devOtp: process.env.NODE_ENV === "production" ? undefined : otp });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "OTP send failed" });
  }
});

/**
 * SIGN UP (step 2) - verify OTP + set password
 * body: { email, role, otp, nonce, name, extra, password }
 */
router.post('/verify-otp', async (req, res) => {
  try {
    const { email, role, otp, nonce, name, extra, password } = req.body;
    if (!email || !role || !otp || !nonce) return res.status(400).json({ error: "bad payload" });
    if (!password) return res.status(400).json({ error: "password is required for signup" });

    const rec = await getOtp(nonce);
    const check = verifyOtpCode(rec, otp);
    if (!check.ok) return res.status(400).json({ error: "Invalid or expired code" });

    await delOtp(nonce);

    let user = await getByEmailRole(email, role);
    const passwordHash = await bcrypt.hash(password, 10);

    if (!user) {
      user = await create({ name: name || email.split("@")[0], email, role, extra, passwordHash });
    } else {
      // existing user trying to verify again → just ensure they have a password set
      if (!user.passwordHash) {
        const { updatePasswordHash } = require('../db/users.cjs');
        user = await updatePasswordHash(user.id, passwordHash);
      }
    }

    user = await upsertLastLogin(user.id);
    const token = issueToken(user);

    res.json({
      ok:true,
      token,
      user: { id: user.id, name: user.name, email: user.email, role: user.role, extra: user.extra, lastLoginAt: user.lastLoginAt }
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Verify failed" });
  }
});

/**
 * SIGN IN (password) - no OTP
 * body: { email, role, password }
 */
router.post('/login', async (req, res) => {
  try {
    const { email, role, password } = req.body;
    if (!email || !role || !password) return res.status(400).json({ error: "email, role, password required" });

    const user = await getByEmailRole(email, role);
    if (!user || !user.passwordHash) return res.status(400).json({ error: "Invalid credentials" });

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) return res.status(400).json({ error: "Invalid credentials" });

    const updated = await upsertLastLogin(user.id);
    const token = issueToken(updated);

    res.json({
      ok:true,
      token,
      user: { id: updated.id, name: updated.name, email: updated.email, role: updated.role, extra: updated.extra, lastLoginAt: updated.lastLoginAt }
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Login failed" });
  }
});

module.exports = router;
