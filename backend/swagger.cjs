const swaggerJSDoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'CropCred API',
      version: '1.0.0',
      description: 'API documentation for CropCred backend',
    },
    servers: [
      {
        url: 'http://localhost:5000',
        description: 'Local dev server',
      },
    ],
  },
  apis: ['./server.cjs'], // You can add more files here
};

const swaggerSpec = swaggerJSDoc(options);

module.exports = swaggerSpec;
