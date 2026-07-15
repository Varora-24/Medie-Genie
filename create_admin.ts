import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  const admin = await prisma.user.findFirst({
    where: { role: 'admin' }
  })
  
  if (admin) {
    console.log(`Admin exists! Email: ${admin.email}`)
    
    // Reset password so user can log in
    const tempPassword = 'AdminPassword123!'
    const hashedPassword = await bcrypt.hash(tempPassword, 10)
    
    await prisma.user.update({
      where: { id: admin.id },
      data: { password: hashedPassword, authProvider: 'credentials' }
    })
    
    console.log(`Reset password for ${admin.email} to: ${tempPassword}`)
  } else {
    const tempPassword = 'AdminPassword123!'
    const hashedPassword = await bcrypt.hash(tempPassword, 10)
    const newAdmin = await prisma.user.create({
      data: {
        email: 'admin@mediegenie.com',
        name: 'System Admin',
        password: hashedPassword,
        role: 'admin',
        authProvider: 'credentials'
      }
    })
    console.log(`Created new Admin!`)
    console.log(`Email: ${newAdmin.email}`)
    console.log(`Password: ${tempPassword}`)
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
