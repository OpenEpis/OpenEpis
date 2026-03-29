import type { User } from "@openepis/types";
import type { CreateInput, UpdateInput } from "../types.js";

export interface IUserStorage {
  findById(id: string): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  create(data: CreateInput<User>): Promise<User>;
  update(id: string, data: UpdateInput<User>): Promise<User>;
  delete(id: string): Promise<void>;
}
