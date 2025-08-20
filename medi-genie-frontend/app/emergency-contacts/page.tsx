'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

type EmergencyContact = {
  id: string
  name: string
  phoneNumber: string
  relation: string
}

export default function EmergencyContactsPage() {
  const [contacts, setContacts] = useState<EmergencyContact[]>([])
  const [newContact, setNewContact] = useState({ name: '', phoneNumber: '', relation: '' })

  useEffect(() => {
    fetchContacts()
  }, [])

  const fetchContacts = async () => {
    const response = await fetch('/api/emergency')
    const data = await response.json()
    setContacts(data)
  }

  const handleAddContact = async (e: React.FormEvent) => {
    e.preventDefault()
    const response = await fetch('/api/emergency', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(newContact),
    })

    if (response.ok) {
      fetchContacts()
      setNewContact({ name: '', phoneNumber: '', relation: '' })
    } else {
      alert('Failed to add emergency contact. Please try again.')
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Emergency Contacts</h1>
      <Card className="card">
        <CardHeader>
          <CardTitle>Add New Emergency Contact</CardTitle>
          <CardDescription>Add a new emergency contact to your list</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAddContact} className="space-y-4">
            <div>
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={newContact.name}
                onChange={(e) => setNewContact({ ...newContact, name: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="phoneNumber">Phone Number</Label>
              <Input
                id="phoneNumber"
                value={newContact.phoneNumber}
                onChange={(e) => setNewContact({ ...newContact, phoneNumber: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="relation">Relation</Label>
              <Input
                id="relation"
                value={newContact.relation}
                onChange={(e) => setNewContact({ ...newContact, relation: e.target.value })}
                required
              />
            </div>
            <Button type="submit">Add Contact</Button>
          </form>
        </CardContent>
      </Card>

      <Card className="card">
        <CardHeader>
          <CardTitle>Your Emergency Contacts</CardTitle>
          <CardDescription>List of your current emergency contacts</CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="space-y-4">
            {contacts.map((contact) => (
              <li key={contact.id} className="flex justify-between items-center p-2 bg-gray-100 rounded">
                <div>
                  <p className="font-bold">{contact.name}</p>
                  <p className="text-sm text-gray-500">{contact.relation}</p>
                </div>
                <a href={`tel:${contact.phoneNumber}`} className="text-blue-500 hover:underline">
                  {contact.phoneNumber}
                </a>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}

