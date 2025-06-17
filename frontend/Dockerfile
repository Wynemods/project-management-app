# Stage 1: Build TS
FROM node:18 AS build

WORKDIR /app

# Install dependencies
COPY package.json package-lock.json ./
RUN npm install

# Copy config and source
COPY tsconfig.json ./
COPY src ./src

# Build project
RUN npm run build

# Stage 2: Serve via http-server
FROM node:18-slim

WORKDIR /app

RUN npm install -g http-server

# Copy build output from Stage 1
COPY --from=build /app/dist ./dist

EXPOSE 8080

CMD ["http-server", "dist", "-p", "8080"]
