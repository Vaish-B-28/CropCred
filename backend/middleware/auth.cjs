const jwt = require("jsonwebtoken");

function verifyToken(req, res, next) {
  const header = req.headers.authorization;
  const token = header?.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: "No token provided" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // { sub, role, email, name }
    next();
  } catch {
    return res.status(403).json({ error: "Invalid token" });
  }
}

function requireRole(role){
  return (req,res,next)=>{
    if(!req.user || req.user.role !== role) return res.status(403).json({ error: "Forbidden" });
    next();
  };
}

function issueToken(user){
  return jwt.sign(
    { sub: user.id, role: user.role, email: user.email, name: user.name },
    process.env.JWT_SECRET,
    { expiresIn: "15d", issuer: "cropcred" }
  );
}

module.exports = { verifyToken, requireRole, issueToken };
