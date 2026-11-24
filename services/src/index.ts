import Fastify from "fastify";
import cors from "@fastify/cors";
import helmet from "@fastify/helmet";

const fastify = Fastify({
  logger: true,
});

await fastify.register(cors, {
  origin: true,
});

await fastify.register(helmet);

// Health check endpoint
fastify.get("/health", async () => {
  return {
    status: "ok",
    service: "ancillary-service",
    timestamp: new Date().toISOString(),
  };
});

const start = async () => {
  try {
    const port = Number(process.env.PORT) || 4000;
    const host = process.env.HOST || "0.0.0.0";
    await fastify.listen({ port, host });
    fastify.log.info(`Ancillary service running on http://${host}:${port}`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
