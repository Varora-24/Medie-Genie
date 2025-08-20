'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"

type Reminder = {
  id: string
  medication: string
  time: string
  isActive: boolean
}

export default function RemindersPage() {
  const [reminders, setReminders] = useState<Reminder[]>([])
  const [newMedication, setNewMedication] = useState('')
  const [newTime, setNewTime] = useState('')

  useEffect(() => {
    fetchReminders()
  }, [])

  const fetchReminders = async () => {
    const response = await fetch('/api/reminders')
    const data = await response.json()
    setReminders(data)
  }

  const handleAddReminder = async () => {
    if (newMedication && newTime) {
      const newReminder = {
        medication: newMedication,
        time: newTime,
        isActive: true
      }

      const response = await fetch('/api/reminders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newReminder),
      })

      if (response.ok) {
        fetchReminders()
        setNewMedication('')
        setNewTime('')
      } else {
        alert('Failed to add reminder. Please try again.')
      }
    } else {
      alert('Please fill in all fields')
    }
  }

  const handleToggleReminder = async (reminder: Reminder) => {
    const updatedReminder = { ...reminder, isActive: !reminder.isActive }
    const response = await fetch('/api/reminders', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updatedReminder),
    })

    if (response.ok) {
      fetchReminders()
    } else {
      alert('Failed to update reminder. Please try again.')
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Medication Reminders</h1>
      <Card className="card">
        <CardHeader>
          <CardTitle>Set New Reminder</CardTitle>
          <CardDescription>Create a new medication reminder</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={(e) => { e.preventDefault(); handleAddReminder(); }} className="space-y-4">
            <div>
              <Label htmlFor="medication">Medication</Label>
              <Input
                id="medication"
                value={newMedication}
                onChange={(e) => setNewMedication(e.target.value)}
                placeholder="Enter medication name"
              />
            </div>
            <div>
              <Label htmlFor="time">Reminder Time</Label>
              <Input
                id="time"
                type="time"
                value={newTime}
                onChange={(e) => setNewTime(e.target.value)}
              />
            </div>
            <Button type="submit">Add Reminder</Button>
          </form>
        </CardContent>
      </Card>

      <Card className="card">
        <CardHeader>
          <CardTitle>Current Reminders</CardTitle>
          <CardDescription>Your active medication reminders</CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="space-y-4">
            {reminders.map((reminder) => (
              <li key={reminder.id} className="flex items-center justify-between p-2 bg-gray-100 rounded">
                <span>
                  <strong>{reminder.medication}</strong> - {reminder.time}
                </span>
                <Switch
                  checked={reminder.isActive}
                  onCheckedChange={() => handleToggleReminder(reminder)}
                  aria-label={`Toggle reminder for ${reminder.medication}`}
                />
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}

