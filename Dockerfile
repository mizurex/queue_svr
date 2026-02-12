# ---------- Build Stage ----------
    FROM node:20-alpine AS builder

    WORKDIR /app
    
    COPY package*.json ./
    
    RUN npm ci
    
    COPY . .
    
    RUN npm run build
    
    
    # ---------- Production Stage ----------
    FROM node:20-alpine
    
    WORKDIR /app
    
    COPY package*.json ./
    
    # Install ONLY production dependencies
    RUN npm ci --omit=dev
    
    COPY --from=builder /app/dist ./dist
    
    ENV NODE_ENV=production
    
    CMD ["node", "dist/index.js"]
    