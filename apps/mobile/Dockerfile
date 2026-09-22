FROM node:22-alpine AS development
WORKDIR /workspace
COPY package.json package-lock.json ./
COPY apps/mobile/package.json ./apps/mobile/package.json
RUN npm ci --workspace @the-hive/mobile --include-workspace-root
COPY apps/mobile ./apps/mobile
EXPOSE 8081 19000 19001 19002
CMD ["npm", "run", "start", "--workspace", "@the-hive/mobile", "--", "--host", "lan", "--port", "8081"]
