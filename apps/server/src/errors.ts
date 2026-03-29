import type { FastifyError, FastifyReply, FastifyRequest } from "fastify";
import type { ApiError } from "@openepis/types";

export class AppError extends Error {
  constructor(
    public statusCode: number,
    public code: string,
    message: string,
  ) {
    super(message);
  }
}

export function errorHandler(
  error: FastifyError,
  _request: FastifyRequest,
  reply: FastifyReply,
): void {
  if (error instanceof AppError) {
    const body: ApiError = {
      error: { code: error.code, message: error.message },
    };
    reply.status(error.statusCode).send(body);
    return;
  }

  const body: ApiError = {
    error: { code: "INTERNAL_ERROR", message: "Internal server error" },
  };
  reply.status(500).send(body);
}
