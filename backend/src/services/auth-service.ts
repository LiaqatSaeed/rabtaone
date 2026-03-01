import { prisma } from "@/infrastructure/db/prisma";
import { AppError } from "@/infrastructure/http/error-middleware";
import { signAccessToken } from "@/lib/jwt";
import bcrypt from "bcryptjs";

export const authService = {
  async register(input: {
    email: string;
    password: string;
    role: "USER" | "MERCHANT" | "DELIVERY" | "ADMIN";
    fullName?: string;
    businessName?: string;
    industryType?: string;
  }) {
    if (input.role === "ADMIN" && process.env.E2E_MODE !== "true") {
      throw new AppError("Admin registration disabled", 403, "ADMIN_REGISTRATION_DISABLED");
    }
    const existing = await prisma.account.findUnique({ where: { email: input.email } });
    if (existing) throw new AppError("Email already in use", 409, "EMAIL_TAKEN");

    const passwordHash = await bcrypt.hash(input.password, 12);
    const account = await prisma.account.create({
      data: {
        email: input.email,
        passwordHash,
        roles: [input.role],
      },
    });

    if (input.role === "USER") {
      await prisma.userProfile.create({
        data: { accountId: account.id, fullName: input.fullName ?? "User" },
      });
    }

    if (input.role === "MERCHANT") {
      await prisma.merchantProfile.create({
        data: {
          accountId: account.id,
          name: input.businessName ?? "Merchant",
          industryType: input.industryType ?? "GENERIC",
          lat: 0,
          lng: 0,
        },
      });
    }

    if (input.role === "DELIVERY") {
      await prisma.deliveryProfile.create({
        data: { accountId: account.id, fullName: input.fullName ?? "Courier" },
      });
    }

    return account;
  },

  async login(input: { email: string; password: string }) {
    const account = await prisma.account.findUnique({ where: { email: input.email } });
    if (!account) throw new AppError("Invalid credentials", 401, "INVALID_CREDENTIALS");

    const ok = await bcrypt.compare(input.password, account.passwordHash);
    if (!ok) throw new AppError("Invalid credentials", 401, "INVALID_CREDENTIALS");

    const token = signAccessToken({ sub: account.id, roles: account.roles as unknown as string[] });
    return { token, accountId: account.id, roles: account.roles };
  },
};
