require("dotenv").config();
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./swagger.cjs');

const express = require("express");
const helmet = require("helmet");
const cors = require("cors");
const { v4: uuidv4 } = require("uuid");
const batchRoutes = require('./routes/batch.cjs');
const authRoutes = require('./routes/auth.cjs');

const crypto = require("crypto");

// AWS SDK
const { S3Client, PutObjectCommand, GetObjectCommand } = require("@aws-sdk/client-s3");
const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient, PutCommand, GetCommand } = require("@aws-sdk/lib-dynamodb");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");

// Blockchain
const { ethers } = require("ethers");
const contractJson = require("./contract.json");

// ENV vars
const PRIVATE_KEY = process.env.PRIVATE_KEY || "0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d";
const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS || "0x5FbDB2315678afecb367f032d93F642f64180aa3";
const provider = new ethers.JsonRpcProvider(process.env.LOCAL_RPC_URL || "http://127.0.0.1:8545");
const signer = new ethers.Wallet(PRIVATE_KEY, provider);
const contract = new ethers.Contract(CONTRACT_ADDRESS, contractJson.abi, signer);
const verifyToken = require("./middleware/auth.cjs");

const { logger } = require('./utils/logger.cjs');

const app = express();
app.use(express.json());
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.use((req, res, next) => {
  console.log(`🔍 Incoming request: ${req.method} ${req.url}`);
  next();
});

app.use(helmet());
app.use(cors({
  origin: 'http://localhost:5173', // your frontend origin
  methods: ['GET', 'POST'],
  credentials: true,
}));

// Routers
app.use('/api/batch', batchRoutes);
app.use('/api/auth', authRoutes);

const eventRoutes = require("./routes/event.cjs");
app.use('/api/event', eventRoutes);   // validated event route

const certRoutes = require("./routes/cert.cjs");
app.use("/api/cert", certRoutes);

const verifyRoutes = require("./routes/verify.cjs");
app.use("/api/verify", verifyRoutes);

// AWS clients
const s3 = new S3Client({ region: process.env.AWS_REGION });
const dynamo = DynamoDBDocumentClient.from(new DynamoDBClient({ region: process.env.AWS_REGION }));

// ✅ Test route
app.get("/", (req, res) => res.send("Backend is running 🚀"));

/**
 * @swagger
 * /upload:
 *   post:
 *     summary: Upload a certificate and store metadata
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - ownerAddress
 *               - fileContent
 *             properties:
 *               name:
 *                 type: string
 *               ownerAddress:
 *                 type: string
 *               fileContent:
 *                 type: string
 *     responses:
 *       200:
 *         description: Certificate uploaded successfully
 */

// ✅ Upload route (protected)
app.post("/upload", verifyToken, async (req, res) => {
  try {
    const { name, ownerAddress, fileContent } = req.body;
    // Compute sha256 of the uploaded content (supports base64 data URLs or plain text)
let buf;
if (typeof fileContent === "string" && fileContent.startsWith("data:")) {
  // data URL like "data:application/pdf;base64,AAA..."
  const base64 = fileContent.split(",")[1] || "";
  buf = Buffer.from(base64, "base64");
} else if (typeof fileContent === "string") {
  // plain text or base64 string — try base64 first, fallback to utf8
  try {
    const maybe = Buffer.from(fileContent, "base64");
    // heuristic: if decoding to base64 doesn’t change length drastically, keep it
    if (maybe.length > 0 && Math.abs(maybe.toString("base64").length - fileContent.length) < 5) {
      buf = maybe;
    } else {
      buf = Buffer.from(fileContent, "utf8");
    }
  } catch {
    buf = Buffer.from(fileContent, "utf8");
  }
} else if (fileContent?.type === "Buffer" && Array.isArray(fileContent.data)) {
  // if frontend sent Buffer JSON
  buf = Buffer.from(fileContent.data);
} else {
  return res.status(400).json({ error: "Unsupported fileContent format" });
}

const sha256 = crypto.createHash("sha256").update(buf).digest("hex");

    if (!name || !ownerAddress || !fileContent) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const certificateID = uuidv4();
    const bucketName = process.env.S3_BUCKET || "cropcred-certificates";
    const key = `${certificateID}.txt`;

    // Upload file to S3
    await s3.send(new PutObjectCommand({
      Bucket: bucketName,
      Key: key,
      Body: buf, // ensure we upload the same bytes we hashed
      ContentType: "application/octet-stream"
    }));

    // Blockchain issueCertificate
    const tx = await contract.issueCertificate(certificateID, ownerAddress);
    await tx.wait();

    // Save metadata in DynamoDB
    await dynamo.send(new PutCommand({
      TableName: process.env.DYNAMO_TABLE || "Certificates",
      Item: {
        certificateID,
        name,
        ownerAddress,
        s3Key: key,
        sha256,
        txHash: tx.hash,
        issuedAt: new Date().toISOString(),
      },
    }));

    
    res.json({ message: "Certificate uploaded ✅", certificateID, s3Key: key, sha256, txHash: tx.hash });

  } catch (err) {
    console.error("Upload failed:", err);
    res.status(500).json({ error: "Upload failed", details: err.message });
  }
});

// Simple echo test
app.post("/test", (req, res) => {
  console.log("📦 Test body:", req.body);
  res.json({ received: req.body });
});

