import request from 'supertest';
import app from '../app.js';

describe('Batch Routes', () => {
  test('POST /api/batch/create with valid data returns 200', async () => {
    const res = await request(app).post('/api/batch/create').send({
      cropName: 'Wheat',
      farmerId: 'F123',
      location: 'Punjab',
      harvestDate: '2025-10-20',
    });
    expect(res.statusCode).toBe(200);
    expect(res.body.message).toBe('Batch created successfully');
  });

  test('POST /api/batch/create with missing data returns 400', async () => {
    const res = await request(app).post('/api/batch/create').send({
      cropName: 'Wheat',
      location: 'Punjab',
    });
    expect(res.statusCode).toBe(400);
    expect(res.body.error).toMatch(/farmerId/);
  });
});
