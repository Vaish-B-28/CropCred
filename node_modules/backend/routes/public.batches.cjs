const express = require("express");
const router = express.Router();

const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient, ScanCommand } = require("@aws-sdk/lib-dynamodb");

const ddb = DynamoDBDocumentClient.from(
  new DynamoDBClient({ region: process.env.AWS_REGION })
);
const CERTS = process.env.DYNAMO_TABLE || "Certificates";

// Returns recently created certificates/batches for the marketplace
router.get("/public/batches", async (_req, res) => {
  try {
    const r = await ddb.send(new ScanCommand({ TableName: CERTS, Limit: 24 }));
    const items = (r.Items || []).map((c) => ({
      id: c.batchId || String(c.certificateID || "").replace(/^CERT-/, ""),
      crop: c.name || c.cropType || "Crop",
      farmer: c.farmerName || "Farmer",
      location: c.origin || "—",
    }));
    res.json({ items });
  } catch (e) {
    res.status(500).json({ error: "public_batches_failed", detail: e.message });
  }
});

module.exports = router;
