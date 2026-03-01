import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string().min(1),
  JWT_SECRET: z.string().min(32),
  JWT_EXPIRES_IN: z.string().default("15m"),
  REFRESH_TOKEN_EXPIRES_IN: z.string().default("30d"),
  SOCKET_IO_PATH: z.string().default("/api/socket"),
  ERP_BASE_URL: z.string().optional(),
  ERP_API_KEY: z.string().optional(),
  BUILD_TIME: z.string().optional(),
  GIT_COMMIT: z.string().optional(),
  DOCS_VERSION: z.string().optional(),
});

export const env = envSchema.parse({
  DATABASE_URL: process.env.DATABASE_URL,
  JWT_SECRET: process.env.JWT_SECRET,
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN,
  REFRESH_TOKEN_EXPIRES_IN: process.env.REFRESH_TOKEN_EXPIRES_IN,
  SOCKET_IO_PATH: process.env.SOCKET_IO_PATH,
  ERP_BASE_URL: process.env.ERP_BASE_URL,
  ERP_API_KEY: process.env.ERP_API_KEY,
  BUILD_TIME: process.env.BUILD_TIME,
  GIT_COMMIT: process.env.GIT_COMMIT,
  DOCS_VERSION: process.env.DOCS_VERSION,
});
