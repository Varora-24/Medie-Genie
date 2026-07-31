import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const starterServices = [
  {
    name: "Complete Blood Count (CBC)",
    category: "Hematology",
    description: "A comprehensive test to evaluate your overall health and detect a wide range of disorders.",
    homeVisitAvailable: true,
    labVisitAvailable: true
  },
  {
    name: "Lipid Profile",
    category: "Cardiology",
    description: "Measures the level of cholesterol and other fats in your blood.",
    homeVisitAvailable: true,
    labVisitAvailable: true
  },
  {
    name: "HbA1c (Glycosylated Hemoglobin)",
    category: "Diabetology",
    description: "An important blood test that shows how well your diabetes is being controlled.",
    homeVisitAvailable: true,
    labVisitAvailable: true
  },
  {
    name: "Thyroid Profile (T3, T4, TSH)",
    category: "Endocrinology",
    description: "Measures the function of your thyroid gland.",
    homeVisitAvailable: true,
    labVisitAvailable: true
  },
  {
    name: "MRI Scan (Brain)",
    category: "Radiology",
    description: "Detailed images of the brain using magnetic fields and radio waves.",
    homeVisitAvailable: false,
    labVisitAvailable: true
  },
  {
    name: "X-Ray (Chest)",
    category: "Radiology",
    description: "Quick imaging test to check your lungs, heart and chest wall.",
    homeVisitAvailable: false,
    labVisitAvailable: true
  }
];

async function main() {
  console.log("Seeding lab services...");
  for (const svc of starterServices) {
    await prisma.labService.create({
      data: svc
    });
  }
  console.log("Successfully seeded", starterServices.length, "lab services!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
