# ---------- Build stage -------
FROM node:18-alpine AS build

WORKDIR /home/app

# Copy only dependency files first (for caching)
COPY app/package.json app/package-lock.json ./

# Install production dependencies
RUN npm ci --only production

# Copy application files
COPY app/index.html ./
COPY app/server.js ./
COPY app/pictures ./pictures

# ---------- Runtime stage ---------
FROM node:18-alpine

WORKDIR /home/app

# Copy installed dependencies and app files from build stage
COPY --from=build /home/app/node_modules ./node_modules
COPY --from=build /home/app/server.js ./
COPY --from=build /home/app/index.html ./
COPY --from=build /home/app/pictures ./pictures

EXPOSE 3000

CMD ["node", "server.js"]


