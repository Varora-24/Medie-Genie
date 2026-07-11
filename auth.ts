import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import Google from 'next-auth/providers/google'
import { authConfig } from './auth.config'
import db from '@/lib/db'
import bcrypt from 'bcryptjs'
import { z } from 'zod'

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Google,
    Credentials({
      async authorize(credentials) {
        const parsedCredentials = z
          .object({ email: z.string().email(), password: z.string().min(6) })
          .safeParse(credentials)

        if (!parsedCredentials.success) {
          return null
        }

        const { email, password } = parsedCredentials.data
        const user = await db.user.findUnique({ where: { email } })
        
        if (!user || !user.password) return null
        
        const passwordsMatch = await bcrypt.compare(password, user.password)
        if (passwordsMatch) {
          return {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
          }
        }

        return null
      },
    }),
  ],
  callbacks: {
    ...authConfig.callbacks,
    async signIn({ user, account }) {
      if (account?.provider === 'google') {
        const email = user.email
        if (!email) return false
        
        const existingUser = await db.user.findUnique({ where: { email } })
        
        if (existingUser) {
          if (existingUser.authProvider === 'credentials') {
            return '/login?error=CredentialsAccountExists'
          }
          return true
        }

        // Create new user for Google sign in
        await db.user.create({
          data: {
            email,
            name: user.name || 'Google User',
            role: 'patient',
            authProvider: 'google',
            image: user.image,
          }
        })
        return true
      }
      return true
    },
    async jwt({ token, user, account }) {
      // First let authConfig.callbacks.jwt handle it if needed
      const baseToken = authConfig.callbacks?.jwt ? await (authConfig.callbacks.jwt as any)({ token, user, account }) : token
      
      // If user object is present, it means this is a sign in
      if (user) {
        if (account?.provider === 'google') {
          // Look up user from DB to get the correct ID and role
          const dbUser = await db.user.findUnique({ where: { email: user.email! } })
          if (dbUser) {
            baseToken.id = dbUser.id
            baseToken.role = dbUser.role
          }
        } else {
          // Credentials provider
          baseToken.id = user.id
          baseToken.role = (user as any).role
        }
      }
      return baseToken
    }
  }
})
