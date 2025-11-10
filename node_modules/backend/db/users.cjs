// backend/db/users.cjs
const { GetCommand, PutCommand, UpdateCommand, QueryCommand } = require("@aws-sdk/lib-dynamodb");
const ddb = require("./client.cjs");
const TABLE = process.env.USERS_TABLE;

function nowISO(){ return new Date().toISOString(); }

async function getByEmailRole(email, role) {
  const cmd = new QueryCommand({
    TableName: TABLE,
    IndexName: "emailRoleGSI",
    KeyConditionExpression: "#e = :e AND #r = :r",
    ExpressionAttributeNames: { "#e":"email", "#r":"role" },
    ExpressionAttributeValues: { ":e": email.toLowerCase().trim(), ":r": role },
    Limit: 1
  });
  const out = await ddb.send(cmd);
  return out.Items && out.Items[0];
}

async function getById(id) {
  const out = await ddb.send(new GetCommand({ TableName: TABLE, Key: { id } }));
  return out.Item;
}

async function create({ name, email, role, extra, passwordHash }) {
  const item = {
    id: "user_" + Date.now(),
    name,
    email: email.toLowerCase().trim(),
    role,                  // "farmer" | "consumer"
    extra: extra || null,
    passwordHash: passwordHash || null,
    createdAt: nowISO(),
    updatedAt: nowISO(),
    lastLoginAt: null,
    status: "active"
  };
  await ddb.send(new PutCommand({
    TableName: TABLE,
    Item: item,
    ConditionExpression: "attribute_not_exists(id)"
  }));
  return item;
}

async function upsertLastLogin(id) {
  const out = await ddb.send(new UpdateCommand({
    TableName: TABLE,
    Key: { id },
    UpdateExpression: "SET lastLoginAt = :ll, updatedAt = :u",
    ExpressionAttributeValues: { ":ll": nowISO(), ":u": nowISO() },
    ReturnValues: "ALL_NEW"
  }));
  return out.Attributes;
}

async function updatePasswordHash(id, passwordHash) {
  const out = await ddb.send(new UpdateCommand({
    TableName: TABLE,
    Key: { id },
    UpdateExpression: "SET passwordHash = :ph, updatedAt = :u",
    ExpressionAttributeValues: { ":ph": passwordHash, ":u": nowISO() },
    ReturnValues: "ALL_NEW"
  }));
  return out.Attributes;
}

module.exports = { getByEmailRole, getById, create, upsertLastLogin, updatePasswordHash };
