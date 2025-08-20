'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Chatbot from '@/components/Chatbot'

export default function Home() {
  const [isChatbotOpen, setIsChatbotOpen] = useState(false)

  const features = [
    { 
      title: "Appointments", 
      description: "Book and manage your medical appointments", 
      link: "/appointments", 
      icon: "https://img.icons8.com/color/96/000000/calendar--v1.png"
    },
    { 
      title: "Prescriptions", 
      description: "View and manage your prescriptions", 
      link: "/prescriptions", 
      icon: "https://img.icons8.com/color/96/000000/pill.png"
    },
    { 
      title: "Reminders", 
      description: "Set reminders for your medications", 
      link: "/reminders", 
      icon: "https://img.icons8.com/color/96/000000/alarm.png"
    },
    { 
      title: "Medical Records", 
      description: "Access your medical history", 
      link: "/records", 
      icon: "https://img.icons8.com/color/96/000000/medical-doctor.png"
    },
    { 
      title: "Payments", 
      description: "Manage your medical payments", 
      link: "/payments", 
      icon: "https://img.icons8.com/color/96/000000/bank-card-back-side.png"
    },
    { 
      title: "Video Conferencing", 
      description: "Schedule and attend virtual appointments with doctors", 
      link: "/video-conferencing", 
      icon: "https://img.icons8.com/color/96/000000/video-call.png"
    },
    { 
      title: "Pathlab Services", 
      description: "Book home sample collection for lab tests", 
      link: "/pathlab", 
      icon: "https://img.icons8.com/color/96/000000/test-tube.png"
    },
  ]

  return (
    <div className="space-y-12">
      <section className="text-center py-16 bg-gradient-to-r from-primary/90 to-secondary/90 text-white rounded-lg shadow-lg mb-12">
        <h1 className="text-5xl font-bold mb-6 text-accent-color">Welcome to Medi-Genie</h1>
        <p className="text-2xl mb-8">Your all-in-one medical services application</p>
        <Button size="lg" variant="secondary" className="bg-accent-color text-primary hover:bg-accent-color/90" asChild>
          <Link href="/appointments">Book an Appointment</Link>
        </Button>
      </section>

      <section className="section">
        <h2 className="section-heading mb-8">Our Services</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <Card key={index} className="card transition-all duration-300 hover:shadow-lg">
              <CardHeader>
                <div className="flex items-center space-x-4">
                  <div className="flex-shrink-0">
                    <Image src={feature.icon} alt={feature.title} width={48} height={48} className="icon" />
                  </div>
                  <div>
                    <CardTitle className="text-2xl font-extrabold text-primary">{feature.title}</CardTitle>
                    <CardDescription className="mt-2 text-base font-medium">{feature.description}</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardFooter>
                <Button variant="outline" className="w-full hover:bg-primary hover:text-white transition-colors duration-300" asChild>
                  <Link href={feature.link}>Learn More</Link>
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </section>

      <section className="section text-center py-16 bg-gradient-to-r from-secondary/90 to-primary/90 text-white rounded-lg shadow-lg">
        <h2 className="text-4xl font-bold mb-6">Need Help?</h2>
        <p className="text-xl mb-8">Our AI-powered chatbot is here to assist you 24/7</p>
        <Button variant="secondary" size="lg" className="bg-accent-color text-primary hover:bg-accent-color/90 transition-colors duration-300" onClick={() => setIsChatbotOpen(true)}>
          Chat Now
        </Button>
      </section>

      <Chatbot isOpen={isChatbotOpen} setIsOpen={setIsChatbotOpen} />
    </div>
  )
}

