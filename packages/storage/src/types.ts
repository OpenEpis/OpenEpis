/**
 * Utility types for storage input/output.
 *
 * CreateInput<T> strips server-generated fields so callers only provide
 * the fields they control.
 *
 * UpdateInput<T> makes every non-generated field optional for partial updates.
 */
export type CreateInput<T> = Omit<T, "id" | "created_at" | "updated_at">;

export type UpdateInput<T> = Partial<Omit<T, "id" | "created_at" | "updated_at">>;
