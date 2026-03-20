import argon2 from "argon2";
import jwt, { JwtPayload } from "jsonwebtoken";
import { UnauthorizedError } from "../customErrors.js";
import type { Request } from "express";
import crypto from "crypto";

type payload = Pick<JwtPayload, "iss" | "sub" | "iat" | "exp">;



export function hashPassword(password: string): Promise<string> {
  return argon2.hash(password);
}

export function checkPasswordHash(password: string, hash: string): Promise<boolean> {
  return argon2.verify(hash, password);
}

export function makeJWT(userID: string, expiresIn: number, secret: string): string {
  return jwt.sign({ sub: userID }, secret, { expiresIn });
}

export function validateJWT(tokenString: string, secret: string): string {
try {
    const decoded = jwt.verify(tokenString, secret);
    
    if (typeof decoded === "string" || !decoded.sub) {
      throw new UnauthorizedError("Invalid token");
    }

    return decoded.sub as string;
  } catch (err) {
    throw new UnauthorizedError("Invalid or expired token");
  }
}


export function getBearerToken(req: Request): string {
  const authHeader = req.headers["authorization"];
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    throw new UnauthorizedError("Missing or invalid Authorization header");
  }
  return authHeader.substring(7);
}


export function makeRefreshToken(userID: string, expiresIn: number, secret: string): string {
    const token = crypto.randomBytes(32).toString("hex");
  return jwt.sign({ sub: userID }, secret, { expiresIn });
}


export function getAPIKey(req: Request): string {
  const authHeader = req.headers["authorization"];

  if (!authHeader || !authHeader.startsWith("ApiKey ")) {
    throw new UnauthorizedError("Missing or invalid API key");
  }

  return authHeader.substring(7);
}