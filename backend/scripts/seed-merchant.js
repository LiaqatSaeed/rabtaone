import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const prisma = new PrismaClient();

const email = process.env.MERCHANT_EMAIL || "merchant@example.com";
const password = process.env.MERCHANT_PASSWORD || "password123";
const industryType = process.env.MERCHANT_INDUSTRY || "GENERIC";
const jwtSecret = process.env.JWT_SECRET || "";

if (!jwtSecret) {
  console.error("Missing JWT_SECRET");
  process.exit(1);
}

async function main() {
  const existing = await prisma.account.findUnique({ where: { email } });
  if (existing) {
    const token = jwt.sign({ sub: existing.id, roles: existing.roles ?? ["MERCHANT"] }, jwtSecret, { expiresIn: "7d" });
    console.log("Existing merchant account found.");
    console.log("JWT:", token);
    return;
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const account = await prisma.account.create({
    data: {
      email,
      passwordHash,
      roles: ["MERCHANT"],
    },
  });

  await prisma.merchantProfile.create({
    data: {
      accountId: account.id,
      name: "Demo Merchant",
      industryType,
      lat: 0,
      lng: 0,
    },
  });

  const token = jwt.sign({ sub: account.id, roles: account.roles }, jwtSecret, { expiresIn: "7d" });
  console.log("Merchant created:", email);
  console.log("JWT:", token);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
