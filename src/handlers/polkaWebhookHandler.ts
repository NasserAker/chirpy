import { Request, Response, NextFunction } from "express";
import { upgradeUserToChirpyRed } from "../db/queries.js";
import { getAPIKey } from "../db/auth.js";
import { config } from "../config.js";
import { NotFoundError, UnauthorizedError } from "../customErrors.js";

export async function polkaWebhookHandler(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const apiKey = getAPIKey(req);

    if (apiKey !== config.polkaKey) {
      throw new UnauthorizedError("Invalid API key");
    }

    const { event, data } = req.body;

    if (event !== "user.upgraded") {
      return res.status(204).send();
    }

    const user = await upgradeUserToChirpyRed(data.userId);

    if (!user) {
      throw new NotFoundError("User not found");
    }

    res.status(204).send();

  } catch (err) {
    next(err);
  }
}