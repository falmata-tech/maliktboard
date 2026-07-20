FROM node:22-bookworm-slim
WORKDIR /app
COPY package.json package-lock.json ./
COPY apps/web/package.json apps/web/package.json
COPY packages/domain/package.json packages/domain/package.json
RUN npm ci
COPY . .
RUN DATABASE_PATH=/tmp/maliktboard-build.db UPLOAD_DIR=/tmp/maliktboard-build-uploads SEED_DEMO=true npm run build \
  && rm -rf /tmp/maliktboard-build.db* /tmp/maliktboard-build-uploads
ENV NODE_ENV=production
EXPOSE 3000
CMD ["npm","start"]
