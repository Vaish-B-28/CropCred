const express = require("express");
const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient, PutCommand, QueryCommand, DeleteCommand } = require("@aws-sdk/lib-dynamodb");
const router = express.Router();

const REGION = process.env.AWS_REGION || process.env.DYNAMO_REGION || "eu-north-1";
const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({ region: REGION }));
const TABLE = process.env.SAVED_TABLE || "CropCred_Saved";

router.post("/saved/batch", async (req, res) => {
  try {
    const { batchId, note } = req.body;
    if (!batchId) return res.status(400).json({ error: "batchId required" });
    await ddb.send(new PutCommand({
      TableName: TABLE,
      Item: { userId: req.user.sub, sk: `BATCH#${batchId}`, batchId, note: note || null, createdAt: new Date().toISOString() }
    }));
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: "Save failed" }); }
});

router.get("/saved", async (req, res) => {
  try {
    const out = await ddb.send(new QueryCommand({
      TableName: TABLE,
      KeyConditionExpression: "userId = :u",
      ExpressionAttributeValues: { ":u": req.user.sub },
      ScanIndexForward: false
    }));
    res.json({ items: out.Items || [] });
  } catch (e) { res.status(500).json({ error: "List failed" }); }
});

router.delete("/saved/batch/:batchId", async (req, res) => {
  try {
    await ddb.send(new DeleteCommand({
      TableName: TABLE,
      Key: { userId: req.user.sub, sk: `BATCH#${req.params.batchId}` }
    }));
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: "Delete failed" }); }
});

module.exports = router;
