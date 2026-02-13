#  Build  
    FROM node:20-alpine AS builder

    WORKDIR /app
    
    COPY package*.json ./
    
    RUN npm ci
    
    COPY . .
    
    RUN npm run build
    
    
    #  FInal
    FROM node:20-alpine
    
    WORKDIR /app
    
    COPY --from=builder /app/dist ./dist
    COPY --from=builder /app/node_modules ./node_modules
   
    ENV NODE_ENV=production
    
    CMD ["node", "dist/index.js"]
    