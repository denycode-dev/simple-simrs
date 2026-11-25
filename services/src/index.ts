import { buildApp } from "./app.js";
import { env } from "./config/env.js";

async function startServer(): Promise<void> {
  const app = await buildApp({ config: env, logger: true });

  let isShuttingDown = false;
  const shutdown = async (signal: string) => {
    if (isShuttingDown) return;
    isShuttingDown = true;

    app.log.info({ signal }, "Received termination signal, shutting down gracefully...");
    try {
      await app.close();
      app.log.info("Ancillary service closed cleanly.");
      process.exit(0);
    } catch (err) {
      app.log.error({ err }, "Error during graceful shutdown");
      process.exit(1);
    }
  };

  process.on("SIGINT", () => void shutdown("SIGINT"));
  process.on("SIGTERM", () => void shutdown("SIGTERM"));

  try {
    await app.listen({ port: env.PORT, host: env.HOST });
    app.log.info(
      `SIMRS Ancillary Service running on http://${env.HOST}:${env.PORT} (${env.NODE_ENV})`
    );
  } catch (err) {
    app.log.error({ err }, "Failed to start SIMRS Ancillary Service");
    process.exit(1);
  }
}

void startServer();
