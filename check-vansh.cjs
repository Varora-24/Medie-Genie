require("dotenv").config();
const { PrismaClient } = require("./node_modules/@prisma/client");
const db = new PrismaClient();
async function main() {
  const vansh = await db.user.findFirst({ where: { email: { contains: "vansh.23bai10638", mode: "insensitive" } } });
  console.log(`User: ${vansh.name} | Role: ${vansh.role}`);
  const doctors = await db.user.findMany({ where: { role: 'doctor' }, select: { name: true }});
  console.log('Current Doctors:');
  console.dir(doctors.map(d => d.name));
  await db.$disconnect();
}
main().catch(e => { console.error(e); process.exit(1); });
