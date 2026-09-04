# Node 24 LTS - parity with package.json engines ">=24"
FROM node:24-alpine

WORKDIR /app

# Install dependencies with npm (CI mode: reproducible, from lockfile)
COPY package.json package-lock.json ./
RUN npm ci

# Copy source code
COPY . .

# Generate Prisma client
RUN npx prisma generate

# Build application
RUN npm run build

# Expose API port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})"

# Start application (runs prisma migrate deploy, then boots)
CMD ["npm", "run", "start:prod"]
