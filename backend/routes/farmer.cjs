const express = require("express");
const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient, ScanCommand } = require("@aws-sdk/lib-dynamodb");
const router = express.Router();

const REGION = process.env.AWS_REGION || process.env.DYNAMO_REGION || "eu-north-1";
const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({ region: REGION }));

router.get("/my-certs", async (req, res) => {
  try {
    const TableName = process.env.CERTIFICATES_TABLE || process.env.DYNAMO_TABLE || "Certificates";
    const ownerAddress = (req.query.ownerAddress || req.user?.extra?.ownerAddress || req.user?.extra || "").toLowerCase();
    if (!ownerAddress) return res.status(400).json({ error: "ownerAddress required" });

    // simple scan + filter (ok for now)
    const out = await ddb.send(new ScanCommand({
      TableName,
      FilterExpression: "LOWER(ownerAddress) = :a",
      ExpressionAttributeValues: { ":a": ownerAddress }
    }));
    const items = (out.Items || []).sort((a,b)=>new Date(b.issuedAt||0)-new Date(a.issuedAt||0));
    res.json({ count: items.length, items });
  } catch (e) { res.status(500).json({ error: "Failed to fetch certificates" }); }
});

module.exports = router;
