import { Request, Response, NextFunction } from "express";
import { BadRequestError, ForbiddenError, NotFoundError } from "../customErrors.js";
import { createChirp, deleteChirp, getAllChirps, getChirpById } from "../db/queries.js";
import { getBearerToken, validateJWT } from "../db/auth.js";
import { config } from "../config.js";

export async function createChirpHandler(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const { body } = req.body;

    // Get and validate JWT
    const token = getBearerToken(req );
    const userId = validateJWT(token, config.jwtSecret);

    // Validate inputs
    if (typeof body !== "string") {
      throw new BadRequestError("Invalid request body");
    }

    if (body.length > 140) {
      throw new BadRequestError("Chirp is too long. Max length is 140");
    }

    // Clean bad words
    const badWords = ["kerfuffle", "sharbert", "fornax"];
    let cleaned = body;

    for (const word of badWords) {
      const regex = new RegExp(word, "gi");
      cleaned = cleaned.replace(regex, "****");
    }

    // Create chirp in DB
    const chirp = await createChirp({
      body: cleaned,
      userId,
    });

    if (!chirp) {
      throw new Error("Could not create chirp");
    }

    res.status(201).json({
      id: chirp.id,
      createdAt: chirp.createdAt,
      updatedAt: chirp.updatedAt,
      body: chirp.body,
      userId: chirp.userId,
    });

  } catch (err) {
    next(err);
  }
}

export async function getAllChirpsHandler(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    let authorId = "";
    const authorIdQuery = req.query.authorId;
    if (typeof authorIdQuery === "string") {
      authorId = authorIdQuery;
    }

    const sortQuery = req.query.sort;
    const sortDesc = sortQuery === "desc";

    const result = await getAllChirps(authorId || undefined);

    const sorted = result.sort((a, b) => {
      const diff = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      return sortDesc ? -diff : diff;
    });

    res.status(200).json(sorted.map(chirp => ({
      id: chirp.id,
      createdAt: chirp.createdAt,
      updatedAt: chirp.updatedAt,
      body: chirp.body,
      userId: chirp.userId,
    })));

  } catch (err) {
    next(err);
  }
}


export async function getChirpHandler(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const { chirpId } = req.params as { chirpId: string };

    const chirp = await getChirpById(chirpId);

    if (!chirp) {
      return res.status(404).json({ error: "Chirp not found" });
    }

    res.status(200).json({
      id: chirp.id,
      createdAt: chirp.createdAt,
      updatedAt: chirp.updatedAt,
      body: chirp.body,
      userId: chirp.userId,
    });

  } catch (err) {
    next(err);
  }
}



export async function deleteChirpHandler(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const token = getBearerToken(req);
    const userId = validateJWT(token, config.jwtSecret);

    const { chirpId } = req.params;
    const chirp = await getChirpById(chirpId as string);

    if (!chirp) {
      throw new NotFoundError("Chirp not found");
    }

    if (chirp.userId !== userId) {
      throw new ForbiddenError("You are not the author of this chirp");
    }

    await deleteChirp(chirpId as string);

    res.status(204).send();

  } catch (err) {
    next(err);
  }
}
