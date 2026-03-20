import { Request, Response, NextFunction } from "express";
import { createRefreshToken, createUser, getUserByEmail, updateUser } from "../db/queries.js";
import { BadRequestError } from "../customErrors.js";
import { checkPasswordHash, getBearerToken, hashPassword, makeJWT, validateJWT } from "../db/auth.js";
import { config } from "../config.js";

export async function addUserHandler(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      throw new BadRequestError("Missing required fields");
    }

    const hashed_password = await hashPassword(password);

    // ✅ FIX: pass object, not string
    const user = await createUser({ email, hashed_password });

    if (!user) {
      throw new Error("Could not create user");
    }

    res.status(201).json({
      id: user.id,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      email: user.email,
      isChirpyRed: user.is_chirpy_red,
    });

  } catch (err) {
    next(err);
  }
}

export async function loginUserHandler(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const { email, password } = req.body; // remove expiresInSeconds

    if (!email || !password) {
      return res.status(401).json({ error: "Incorrect email or password" });
    }

    const user = await getUserByEmail(email);

    if (!user) {
      return res.status(401).json({ error: "Incorrect email or password" });
    }

    const isMatch = await checkPasswordHash(password, user.hashed_password);

    if (!isMatch) {
      return res.status(401).json({ error: "Incorrect email or password" });
    }

    const token = makeJWT(user.id, 3600, config.jwtSecret); // always 1 hour
    const refreshToken = await createRefreshToken(user.id);

    res.status(200).json({
      id: user.id,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      email: user.email,
      token,
      refreshToken: refreshToken.token,
      isChirpyRed: user.is_chirpy_red,
    });

  } catch (err) {
    next(err);
  }
}


export async function updateUserHandler(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const token = getBearerToken(req);
    const userId = validateJWT(token, config.jwtSecret);

    const { email, password } = req.body;

    if (!email || !password) {
      throw new BadRequestError("Email and password are required");
    }

    const hashedPassword = await hashPassword(password);
    const user = await updateUser(userId, email, hashedPassword);

    res.status(200).json({
      id: user.id,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      email: user.email,
      isChirpyRed: user.is_chirpy_red,
    });

  } catch (err) {
    next(err);
  }
}