# Step 1: Build with Node
FROM node:20-alpine AS builder

WORKDIR /app

# Copy dependency files and install
COPY package*.json ./
RUN npm install

# Copy rest of the project
COPY . .

RUN ls -la && cat tsconfig.json && npm run build

# Run build script (this compiles TS and copies HTML/CSS)
RUN npm run build

# Step 2: Serve with Nginx
FROM nginx:alpine

# Copy static files from builder's dist folder to Nginx web root
COPY --from=builder /app/dist /usr/share/nginx/html

# Expose port 80
EXPOSE 80

# Start Nginx
CMD ["nginx", "-g", "daemon off;"]
