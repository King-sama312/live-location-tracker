import "dotenv/config";

import http from "node:http";

import express from "express";

import { Server } from "socket.io";

import path from "node:path";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function main() {
  const PORT = process.env.PORT ?? 8080;

  const app = express();
  const server = http.createServer(app);
  const io = new Server();

  io.attach(server);

  app.use(express.static(join(__dirname, "public")));

  app.get("/health", (req, res) => {
    return res.json({ healthy: true });
  });

  server.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
  });
}

main();
