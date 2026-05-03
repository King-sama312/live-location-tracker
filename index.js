import "dotenv/config";

import http from "node:http";

import express from "express";

import { Server } from "socket.io";

import path from "node:path";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

import { kafkaClient } from "./kafka-client.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function main() {
  const PORT = process.env.PORT ?? 8080;

  const app = express();
  const server = http.createServer(app);
  const io = new Server();

  const kafkaProducer = kafkaClient.producer();
  await kafkaProducer.connect();

  const kafkaConsumer = kafkaClient.consumer({
    groupId: `socket-server-${PORT}`,
  });
  await kafkaConsumer.connect();

  await kafkaConsumer.subscribe({
    topics: ["location-updates"],
    fromBeginning: true,
  });

  kafkaConsumer.run({
    eachMessage: async ({ topic, partition, message, heartbeat }) => {
      const data = JSON.parse(message.value.toString());
      console.log(`KafkaConsumer Data Received`, { data });
      io.emit("server:location:update", {
        id: data.id,
        latitude: data.latitude,
        longitude: data.longitude,
      });
      await heartbeat();
    },
  });

  io.attach(server);

  io.on("connection", (socket) => {
    console.log(`[Socket:${socket.id}] Connected successfully..`);

    socket.on("client:location:update", async (locationData) => {
      const { latitude, longitude } = locationData;
      console.log(`[Socket:${socket.id}]:client:location:update`, locationData);

      await kafkaProducer.send({
        topic: "location-updates",
        messages: [
          {
            key: socket.id,
            value: JSON.stringify({ id: socket.id, latitude, longitude }),
          },
        ],
      });
    });
  });

  app.use(express.static(join(__dirname, "public")));

  app.get("/health", (req, res) => {
    return res.json({ healthy: true });
  });

  server.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
  });
}

main();
