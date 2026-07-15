import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const emailToPromote = process.argv[2]
  
  if (!emailToPromote) {
    console.error('Please provide an email address. Usage: npx tsx promote.ts <email>')
    process.exit(1)
  }

  const user = await prisma.user.update({
    where: { email: emailToPromote },
    data: { role: 'doctor' }
  })
  
  console.log(`Successfully promoted ${user.email} to doctor!`)
}

main()
  .catch(e => {
    if (e.code === 'P2025') {
      console.error(`User with email not found.`)
    } else {
      console.error(e)
    }
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
