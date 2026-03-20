import { Request, Response } from "express";
import { config } from "../config.js";
import fs from "fs";
import path from "path";
import { deleteAllUsers } from "../db/queries.js";
import { ForbiddenError } from "../customErrors.js";

export const fileServerHitsHandler = (req: Request, res: Response): void => {
  const filePath = path.join(process.cwd(), "src/app/metrics.html");

  let html = fs.readFileSync(filePath, "utf-8");

  html = html.replace("{{hits}}", config.fileserverHits.toString());

  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.status(200).send(html);
};

export const resetFileServerHitsHandler = async (req: Request, res: Response): Promise<void> => {
  if (config.platform !== "dev") {
    console.log(config.platform);
    throw new ForbiddenError("Reset is only allowed in dev environment.");
  }
  config.fileserverHits = 0;
  await deleteAllUsers();

  res.write("Hits reset to 0");
  res.end();
  };