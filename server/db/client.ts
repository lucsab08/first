import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

const connectionString = process.env.DATABASE_URL;

declare global {
  // eslint-disable-next-line no-var
  var __syncfit_sql: ReturnType<typeof postgres> | undefined;
}

const hasDatabase = Boolean(connectionString);

const client =
  global.__syncfit_sql ??
  (connectionString
    ? postgres(connectionString, {
        max: 10,
        prepare: false,
      })
    : // When DATABASE_URL is missing we still export a Drizzle object
      // but every query will throw. All routers check the mock fallback first.
      undefined);

if (process.env.NODE_ENV !== "production" && client) {
  global.__syncfit_sql = client;
}

export const db = client
  ? drizzle(client, { schema, casing: "snake_case" })
  : (null as unknown as ReturnType<typeof drizzle<typeof schema>>);

export const isDatabaseConnected = hasDatabase;
export { schema };
