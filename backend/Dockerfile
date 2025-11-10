# Use Node.js 18 base image
FROM node:18

# Set working directory inside container
WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install

# Copy all backend files
COPY . .

# Expose backend port
EXPOSE 5000

# Start the server
CMD ["npm", "start"]
