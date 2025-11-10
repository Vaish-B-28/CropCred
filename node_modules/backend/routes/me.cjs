const express = require("express");
const { verifyToken } = require("../middleware/auth.cjs");
const { getById } = require("../db/users.cjs");

const router = express.Router();

router.get("/", verifyToken, async (req,res)=>{
  const user = await getById(req.user.sub);
  if(!user) return res.status(404).json({ error: "not found" });
  res.json({ id:user.id, name:user.name, email:user.email, role:user.role, extra:user.extra, lastLoginAt:user.lastLoginAt });
});

module.exports = router;
