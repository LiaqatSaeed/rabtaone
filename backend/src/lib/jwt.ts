import jwt from "jsonwebtoken";
import { env } from "@/config/env";

export type JwtPayload = {
  sub: string;
  roles: string[];
};

export function signAccessToken(payload: JwtPayload) {
  return jwt.sign(payload, env.JWT_SECRET, { expiresIn: env.JWT_EXPIRES_IN });
}

export function verifyToken(token: string) {
  const decoded = jwt.verify(token, env.JWT_SECRET) as JwtPayload & { role?: string };
  if (!decoded.roles && decoded.role) {
    decoded.roles = [decoded.role];
  }
  return decoded as JwtPayload;
}
