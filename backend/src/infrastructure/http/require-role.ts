import { AppError } from "@/infrastructure/http/error-middleware";
import { logger } from "@/lib/logger";

type RoleContext = {
  accountId?: string;
  action?: string;
  resourceId?: string;
};

export function requireRole(roles: string[] | null | undefined, allowed: string[], context?: RoleContext) {
  if (!roles || !allowed.some((role) => roles.includes(role))) {
    logger.warn("Forbidden role access", {
      roles,
      allowed,
      ...context,
    });
    throw new AppError("Forbidden", 403, "FORBIDDEN");
  }
}
