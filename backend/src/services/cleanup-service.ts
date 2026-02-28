import { prisma } from "@/infrastructure/db/prisma";
import { logger } from "@/lib/logger";
import fs from "fs/promises";

const ONE_HOUR_MS = 60 * 60 * 1000;
const CHAT_TTL_MS = 24 * ONE_HOUR_MS;
const FILE_TTL_MS = 48 * ONE_HOUR_MS;
const ORDER_TTL_MS = 72 * ONE_HOUR_MS;

async function deleteLocalFile(path: string) {
  try {
    await fs.unlink(path);
    return true;
  } catch (err) {
    logger.warn("Failed to delete local file", { path, error: err instanceof Error ? err.message : err });
    return false;
  }
}

export const cleanupService = {
  async cleanupExpiredChats() {
    const cutoff = new Date(Date.now() - CHAT_TTL_MS);
    const result = await prisma.chatMessage.deleteMany({ where: { createdAt: { lt: cutoff } } });
    return result.count;
  },

  async cleanupExpiredFiles() {
    const cutoff = new Date(Date.now() - FILE_TTL_MS);
    const files = await prisma.uploadedFile.findMany({ where: { createdAt: { lt: cutoff } } });

    const deletableIds: string[] = [];
    for (const file of files) {
      if (file.storageType === "LOCAL" && file.storageKey) {
        const ok = await deleteLocalFile(file.storageKey);
        if (ok) deletableIds.push(file.id);
      } else if (file.storageType === "S3") {
        // Placeholder: use your own S3 delete integration.
        // For now, we skip physical deletion but still remove the DB record.
        deletableIds.push(file.id);
      } else {
        deletableIds.push(file.id);
      }
    }

    if (deletableIds.length === 0) return 0;
    const result = await prisma.uploadedFile.deleteMany({ where: { id: { in: deletableIds } } });
    return result.count;
  },

  async anonymizeOldOrders() {
    const cutoff = new Date(Date.now() - ORDER_TTL_MS);
    const result = await prisma.order.updateMany({
      where: {
        createdAt: { lt: cutoff },
        anonymizedAt: null,
      },
      data: {
        notes: null,
        shipPhone: null,
        shipAddress1: null,
        shipAddress2: null,
        shipCity: null,
        shipState: null,
        shipPostalCode: null,
        shipCountry: null,
        anonymizedAt: new Date(),
      },
    });

    return result.count;
  },

  async runAll() {
    const [chats, files, orders] = await Promise.all([
      this.cleanupExpiredChats(),
      this.cleanupExpiredFiles(),
      this.anonymizeOldOrders(),
    ]);

    logger.info("Cleanup summary", { chatsDeleted: chats, filesDeleted: files, ordersAnonymized: orders });
  },
};
