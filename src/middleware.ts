import { Request, Response } from "express";
import { config } from "./config.js";

export function middlewareLogResponses(req: Request, res: Response, next: () => void): void {
  res.on("finish", () => {
    if(res.statusCode !== 200){
        console.log(`[NON-OK] ${req.method} ${req.url} - Status: ${res.statusCode}`);
    }
  });
  next();
};


export function middlewareIncrementFileServerHits(req: Request, res: Response, next: () => void): void{
  config.fileserverHits++;
    next();
};