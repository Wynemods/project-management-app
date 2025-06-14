# --- Dev image ---
    FROM node:18-alpine

    # App lives here
    WORKDIR /app
    
    # Global pnpm
    RUN npm i -g pnpm
    
    # Install deps
    COPY package.json pnpm-lock.yaml ./
    RUN pnpm install
    
    # Bring in source
    COPY . .
    
    # Expose Nest default port
    EXPOSE 3000
    
    # Fire it up in watch mode
    CMD ["pnpm", "run", "start:dev"]
    