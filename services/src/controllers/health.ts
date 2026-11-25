import type { FastifyReply, FastifyRequest } from "fastify";
import type { QueryExecutor } from "../config/db.js";
import { ServiceUnavailableError } from "../errors/app-error.js";

export class HealthController {
  constructor(private readonly db: QueryExecutor) {}

  getLiveness = async (_request: FastifyRequest, _reply: FastifyReply) => {
    return {
      status: "ok",
      service: "ancillary-service",
      timestamp: new Date().toISOString(),
    };
  };

  getReadiness = async (_request: FastifyRequest, _reply: FastifyReply) => {
    try {
      await this.db.query("SELECT 1;");
      return {
        success: true,
        status: "ready",
        service: "ancillary-service",
        database: "connected",
        timestamp: new Date().toISOString(),
      };
    } catch {
      throw new ServiceUnavailableError(
        "Koneksi ke basis data PostgreSQL belum siap."
      );
    }
  };
}
