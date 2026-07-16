const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function main() {
  const adminEmail = 'admin@mediegenie.com'
  const adminHashedPassword = await bcrypt.hash('AdminPass123!', 10)

  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {
      password: adminHashedPassword,
      role: 'admin',
    },
    create: {
      email: adminEmail,
      name: 'Default Admin',
      password: adminHashedPassword,
      role: 'admin',
    },
  })

  const crypto = require('crypto')

  const testDoctors = [
    { email: 'doctor1@mediegenie.test', name: 'Dr. Sarah Jenkins', specialty: 'General Physician' },
    { email: 'doctor2@mediegenie.test', name: 'Dr. Michael Chen', specialty: 'Cardiologist' },
    { email: 'doctor3@mediegenie.test', name: 'Dr. Emily Rodriguez', specialty: 'Dermatologist' },
    { email: 'doctor4@mediegenie.test', name: 'Dr. James Wilson', specialty: 'Pediatrician' },
  ]

  for (const doc of testDoctors) {
    const rawPassword = crypto.randomBytes(8).toString('hex') + '!'
    const doctorPassword = await bcrypt.hash(rawPassword, 10)

    await prisma.user.upsert({
      where: { email: doc.email },
      update: {
        name: doc.name,
        specialty: doc.specialty,
        password: doctorPassword,
        role: 'doctor',
      },
      create: {
        email: doc.email,
        name: doc.name,
        specialty: doc.specialty,
        password: doctorPassword,
        role: 'doctor',
      }
    })
    console.log(`Successfully seeded test doctor account: ${doc.email} | Password: ${rawPassword}`)
  }
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
