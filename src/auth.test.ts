import { describe, it, expect, beforeAll } from "vitest";
import { makeJWT, validateJWT } from "./db/auth";



describe("JWT", () => {
  const userId = "f0f87ec2-a8b5-48cc-b66a-a85ce7c7b862";
  const secret = "test-secret";
  const wrongSecret = "wrong-secret";
  let validToken: string;

  beforeAll(() => {
    validToken = makeJWT(userId, 3600, secret); // 1 hour expiry
  });

  it("should create and validate a JWT successfully", () => {
    const result = validateJWT(validToken, secret);
    expect(result).toBe(userId);
  });

  it("should reject a token signed with the wrong secret", () => {
    expect(() => validateJWT(validToken, wrongSecret)).toThrow();
  });

  it("should reject an expired token", async () => {
    const expiredToken = makeJWT(userId, -1, secret); // already expired
    expect(() => validateJWT(expiredToken, secret)).toThrow();
  });

  it("should reject a malformed token", () => {
    expect(() => validateJWT("not.a.valid.jwt", secret)).toThrow();
  });
});