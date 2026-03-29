import "fastify";

export interface RequestUser {
  id: string;
  email: string;
  name: string;
}

declare module "fastify" {
  interface FastifyRequest {
    user: RequestUser;
  }
}
