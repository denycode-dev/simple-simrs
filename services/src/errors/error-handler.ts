import type { FastifyError, FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { ZodError } from "zod";
import { AppError } from "./app-error.js";

export function formatZodFieldErrors(error: ZodError): Record<string, string[]> {
  const fieldErrors: Record<string, string[]> = {};

  for (const issue of error.issues) {
    const pathKey = issue.path.length > 0 ? issue.path.join(".") : "payload";
    if (!fieldErrors[pathKey]) {
      fieldErrors[pathKey] = [];
    }
    if (!fieldErrors[pathKey].includes(issue.message)) {
      fieldErrors[pathKey].push(issue.message);
    }
  }

  return fieldErrors;
}

interface PostgresErrorLike {
  code?: string;
  constraint?: string;
}

export function registerErrorHandlers(fastify: FastifyInstance): void {
  fastify.setNotFoundHandler((request: FastifyRequest, reply: FastifyReply) => {
    return reply.status(404).send({
      success: false,
      message: `Endpoint ${request.method} ${request.url} tidak ditemukan.`,
    });
  });

  fastify.setErrorHandler(
    (error: FastifyError | Error, request: FastifyRequest, reply: FastifyReply) => {
      if (error instanceof ZodError) {
        const errors = formatZodFieldErrors(error);
        const firstMessage = Object.values(errors).flat()[0];
        return reply.status(422).send({
          success: false,
          message: firstMessage || "Validasi input gagal.",
          errors,
        });
      }

      if (error instanceof AppError) {
        return reply.status(error.statusCode).send({
          success: false,
          message: error.message,
          ...(error.errors && Object.keys(error.errors).length > 0
            ? { errors: error.errors }
            : {}),
        });
      }

      // Fastify JSON body / content-type parsing errors
      const fastifyStatus = (error as FastifyError).statusCode;
      if (fastifyStatus === 400 || (error as FastifyError).code?.startsWith("FST_ERR_CTP_")) {
        return reply.status(400).send({
          success: false,
          message: "Format permintaan atau payload JSON tidak valid.",
        });
      }

      if (fastifyStatus === 413) {
        return reply.status(413).send({
          success: false,
          message: "Ukuran payload permintaan melebihi batas maksimum yang diizinkan.",
        });
      }

      // PostgreSQL integrity constraint error mapping without leaking SQL details
      const pgCode = (error as PostgresErrorLike).code;
      if (pgCode === "23505") {
        return reply.status(409).send({
          success: false,
          message: "Data dengan nomor atau kode unik tersebut sudah terdaftar.",
        });
      }
      if (pgCode === "23503") {
        return reply.status(422).send({
          success: false,
          message: "Referensi data terkait tidak ditemukan atau tidak valid.",
        });
      }
      if (pgCode === "23514") {
        return reply.status(422).send({
          success: false,
          message: "Data melanggar aturan validasi integritas basis data.",
        });
      }

      request.log.error(
        {
          err: error,
          method: request.method,
          url: request.url,
          userId: request.user?.id ?? null,
        },
        "Unhandled internal server error"
      );

      return reply.status(500).send({
        success: false,
        message:
          "Terjadi kesalahan internal pada layanan penunjang. Silakan hubungi administrator sistem.",
      });
    }
  );
}
