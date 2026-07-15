'use server'

import db from './db'
import { DoctorApplicationSchema } from './doctor-application-schemas'
import bcrypt from 'bcryptjs'

export async function submitDoctorApplication(prevState: any, formData: FormData) {
  const data = {
    fullName: formData.get('fullName') as string,
    email: formData.get('email') as string,
    phone: formData.get('phone') as string,
    specialty: formData.get('specialty') as string,
    licenseNumber: formData.get('licenseNumber') as string,
    qualifications: formData.get('qualifications') as string,
    yearsExperience: formData.get('yearsExperience'),
    message: formData.get('message') as string,
  }

  const validatedFields = DoctorApplicationSchema.safeParse(data)

  if (!validatedFields.success) {
    return {
      error: validatedFields.error.flatten().fieldErrors,
    }
  }

  try {
    const existingApplication = await db.doctorApplication.findFirst({
      where: { 
        email: validatedFields.data.email,
        status: 'PENDING'
      }
    })

    if (existingApplication) {
      return {
        error: { email: ['You already have a pending application.'] },
      }
    }

    await db.doctorApplication.create({
      data: validatedFields.data
    })

    return { success: true }
  } catch (err: any) {
    console.error('Error submitting application:', err)
    return {
      error: { global: ['Something went wrong. Please try again.'] },
    }
  }
}

export async function approveDoctorApplication(applicationId: string, adminId: string) {
  try {
    const application = await db.doctorApplication.findUnique({
      where: { id: applicationId }
    })

    if (!application) {
      return { error: 'Application not found' }
    }

    if (application.status !== 'PENDING') {
      return { error: 'Application is already processed' }
    }

    const tempPassword = Math.random().toString(36).slice(-10) + 'A1!'
    const hashedPassword = await bcrypt.hash(tempPassword, 10)

    // Run in a transaction to ensure both operations succeed
    await db.$transaction(async (tx) => {
      // Create or update user
      const existingUser = await tx.user.findUnique({ where: { email: application.email } })
      
      if (existingUser) {
        await tx.user.update({
          where: { email: application.email },
          data: { role: 'doctor', specialty: application.specialty }
        })
      } else {
        await tx.user.create({
          data: {
            email: application.email,
            name: application.fullName,
            password: hashedPassword,
            role: 'doctor',
            specialty: application.specialty,
            authProvider: 'credentials'
          }
        })
      }

      // Update application
      await tx.doctorApplication.update({
        where: { id: applicationId },
        data: {
          status: 'APPROVED',
          reviewedBy: adminId,
          reviewedAt: new Date()
        }
      })
    })

    return { success: true, tempPassword }
  } catch (err: any) {
    console.error('Error approving application:', err)
    return { error: 'Something went wrong' }
  }
}

export async function rejectDoctorApplication(applicationId: string, adminId: string, reason: string) {
  if (!reason || reason.trim() === '') {
    return { error: 'Rejection reason is required' }
  }

  try {
    await db.doctorApplication.update({
      where: { id: applicationId },
      data: {
        status: 'REJECTED',
        rejectionReason: reason,
        reviewedBy: adminId,
        reviewedAt: new Date()
      }
    })

    return { success: true }
  } catch (err: any) {
    console.error('Error rejecting application:', err)
    return { error: 'Something went wrong' }
  }
}
