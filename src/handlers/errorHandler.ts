import { Request, Response, NextFunction } from "express";
import { HTTPError } from "../customErrors.js";

export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction,
) {
    if (err instanceof HTTPError) {
        return res.status(err.statusCode).json({
        error: err.message,
    });
  }

  console.error("error: Something went wrong on our end");
  res.status(500).json({
    error: "Something went wrong on our end",
  });
}

