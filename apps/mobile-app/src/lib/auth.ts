import { decodeJwt } from "@rabtaone/api-client";
import type { JwtPayload } from "@rabtaone/types";

export function getUserFromToken() {
  const token = typeof window !== "undefined" ? localStorage.getItem("jwt") : null;
  if (!token) return null;
  return decodeJwt(token) as JwtPayload | null;
}
