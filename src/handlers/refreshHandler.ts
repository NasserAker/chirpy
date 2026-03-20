import { Request, Response, NextFunction } from "express";
import { getBearerToken } from "../db/auth.js";
import { getUserFromRefreshToken, getRefreshToken, revokeRefreshToken } from "../db/queries.js";
import { makeJWT } from "../db/auth.js";
import { config } from "../config.js";
import { UnauthorizedError } from "../customErrors.js";

export async function refreshHandler(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const token = getBearerToken(req);
    const refreshToken = await getRefreshToken(token);

    if (!refreshToken) {
      throw new UnauthorizedError("Invalid refresh token");
    }

    if (refreshToken.revokedAt) {
      throw new UnauthorizedError("Refresh token has been revoked");
    }

    if (refreshToken.expiresAt < new Date()) {
      throw new UnauthorizedError("Refresh token has expired");
    }

    const user = await getUserFromRefreshToken(token);

    if (!user) {
      throw new UnauthorizedError("User not found");
    }

    const accessToken = makeJWT(user.id, 3600, config.jwtSecret);

    res.status(200).json({ token: accessToken });

  } catch (err) {
    next(err);
  }
}

export async function revokeHandler(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const token = getBearerToken(req);
    const refreshToken = await getRefreshToken(token);

    if (!refreshToken) {
      throw new UnauthorizedError("Invalid refresh token");
    }

    await revokeRefreshToken(token);

    res.status(204).send();

  } catch (err) {
    next(err);
  }
}