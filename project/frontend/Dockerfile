FROM node:20-alpine

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm install

COPY . .

EXPOSE 5173

# npm install runs again at startup (not just build time): the named volume for
# node_modules (see docker-compose.yml) starts empty on first run, so this fills
# it in. Fast no-op on later restarts since the lockfile usually hasn't changed.
CMD ["sh", "-c", "npm install && npm run dev -- --host 0.0.0.0"]
