import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const userEmail = process.env.SEED_USER_EMAIL || "user@example.com";
const userPassword = process.env.SEED_USER_PASSWORD || "password123";
const merchantEmail = process.env.SEED_MERCHANT_EMAIL || "merchant@example.com";
const merchantPassword = process.env.SEED_MERCHANT_PASSWORD || "password123";
const industryType = process.env.SEED_MERCHANT_INDUSTRY || "GENERIC";

async function ensureUser() {
  const existing = await prisma.account.findUnique({ where: { email: userEmail } });
  if (existing) return existing;
  const passwordHash = await bcrypt.hash(userPassword, 12);
  return prisma.account.create({
    data: {
      email: userEmail,
      passwordHash,
      roles: ["USER"],
      userProfile: { create: { fullName: "Demo User" } },
    },
  });
}

async function ensureMerchant() {
  const existing = await prisma.account.findUnique({ where: { email: merchantEmail } });
  if (existing) return existing;
  const passwordHash = await bcrypt.hash(merchantPassword, 12);
  return prisma.account.create({
    data: {
      email: merchantEmail,
      passwordHash,
      roles: ["MERCHANT"],
      merchantProfile: {
        create: {
          name: "Demo Merchant",
          industryType,
          lat: 0,
          lng: 0,
        },
      },
    },
  });
}

async function main() {
  const userAccount = await ensureUser();
  const merchantAccount = await ensureMerchant();

  const userProfile = await prisma.userProfile.findUnique({ where: { accountId: userAccount.id } });
  const merchantProfile = await prisma.merchantProfile.findUnique({ where: { accountId: merchantAccount.id } });

  if (!userProfile || !merchantProfile) {
    throw new Error("Missing profiles");
  }

  const order = await prisma.order.create({
    data: {
      userId: userProfile.id,
      merchantId: merchantProfile.id,
      status: "ACCEPTED",
      prescriptionUrl: "https://example.com/prescription.png",
      notes: "Seed order",
      shipName: "Demo User",
      shipPhone: "+1-555-555-5555",
      shipAddress1: "123 Market St",
      shipCity: "San Francisco",
      shipState: "CA",
      shipPostalCode: "94103",
      shipCountry: "US",
      items: {
        create: [
          { sku: "SKU-001", name: "Item A", quantity: 2, unitPrice: 9.99 },
          { sku: "SKU-002", name: "Item B", quantity: 1, unitPrice: 19.5 },
        ],
      },
    },
    include: { items: true },
  });

  console.log("Seeded order:", order.id);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
