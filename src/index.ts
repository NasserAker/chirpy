import express from "express";
import { handlerReadiness } from "./handlers/health.js";
import { middlewareIncrementFileServerHits, middlewareLogResponses } from "./middleware.js";
import { fileServerHitsHandler, resetFileServerHitsHandler } from "./handlers/hitsHandler.js";
import { createChirpHandler, deleteChirpHandler, getAllChirpsHandler, getChirpHandler } from "./handlers/chirpsHandler.js";
import { errorHandler } from "./handlers/errorHandler.js";import postgres from "postgres";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import { drizzle } from "drizzle-orm/postgres-js";
import { config } from "./config.js";
import { addUserHandler, loginUserHandler, updateUserHandler } from "./handlers/usersHandler.js";
import { db } from "./db/index.js";
import { migrationConfig } from "./db/MigrationConfig.js";
import { create } from "node:domain";
import { log } from "node:console";
import { refreshHandler, revokeHandler } from "./handlers/refreshHandler.js";
import { polkaWebhookHandler } from "./handlers/polkaWebhookHandler.js";


const migrationClient = postgres(config.dbconfig.dbURL, { max: 1 });
await migrate(drizzle(migrationClient), config.dbconfig.migrationConfig);

const app = express();
const PORT = 8080;
app.use(express.json());
app.use(errorHandler);
//app.use(middlewareIncrementFileServerHits);
app.use(middlewareLogResponses);
app.get("/api/healthz", handlerReadiness);
app.get("/admin/metrics", fileServerHitsHandler );
app.post("/admin/reset", resetFileServerHitsHandler);
app.post("/api/chirps", createChirpHandler);
app.post("/api/users", addUserHandler);
app.get("/api/chirps", getAllChirpsHandler);
app.get("/api/chirps/:chirpId", getChirpHandler);
app.post("/api/login", loginUserHandler);
app.post("/api/refresh", refreshHandler);
app.post("/api/revoke", revokeHandler);
app.put("/api/users", updateUserHandler);
app.delete("/api/chirps/:chirpId", deleteChirpHandler);
app.post("/api/polka/webhooks", polkaWebhookHandler);

app.use("/app",middlewareIncrementFileServerHits, express.static("./src/app"));


app.use(errorHandler);



app.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}`);
});