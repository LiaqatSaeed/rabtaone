-- AlterTable
ALTER TABLE "MerchantProfile" ADD COLUMN     "categories" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "description" TEXT,
ADD COLUMN     "slug" TEXT,
ADD COLUMN     "whatsapp" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "MerchantProfile_slug_key" ON "MerchantProfile"("slug");

