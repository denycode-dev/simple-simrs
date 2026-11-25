import type { FastifyReply, FastifyRequest, preHandlerHookHandler } from "fastify";
import { ForbiddenError, UnauthorizedError } from "../errors/app-error.js";
import type {
  AuthenticatedUser,
  AuthRepository,
  SimrsRole,
} from "../repositories/auth.repository.js";

declare module "fastify" {
  interface FastifyRequest {
    user: AuthenticatedUser | null;
  }
}

export interface AuthGuardOptions {
  authRepo: AuthRepository;
  authRequired: boolean;
}

function extractBearerToken(authorizationHeader: string | undefined): string | null {
  if (!authorizationHeader) return null;
  const parts = authorizationHeader.trim().split(/\s+/);
  if (parts.length !== 2 || parts[0].toLowerCase() !== "bearer" || !parts[1]) {
    throw new UnauthorizedError("Format header Authorization harus menggunakan skema Bearer token.");
  }
  return parts[1];
}

/**
 * Resolves Bearer token whenever provided (always rejecting invalid tokens with 401),
 * and enforces RBAC role permissions per SIMRS RBAC Matrix.
 * When `authRequired` is false (local dev default), unauthenticated browser requests
 * pass through while still enforcing strict token & RBAC validation whenever a token is sent.
 */
export function createRoleGuard(
  options: AuthGuardOptions,
  allowedRoles: readonly SimrsRole[]
): preHandlerHookHandler {
  return async (request: FastifyRequest, _reply: FastifyReply) => {
    const rawHeader = request.headers.authorization;
    const token = extractBearerToken(rawHeader);

    if (!token) {
      if (options.authRequired) {
        throw new UnauthorizedError(
          "Autentikasi diperlukan. Silakan sertakan Bearer token yang valid."
        );
      }
      request.user = null;
      return;
    }

    const user = await options.authRepo.findActiveUserByToken(token);
    if (!user) {
      throw new UnauthorizedError("Token autentikasi tidak valid atau sesi telah berakhir.");
    }

    request.user = user;

    if (!allowedRoles.includes(user.role)) {
      throw new ForbiddenError(
        `Akses ditolak. Peran '${user.role}' tidak memiliki izin untuk mengakses fitur ini.`
      );
    }
  };
}
