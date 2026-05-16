FROM node:20-slim

WORKDIR /app

COPY frontend/package.json /app/frontend/package.json
RUN cd /app/frontend && npm install

COPY . /app

EXPOSE 3000

CMD ["sh", "-c", "cd /app/frontend && npm run dev -- --hostname 0.0.0.0 --port 3000"]
