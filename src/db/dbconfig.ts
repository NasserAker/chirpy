import { MigrationConfig } from "drizzle-orm/migrator";

export type DBConfig = {
  dbURL: string;
  migrationConfig: MigrationConfig;
};

export const dbconfig: DBConfig = {
  dbURL: "postgres://postgres:postgres@localhost:5432/chirpy?sslmode=disable",
  migrationConfig: {
    migrationsFolder: "./src/db",
  },
};