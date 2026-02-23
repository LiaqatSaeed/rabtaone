import { AppError } from "@/infrastructure/http/error-middleware";
import { logger } from "@/lib/logger";

type RoleContext = {
  accountId?: string;
  action?: string;
  resourceId?: string;
};

export function requireRole(role: string | null, allowed: string[], context?: RoleContext) {
  if (!role || !allowed.includes(role)) {
    logger.warn("Forbidden role access", {
      role,
      allowed,
      ...context,
    });
    throw new AppError("Forbidden", 403, "FORBIDDEN");
  }
}
