-- AlterTable
ALTER TABLE "clients" ADD COLUMN     "password_hash" TEXT,
ADD COLUMN     "username" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "clients_username_key" ON "clients"("username");
