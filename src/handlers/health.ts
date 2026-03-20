import { Request, Response } from "express";

export const handlerReadiness = (req: Request, res: Response): void => {
  res
    .set("Content-Type", "text/plain; charset=utf-8")
    .send("OK");
};