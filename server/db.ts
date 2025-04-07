import pg from "pg";

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?"
  );
}

// Create a PostgreSQL connection pool
export const db = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
});
