/**
 * Converts Drizzle row Date fields to ISO strings to match @openepis/types.
 * Drizzle returns `Date` objects for timestamptz columns, but our entity
 * interfaces use `string` for serialization consistency.
 */
export function mapRow<T>(row: Record<string, unknown>): T {
  const mapped: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(row)) {
    mapped[key] = value instanceof Date ? value.toISOString() : value;
  }
  return mapped as T;
}

export function mapRows<T>(rows: Record<string, unknown>[]): T[] {
  return rows.map((row) => mapRow<T>(row));
}
