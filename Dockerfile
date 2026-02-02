# ---------- Build stage ----------
FROM node:18-alpine AS build

WORKDIR /home/app

# Copy only dependency files first (better caching)
COPY app/package.json app/package-lock.json ./
RUN npm ci --production

# Copy application source
COPY app/ .

# ---------- Runtime stage ----------
FROM node:18-alpine

WORKDIR /home/app

ENV NODE_ENV=production

# Copy only what is needed to run
COPY --from=build /home/app/node_modules ./node_modules
COPY --from=build /home/app ./

EXPOSE 3000
CMD ["node", "server.js"]


