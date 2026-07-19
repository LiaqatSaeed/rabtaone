-- CreateEnum
CREATE TYPE "DeliveryMode" AS ENUM ('RABTAONE', 'OWN');

-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "deliveryMode" "DeliveryMode" NOT NULL DEFAULT 'RABTAONE';
