FROM node:20

WORKDIR /app

# Create data directory for SQLite
RUN mkdir -p /app/data

COPY package*.json ./

RUN npm install --production

COPY . .

EXPOSE 3000

CMD ["node", "server.js"]
