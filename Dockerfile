# ---------- Build stage ----------
FROM node:18-alpine AS build

WORKDIR /home/app

COPY app/package.json app/package-lock.json ./
RUN npm ci --omit=dev

COPY app/server.js ./
COPY app/index.html ./
COPY app/pictures ./pictures

# ---------- Runtime stage ----------
FROM node:18-alpine

WORKDIR /home/app

RUN addgroup -S app && adduser -S app -G app

COPY --from=build /home/app/node_modules ./node_modules
COPY --from=build /home/app/package.json ./
COPY --from=build /home/app/server.js ./
COPY --from=build /home/app/index.html ./
COPY --from=build /home/app/pictures ./pictures

USER app

EXPOSE 3000
CMD ["node", "server.js"]



