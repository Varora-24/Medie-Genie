import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import '../styles/custom.css'
import ClientWrapper from '@/components/ClientWrapper'
import Header from '@/components/header'
import Footer from '@/components/footer'
import { SOSButton } from '@/components/SOSButton'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Medi-Genie',
  description: 'Your all-in-one medical services application',
    generator: 'v0.app'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} min-h-screen flex flex-col bg-background text-text-color`}>
        <ClientWrapper>
          <Header />
          <main className="flex-grow container mx-auto px-4 py-8 transition-all duration-300 ease-in-out">
            {children}
          </main>
          <Footer />
          <SOSButton />
        </ClientWrapper>
      </body>
    </html>
  )
}

