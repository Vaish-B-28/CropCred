// { batchId, certificateID, eventType, actor, payload:{ gps, pesticides, carbon, notes }, createdAt }
const EventSchema = {
  $id: "EventSchema",
  type: "object",
  additionalProperties: false,
  required: ["batchId", "certificateID", "eventType", "actor", "payload"],
  properties: {
    batchId: { type: "string", minLength: 1, pattern: "^[A-Za-z0-9_-]+$" },
    certificateID: { type: "string", minLength: 1, pattern: "^[A-Za-z0-9-]+$" },
    eventType: { type: "string", enum: ["CREATED", "VERIFIED", "CERTIFIED", "TRANSFERRED"] },
    actor: { type: "string", minLength: 1 },
    payload: {
      type: "object",
      additionalProperties: false,
      properties: {
        gps: {
          type: "string",
          nullable: true,
          pattern: "^(-?\\d{1,2}\\.\\d+),\\s*(-?\\d{1,3}\\.\\d+)$|^lat:\\s*-?\\d{1,2}\\.\\d+\\s*,\\s*lon:\\s*-?\\d{1,3}\\.\\d+$"
        },
        pesticides: { type: "number", minimum: 0, nullable: true },
        carbon: { type: "number", nullable: true },
        notes: { type: "string", maxLength: 2000, nullable: true },
      },
    },
    createdAt: { type: "string", format: "date-time" },
  },
};

module.exports = { EventSchema };
