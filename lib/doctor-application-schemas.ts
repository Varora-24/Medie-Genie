import { z } from 'zod'

export const DoctorApplicationSchema = z.object({
  fullName: z.string().min(2, "Full name is required"),
  email: z.string().email("Invalid email address"),
  phone: z.string().min(10, "Phone number is required"),
  specialty: z.string().min(2, "Specialty is required"),
  licenseNumber: z.string().min(4, "License number is required"),
  qualifications: z.string().min(5, "Qualifications are required"),
  yearsExperience: z.coerce.number().min(0, "Must be a valid number"),
  message: z.string().optional(),
})
