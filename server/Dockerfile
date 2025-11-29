# ===========================
#   Base Image
# ===========================
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install --production

# Copy project files
COPY . .

# Expose port
EXPOSE 4000

# Start the server
CMD ["node", "server.js"]
