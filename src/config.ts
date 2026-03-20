import { DBConfig, dbconfig } from "./db/dbconfig.js";

process.loadEnvFile();

type APIConfig = {
  fileserverHits: number;
  dbconfig: DBConfig;
  platform: string;
  jwtSecret: string;
  polkaKey: string;
};

export const config : APIConfig = {
  fileserverHits: 0,
  dbconfig: dbconfig,
  platform: process.env.PLATFORM!,
  jwtSecret: process.env.JWT_SECRET!,
  polkaKey: process.env.POLKA_KEY ?? "",
};
