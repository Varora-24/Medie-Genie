-- CreateTable
CREATE TABLE "LabService" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "description" TEXT,
    "homeVisitAvailable" BOOLEAN NOT NULL DEFAULT true,
    "labVisitAvailable" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LabService_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LabBooking" (
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "serviceId" TEXT NOT NULL,
    "visitType" TEXT NOT NULL,
    "address" TEXT,
    "scheduledAt" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LabBooking_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "LabBooking" ADD CONSTRAINT "LabBooking_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LabBooking" ADD CONSTRAINT "LabBooking_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "LabService"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