/**
 * @swagger
 * /verify/{id}:
 *   get:
 *     summary: Verify a certificate against blockchain and database
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Verification result
 *       404:
 *         description: Certificate not found
 */

// ✅ Verify route
app.get("/verify/:id", async (req, res) => {
  try {
    const { id } = req.params;

    // Get from DynamoDB
    const dbResult = await dynamo.send(new GetCommand({
      TableName: process.env.DYNAMO_TABLE || "Certificates",
      Key: { certificateID: id },
    }));
    if (!dbResult.Item) return res.status(404).json({ error: "Certificate not found in DB" });

    const dbItem = dbResult.Item;

    // Get from blockchain
    const onChain = await contract.verifyCertificate(id);
    const onChainOwner = onChain.owner || onChain[1];
    const onChainIssuedAt = Number(onChain.issuedAt || onChain[2] || 0);

    const zeroAddr = "0x0000000000000000000000000000000000000000";
    const existsOnChain = onChainOwner && onChainOwner !== zeroAddr;

    let valid = false;
    try {
      if (existsOnChain) {
        valid = ethers.getAddress(onChainOwner) === ethers.getAddress(dbItem.ownerAddress);
      }
    } catch {
      valid = false;
    }

    res.json({
      db: dbItem,
      onChain: existsOnChain
        ? { certificateID: id, owner: onChainOwner, issuedAt: onChainIssuedAt }
        : null,
      valid,
    });
  } catch (err) {
    console.error("Verify failed:", err);
    res.status(500).json({ error: "Verification failed", details: err.message });
  }
});

/**
 * @swagger
 * /credibility/{certificateID}:
 *   get:
 *     summary: Get credibility score for a certificate
 *     parameters:
 *       - in: path
 *         name: certificateID
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Credibility score returned
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 certificateID:
 *                   type: string
 *                 credibilityScore:
 *                   type: integer
 */

// Credibility Score route
app.get("/credibility/:certificateID", async (req, res) => {
  try {
    const { certificateID } = req.params;

    // Replace this with your actual DB or blockchain fetch logic
    const events = await getEventsFromDB(certificateID);
    console.log("Fetched events:", events); // 🔍 Debug log

    // ✅ Validation: check for null, undefined, or empty array
    if (!Array.isArray(events) || events.length === 0) {
      return res.status(404).json({ error: "Certificate not found or has no events" });
    }

    const score = computeCredibility(events);
    res.json({ certificateID, credibilityScore: score });
  } catch (err) {
    logger.error("Credibility error", err);
    res.status(500).json({ error: "Failed to compute credibility" });
  }
});

// Sample scoring logic
function computeCredibility(events) {
  let score = 100;

  for (const event of events) {
    // Actor trust
    if (event.actor === "unknown") score -= 10;

    // Tampering or dispute
    if (event.conditions?.tampered) score -= 20;
    if (event.notes?.includes("dispute")) score -= 15;

    // Fertilizer usage
    if (event.agri?.fertilizerUsed > 50) score -= 10;
    if (event.agri?.fertilizerUsed > 100) score -= 20;

    // Crop damage or fake
    if (event.agri?.cropStatus === "damaged") score -= 25;
    if (event.agri?.cropStatus === "fake") score -= 30;

    // Weather impact
    if (event.weather?.severity === "extreme") score -= 15;
    if (event.weather?.rainfall < 10 || event.weather?.rainfall > 300) score -= 10;
  }

  return Math.max(score, 0);
}

async function getEventsFromDB(certificateID) {
  // Simulate valid and invalid IDs
  if (certificateID === "valid123") {
    return [
      {
        actor: "farmer1",
        conditions: { tampered: false },
        notes: "clean",
        agri: { fertilizerUsed: 120, cropStatus: "damaged" },
        weather: { severity: "extreme", rainfall: 5 }
      },
      {
        actor: "unknown",
        conditions: { tampered: true },
        notes: "dispute raised",
        agri: { fertilizerUsed: 30, cropStatus: "healthy" },
        weather: { severity: "normal", rainfall: 150 }
      }
    ];
  }

  // Simulate no data for invalid IDs
  return [];
}

app.post("/api/batch/create", verifyToken, async (req, res) => {
  try {
    const { batch } = req.body;

    if (!Array.isArray(batch) || batch.length === 0) {
      return res.status(400).json({ error: "Batch must be a non-empty array" });
    }

    // Example: Validate each item in the batch
    for (const item of batch) {
      if (!item.certificateID || !item.actor) {
        return res.status(400).json({ error: "Each item must have certificateID and actor" });
      }
      // TODO: Add your logic to store/process each item
      // e.g., await CertificateModel.create(item);
    }

    logger.info(`Batch created with ${batch.length} items by ${req.user?.user || 'unknown'}`);
    res.status(200).json({ message: "Batch created successfully", count: batch.length });
  } catch (err) {
    logger.error("Batch creation error", err);
    res.status(500).json({ error: "Batch creation failed" });
  }
});

// router.get("/:batchId", ...) // list events for a batch from DynamoDB (or from the in-memory Map for now)

/**
 * @swagger
 * /health:
 *   get:
 *     summary: Health check for CropCred backend
 *     responses:
 *       200:
 *         description: Backend is running
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: CropCred backend is running
 */
app.get("/health", (req, res) => {
  res.status(200).json({ status: "CropCred backend is running" });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
