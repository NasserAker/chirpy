import { db } from "./index.js";
import { chirps, NewUser, users, refresh_tokens } from "./schema.js";
import { asc, eq } from "drizzle-orm";
import crypto from "crypto";

export async function createUser(user: NewUser) {
  const [result] = await db
    .insert(users)
    .values(user)
    .onConflictDoUpdate({
      target: users.email,
      set: { email: user.email },
    })
    .returning();

  return result;
}

export async function deleteAllUsers() {
  await db.delete(users);
}


export async function createChirp(chirp: any) {
  const [result] = await db
    .insert(chirps)
    .values(chirp)
    .returning();

  return result;
}

export async function getAllChirps(authorId?: string) {
  if (authorId) {
    return db
      .select()
      .from(chirps)
      .where(eq(chirps.userId, authorId))
      .orderBy(asc(chirps.createdAt));
  }

  return db.select().from(chirps).orderBy(asc(chirps.createdAt));
}


export async function getChirpById(id: string) {
  const [result] = await db.select().from(chirps).where(eq(chirps.id, id));
  return result;
}


export async function getUserByEmail(email: string) {
  const [result] = await db.select().from(users).where(eq(users.email, email));
  return result;
}


// queries.ts
export async function createRefreshToken(userId: string) {
  const token = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + 60 * 24 * 60 * 60 * 1000); // 60 days

  const [result] = await db.insert(refresh_tokens).values({
    token,
    userId,
    expiresAt,
  }).returning();

  return result;
}


export async function getUserFromRefreshToken(token: string) {
  const [result] = await db
    .select({ user: users })
    .from(refresh_tokens)
    .innerJoin(users, eq(refresh_tokens.userId, users.id))
    .where(eq(refresh_tokens.token, token));

  return result?.user;
}

export async function revokeRefreshToken(token: string) {
  await db
    .update(refresh_tokens)
    .set({ revokedAt: new Date(), updatedAt: new Date() })
    .where(eq(refresh_tokens.token, token));
}

export async function getRefreshToken(token: string) {
  const [result] = await db
    .select()
    .from(refresh_tokens)
    .where(eq(refresh_tokens.token, token));

  return result;
}

export async function updateUser(userId: string, email: string, hashedPassword: string) {
  const [result] = await db
    .update(users)
    .set({ email, hashed_password: hashedPassword, updatedAt: new Date() })
    .where(eq(users.id, userId))
    .returning();

  return result;
}

export async function deleteChirp(chirpId: string) {
  await db.delete(chirps).where(eq(chirps.id, chirpId));
}


export async function upgradeUserToChirpyRed(userId: string) {
  const [result] = await db
    .update(users)
    .set({ is_chirpy_red: true, updatedAt: new Date() })
    .where(eq(users.id, userId))
    .returning();

  return result;
}