const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function main() {
  const email = 'admin@mediegenie.com'
  const hashedPassword = await bcrypt.hash('AdminPass123!', 10)

  const admin = await prisma.user.upsert({
    where: { email },
    update: {
      password: hashedPassword,
      role: 'admin',
    },
    create: {
      email,
      name: 'Default Admin',
      password: hashedPassword,
      role: 'admin',
    },
  })

  console.log('Successfully seeded admin account:', admin.email)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
