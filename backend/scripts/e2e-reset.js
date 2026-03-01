/* eslint-disable no-console */
import { PrismaClient } from "@prisma/client";
import fs from "fs/promises";

const prisma = new PrismaClient();

const E2E_EMAILS = [
  "e2e_user@rabtaone.test",
  "e2e_merchant@rabtaone.test",
  "e2e_rider@rabtaone.test",
  "e2e_admin@rabtaone.test",
];

async function deleteLocalFile(path) {
  try {
    await fs.unlink(path);
    return true;
  } catch {
    return false;
  }
}

async function main() {
  if (process.env.E2E_MODE !== "true") {
    console.error("E2E_MODE must be true to run reset.");
    process.exit(1);
  }

  const hard = process.argv.includes("--hard");
  if (hard && process.env.FORCE !== "1") {
    console.error("--hard requires FORCE=1 to proceed.");
    process.exit(1);
  }

  const accounts = await prisma.account.findMany({
    where: { email: { in: E2E_EMAILS } },
    select: { id: true },
  });
  const accountIds = accounts.map((a) => a.id);

  const userProfiles = await prisma.userProfile.findMany({
    where: { accountId: { in: accountIds } },
    select: { id: true },
  });
  const merchantProfiles = await prisma.merchantProfile.findMany({
    where: { accountId: { in: accountIds } },
    select: { id: true },
  });
  const deliveryProfiles = await prisma.deliveryProfile.findMany({
    where: { accountId: { in: accountIds } },
    select: { id: true },
  });

  const userIds = userProfiles.map((p) => p.id);
  const merchantIds = merchantProfiles.map((p) => p.id);
  const riderIds = deliveryProfiles.map((p) => p.id);

  const orders = await prisma.order.findMany({
    where: {
      OR: [
        userIds.length ? { userId: { in: userIds } } : undefined,
        merchantIds.length ? { merchantId: { in: merchantIds } } : undefined,
      ].filter(Boolean),
    },
    select: { id: true },
  });
  const orderIds = orders.map((o) => o.id);

  const threads = await prisma.chatThread.findMany({
    where: { orderId: { in: orderIds } },
    select: { id: true },
  });
  const threadIds = threads.map((t) => t.id);

  const deleteCounts = {
    chatMessages: 0,
    chatThreads: 0,
    proposals: 0,
    syncRequests: 0,
    deliveryDrafts: 0,
    orderItems: 0,
    orderStatusEvents: 0,
    syncEvents: 0,
    deliveryJobs: 0,
    deliveryBids: 0,
    deliveryLocations: 0,
    orders: 0,
    uploadedFiles: 0,
    sessions: 0,
    notifications: 0,
    userProfiles: 0,
    merchantProfiles: 0,
    deliveryProfiles: 0,
    accounts: 0,
  };

  if (threadIds.length) {
    deleteCounts.chatMessages = (await prisma.chatMessage.deleteMany({ where: { threadId: { in: threadIds } } })).count;
    deleteCounts.chatThreads = (await prisma.chatThread.deleteMany({ where: { id: { in: threadIds } } })).count;
  }

  let jobIds = [];
  if (orderIds.length) {
    const jobs = await prisma.deliveryJob.findMany({
      where: { orderId: { in: orderIds } },
      select: { id: true },
    });
    jobIds = jobs.map((j) => j.id);
  }

  if (jobIds.length) {
    deleteCounts.deliveryLocations = (
      await prisma.deliveryLocation.deleteMany({ where: { jobId: { in: jobIds } } })
    ).count;
    deleteCounts.deliveryBids = (await prisma.deliveryBid.deleteMany({ where: { jobId: { in: jobIds } } })).count;
  }

  if (riderIds.length) {
    const bidCount = await prisma.deliveryBid.deleteMany({ where: { courierId: { in: riderIds } } });
    deleteCounts.deliveryBids += bidCount.count;
  }

  if (orderIds.length) {
    deleteCounts.proposals = (await prisma.proposal.deleteMany({ where: { orderId: { in: orderIds } } })).count;
    deleteCounts.syncRequests = (await prisma.syncRequest.deleteMany({ where: { orderId: { in: orderIds } } })).count;
    deleteCounts.deliveryDrafts = (await prisma.deliveryDraft.deleteMany({ where: { orderId: { in: orderIds } } })).count;
    deleteCounts.orderItems = (await prisma.orderItem.deleteMany({ where: { orderId: { in: orderIds } } })).count;
    deleteCounts.orderStatusEvents = (
      await prisma.orderStatusEvent.deleteMany({ where: { orderId: { in: orderIds } } })
    ).count;
    deleteCounts.syncEvents = (await prisma.syncEvent.deleteMany({ where: { orderId: { in: orderIds } } })).count;
    deleteCounts.deliveryJobs = (await prisma.deliveryJob.deleteMany({ where: { orderId: { in: orderIds } } })).count;
  }

  if (orderIds.length) {
    const files = await prisma.uploadedFile.findMany({ where: { orderId: { in: orderIds } } });
    for (const file of files) {
      if (file.storageType === "LOCAL" && file.storageKey) {
        await deleteLocalFile(file.storageKey);
      }
    }
    deleteCounts.uploadedFiles = (await prisma.uploadedFile.deleteMany({ where: { orderId: { in: orderIds } } })).count;
  }

  if (orderIds.length) {
    deleteCounts.orders = (await prisma.order.deleteMany({ where: { id: { in: orderIds } } })).count;
  }

  if (accountIds.length) {
    deleteCounts.sessions = (await prisma.session.deleteMany({ where: { accountId: { in: accountIds } } })).count;
    deleteCounts.notifications = (
      await prisma.notification.deleteMany({ where: { accountId: { in: accountIds } } })
    ).count;
  }

  if (userIds.length) {
    deleteCounts.userProfiles = (await prisma.userProfile.deleteMany({ where: { id: { in: userIds } } })).count;
  }
  if (merchantIds.length) {
    deleteCounts.merchantProfiles = (
      await prisma.merchantProfile.deleteMany({ where: { id: { in: merchantIds } } })
    ).count;
  }
  if (riderIds.length) {
    deleteCounts.deliveryProfiles = (
      await prisma.deliveryProfile.deleteMany({ where: { id: { in: riderIds } } })
    ).count;
  }

  if (accountIds.length) {
    deleteCounts.accounts = (await prisma.account.deleteMany({ where: { id: { in: accountIds } } })).count;
  }

  console.log("E2E reset summary:");
  Object.entries(deleteCounts).forEach(([key, value]) => {
    console.log(`- ${key}: ${value}`);
  });

  if (hard) {
    console.log("Hard reset requested: no global truncation performed (safe mode). Use manual truncation if needed.");
  }
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
