import { Kafka } from "kafkajs";

export const kafkaClient = new Kafka({
  clientId: "kingsama",
  brokers: ["localhost:9092"],
});
