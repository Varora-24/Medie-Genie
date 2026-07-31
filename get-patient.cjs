require("dotenv").config();
const { PrismaClient } = require("./node_modules/@prisma/client");
const db = new PrismaClient();
async function main() {
  const patient = await db.user.findFirst({ where: { role: "patient" } });
  console.log(patient.id);
  await db.$disconnect();
}
main().catch(e => { console.error(e); process.exit(1); });
