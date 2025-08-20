import Link from 'next/link'

export default function Footer() {
  return (
    <footer className="bg-blue-800 text-white py-8">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <h3 className="text-xl font-bold mb-4">Medi-Genie</h3>
            <p>Your all-in-one medical services application</p>
          </div>
          <div>
            <h3 className="text-xl font-bold mb-4">Quick Links</h3>
            <ul className="space-y-2">
              <li><Link href="/appointments" className="text-blue-200 hover:text-white transition-colors duration-300">Appointments</Link></li>
              <li><Link href="/prescriptions" className="text-blue-200 hover:text-white transition-colors duration-300">Prescriptions</Link></li>
              <li><Link href="/records" className="text-blue-200 hover:text-white transition-colors duration-300">Medical Records</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="text-xl font-bold mb-4">Contact Us</h3>
            <p>Email: support@medi-genie.com</p>
            <p>Phone: (123) 456-7890</p>
          </div>
        </div>
        <div className="mt-8 text-center">
          <p className="text-blue-200">&copy; 2023 Medi-Genie. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}

