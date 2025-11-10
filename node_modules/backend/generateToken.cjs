require("dotenv").config(); // Load .env variables
const jwt = require("jsonwebtoken");

const secret = process.env.JWT_SECRET;

const payload = {
  user: "vaishnavi",
};

const token = jwt.sign(payload, secret, { expiresIn: "1h" });

console.log("Generated JWT Token:");
console.log(token);
