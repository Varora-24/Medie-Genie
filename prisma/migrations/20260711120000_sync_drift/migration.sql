-- AlterTable
ALTER TABLE "User" ADD COLUMN "authProvider" TEXT NOT NULL DEFAULT 'credentials';
ALTER TABLE "User" ADD COLUMN "specialty" TEXT;
ALTER TABLE "User" ALTER COLUMN "password" DROP NOT NULL;
