// validators/batchValidator.js
const Joi = require('joi');

const batchSchema = Joi.object({
  cropName: Joi.string().required(),
  farmerId: Joi.string().required(),
  location: Joi.string().required(),
  harvestDate: Joi.date().required(),
});

module.exports = { batchSchema };
