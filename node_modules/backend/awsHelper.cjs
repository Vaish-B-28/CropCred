require("dotenv").config();
const { S3Client, PutObjectCommand, GetObjectCommand } = require("@aws-sdk/client-s3");
const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient, PutCommand, GetCommand } = require("@aws-sdk/lib-dynamodb");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");

const REGION = process.env.AWS_REGION;
const S3_BUCKET = process.env.S3_BUCKET;
const DYNAMO_TABLE = process.env.DYNAMO_TABLE;

const s3 = new S3Client({ region: REGION });
const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({ region: REGION }));

async function uploadToS3(key, body) {
  await s3.send(new PutObjectCommand({ Bucket: S3_BUCKET, Key: key, Body: body }));
  return key;
}

async function getPresignedUrl(key, expiresIn = 3600) {
  const cmd = new GetObjectCommand({ Bucket: S3_BUCKET, Key: key });
  return await getSignedUrl(s3, cmd, { expiresIn });
}

async function putItem(item) {
  await ddb.send(new PutCommand({ TableName: DYNAMO_TABLE, Item: item }));
  return item;
}

async function getItem(certificateID) {
  const r = await ddb.send(new GetCommand({ TableName: DYNAMO_TABLE, Key: { certificateID } }));
  return r.Item;
}

module.exports = { uploadToS3, getPresignedUrl, putItem, getItem };
