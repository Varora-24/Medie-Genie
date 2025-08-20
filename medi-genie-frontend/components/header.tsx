'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { Menu } from 'lucide-react'

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const token = localStorage.getItem('token')
    setIsLoggedIn(!!token)
  }, [])

  const handleLogout = () => {
    localStorage.removeItem('token')
    setIsLoggedIn(false)
    router.push('/login')
  }

  return (
    <header className="bg-white shadow-md sticky top-0 z-50 transition-all duration-300 ease-in-out">
      <div className="container mx-auto px-4 py-4 flex flex-wrap justify-between items-center">
        <Link href="/" className="flex items-center">
          <div className="relative w-12 h-12 mr-2">
            <Image 
              src="https://img.icons8.com/color/96/000000/caduceus.png"
              alt="Medi-Genie Logo" 
              layout="fill"
              className="logo"
            />
          </div>
          <div className="flex flex-col">
            <span className="text-2xl font-bold" style={{ color: 'var(--medi-genie-text-color)' }}>Medi-Genie</span>
            <span className="text-sm text-gray-600">Your Health Companion</span>
          </div>
        </Link>
        <button
          className="md:hidden"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
        >
          <Menu className="h-6 w-6" />
        </button>
        <nav className={`${isMenuOpen ? 'block' : 'hidden'} mt-4 w-full md:block md:mt-0 md:w-auto transition-all duration-300 ease-in-out`}>
          <ul className="flex flex-col md:flex-row md:space-x-6">
            <li><Link href="/appointments" className="nav-link text-lg text-gray-700 hover:text-yellow-400 transition-colors duration-300 block py-2 md:py-0">Appointments</Link></li>
            <li><Link href="/prescriptions" className="nav-link text-lg text-gray-700 hover:text-yellow-400 transition-colors duration-300 block py-2 md:py-0">Prescriptions</Link></li>
            <li><Link href="/reminders" className="nav-link text-lg text-gray-700 hover:text-yellow-400 transition-colors duration-300 block py-2 md:py-0">Reminders</Link></li>
            <li><Link href="/records" className="nav-link text-lg text-gray-700 hover:text-yellow-400 transition-colors duration-300 block py-2 md:py-0">Records</Link></li>
            <li><Link href="/payments" className="nav-link text-lg text-gray-700 hover:text-yellow-400 transition-colors duration-300 block py-2 md:py-0">Payments</Link></li>
            <li><Link href="/emergency-contacts" className="nav-link text-lg text-gray-700 hover:text-yellow-400 transition-colors duration-300 block py-2 md:py-0">Emergency Contacts</Link></li>
            <li><Link href="/video-conferencing" className="nav-link text-lg text-gray-700 hover:text-yellow-400 transition-colors duration-300 block py-2 md:py-0">Video Conferencing</Link></li>
            <li><Link href="/pathlab" className="nav-link text-lg text-gray-700 hover:text-yellow-400 transition-colors duration-300 block py-2 md:py-0">Pathlab</Link></li>
            {isLoggedIn ? (
              <>
                <li><Link href="/admin" className="nav-link text-lg text-gray-700 hover:text-yellow-400 transition-colors duration-300 block py-2 md:py-0">Admin</Link></li>
                <li><Button onClick={handleLogout} className="mt-2 md:mt-0">Logout</Button></li>
              </>
            ) : (
              <li><Button onClick={() => router.push('/login')} className="mt-2 md:mt-0">Login</Button></li>
            )}
          </ul>
        </nav>
      </div>
    </header>
  )
}

