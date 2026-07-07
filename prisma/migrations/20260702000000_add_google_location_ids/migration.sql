-- AlterTable
ALTER TABLE "business_locations" ADD COLUMN "googleAccountId" TEXT;
ALTER TABLE "business_locations" ADD COLUMN "googleLocationId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "business_locations_googleAccountId_googleLocationId_key" ON "business_locations"("googleAccountId", "googleLocationId");
