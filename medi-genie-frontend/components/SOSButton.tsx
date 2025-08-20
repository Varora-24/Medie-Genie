'use client'

import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { AlertCircle } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

export function SOSButton() {
  const [isOpen, setIsOpen] = useState(false)
  const [emergencyContacts, setEmergencyContacts] = useState([])
  const [sosSent, setSosSent] = useState(false)
  const [sosMessage, setSosMessage] = useState('')

  const handleEmergency = async () => {
    try {
      const contactsResponse = await fetch('/api/emergency')
      const contactsData = await contactsResponse.json()
      setEmergencyContacts(contactsData)

      const sosResponse = await fetch('/api/sos', { method: 'POST' })
      const sosData = await sosResponse.json()
      setSosSent(true)
      setSosMessage(sosData.message)

      setIsOpen(true)
    } catch (error) {
      console.error('Failed to handle emergency:', error)
      setSosMessage('Failed to send SOS. Please try again or call emergency services directly.')
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="destructive" 
          size="lg" 
          className="fixed bottom-4 right-4 rounded-full w-16 h-16 shadow-lg z-50"
          onClick={handleEmergency}
        >
          <AlertCircle className="w-8 h-8" />
          <span className="sr-only">Emergency SOS</span>
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Emergency SOS</DialogTitle>
          <DialogDescription>
            {sosSent ? 'SOS has been sent. Help is on the way.' : 'Emergency contacts and services.'}
          </DialogDescription>
        </DialogHeader>
        {sosSent && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>SOS Sent</AlertTitle>
            <AlertDescription>{sosMessage}</AlertDescription>
          </Alert>
        )}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Emergency Contacts</h3>
          {emergencyContacts.map((contact: any) => (
            <div key={contact.id} className="flex justify-between items-center">
              <div>
                <p className="font-bold">{contact.name}</p>
                <p className="text-sm text-gray-500">{contact.relation}</p>
              </div>
              <a href={`tel:${contact.phoneNumber}`} className="text-blue-500 hover:underline">
                {contact.phoneNumber}
              </a>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  )
}

