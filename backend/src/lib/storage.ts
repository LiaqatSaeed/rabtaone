import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import sharp from "sharp";
import { randomUUID } from "crypto";
import { env } from "@/config/env";

const IMAGE_CONTENT_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif", "image/heic", "image/heif"]);

function getClient() {
  if (!env.MINIO_ENDPOINT || !env.MINIO_ACCESS_KEY || !env.MINIO_SECRET_KEY || !env.MINIO_BUCKET) {
    return null;
  }
  return new S3Client({
    endpoint: env.MINIO_ENDPOINT,
    region: "us-east-1",
    forcePathStyle: true,
    credentials: {
      accessKeyId: env.MINIO_ACCESS_KEY,
      secretAccessKey: env.MINIO_SECRET_KEY,
    },
  });
}

export async function uploadFile(input: {
  buffer: Buffer;
  folder: string;
  filename: string;
  contentType: string;
}): Promise<{ url: string; storageKey: string }> {
  const client = getClient();
  if (!client || !env.MINIO_BUCKET) {
    throw new Error("Storage is not configured");
  }

  const isImage = IMAGE_CONTENT_TYPES.has(input.contentType);
  const body = isImage ? await sharp(input.buffer).webp({ quality: 85 }).toBuffer() : input.buffer;
  const extension = isImage ? "webp" : (input.filename.split(".").pop() ?? "bin");
  const contentType = isImage ? "image/webp" : input.contentType;

  const folder = input.folder.replace(/^\/+|\/+$/g, "");
  const storageKey = `${folder}/${randomUUID()}.${extension}`;

  await client.send(
    new PutObjectCommand({
      Bucket: env.MINIO_BUCKET,
      Key: storageKey,
      Body: body,
      ContentType: contentType,
    })
  );

  const base = (env.MINIO_PUBLIC_URL ?? env.MINIO_ENDPOINT ?? "").replace(/\/+$/, "");
  const url = `${base}/${env.MINIO_BUCKET}/${storageKey}`;

  return { url, storageKey };
}
