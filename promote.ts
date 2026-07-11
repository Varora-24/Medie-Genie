import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  await prisma.user.updateMany({
    where: {
      email: {
        in: ['Vansh.23bai10638@vitbhopal.ac.in', 'vansharorajuly24@gmail.com']
      }
    },
    data: {
      role: 'doctor'
    }
  })
  console.log('Promoted Vansh emails to doctor!')
}

main()
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect()
  })
