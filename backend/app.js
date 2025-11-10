import express from 'express';
import { logger } from './utils/logger.js';

const app = express();

app.use((req, res, next) => {
  logger.info(`${req.method} ${req.url}`);
  next();
});


app.use((req, res, next) => {
  logger.info(`${req.method} ${req.url}`);
  next();
});

app.use((err, req, res, next) => {
  logger.error(`Error: ${err.message}`);
  res.status(500).json({ error: 'Internal Server Error' });
});

app.use(require("./routes/public.batches").default);

export default app;
