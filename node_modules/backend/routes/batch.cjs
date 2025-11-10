const express = require('express');
const { batchSchema } = require('../validators/batchValidator.cjs');

const router = express.Router();

router.post('/create', async (req, res) => {
  const { error } = batchSchema.validate(req.body);
  if (error) {
    return res.status(400).json({ error: error.details[0].message });
  }

  // Continue with batch creation logic
  res.status(200).json({ message: 'Batch created successfully' });
});

module.exports = router;
