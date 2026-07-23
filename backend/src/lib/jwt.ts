import jwt from "jsonwebtoken";
import { env } from "@/config/env";
import { AppError } from "@/infrastructure/http/error-middleware";

export type JwtPayload = {
  sub: string;
  roles: string[];
};

export function signAccessToken(payload: JwtPayload) {
  return jwt.sign(payload, env.JWT_SECRET, { expiresIn: env.JWT_EXPIRES_IN });
}

export function verifyToken(token: string) {
  let decoded: JwtPayload & { role?: string };
  try {
    decoded = jwt.verify(token, env.JWT_SECRET) as JwtPayload & { role?: string };
  } catch {
    throw new AppError("Session expired, please log in again", 401, "UNAUTHORIZED");
  }
  if (!decoded.roles && decoded.role) {
    decoded.roles = [decoded.role];
  }
  return decoded as JwtPayload;
}
