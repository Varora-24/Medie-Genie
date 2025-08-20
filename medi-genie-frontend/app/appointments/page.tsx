'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"

type Appointment = {
  id: string
  date: string
  time: string
  doctorName: string
  patientName: string
  reason: string
}

export default function AppointmentsPage() {
  const [date, setDate] = useState<Date | undefined>(new Date())
  const [time, setTime] = useState<string | undefined>()
  const [reason, setReason] = useState('')
  const [appointments, setAppointments] = useState<Appointment[]>([])

  useEffect(() => {
    fetchAppointments()
  }, [])

  const fetchAppointments = async () => {
    const response = await fetch('/api/appointments')
    const data = await response.json()
    setAppointments(data)
  }

  const handleBookAppointment = async () => {
    if (date && time && reason) {
      const newAppointment = {
        date: date.toISOString().split('T')[0],
        time,
        doctorName: 'Dr. Smith', // In a real app, this would be selected or assigned
        patientName: 'John Doe', // In a real app, this would be the logged-in user
        reason
      }

      const response = await fetch('/api/appointments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newAppointment),
      })

      if (response.ok) {
        alert('Appointment booked successfully!')
        fetchAppointments()
        setDate(new Date())
        setTime(undefined)
        setReason('')
      } else {
        alert('Failed to book appointment. Please try again.')
      }
    } else {
      alert("Please fill in all fields")
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Appointments</h1>
      <Card className="card">
        <CardHeader>
          <CardTitle>Book an Appointment</CardTitle>
          <CardDescription>Select a date and time for your appointment</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Select Date</Label>
            <Calendar
              mode="single"
              selected={date}
              onSelect={setDate}
              className="rounded-md border"
            />
          </div>
          <div>
            <Label>Select Time</Label>
            <Select onValueChange={setTime}>
              <SelectTrigger>
                <SelectValue placeholder="Select time" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="09:00">09:00 AM</SelectItem>
                <SelectItem value="10:00">10:00 AM</SelectItem>
                <SelectItem value="11:00">11:00 AM</SelectItem>
                <SelectItem value="14:00">02:00 PM</SelectItem>
                <SelectItem value="15:00">03:00 PM</SelectItem>
                <SelectItem value="16:00">04:00 PM</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Reason for Appointment</Label>
            <Input 
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Enter reason for appointment"
            />
          </div>
        </CardContent>
        <CardFooter>
          <Button onClick={handleBookAppointment}>Book Appointment</Button>
        </CardFooter>
      </Card>

      <Card className="card">
        <CardHeader>
          <CardTitle>Upcoming Appointments</CardTitle>
          <CardDescription>Your scheduled appointments</CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2">
            {appointments.map((appointment) => (
              <li key={appointment.id} className="p-2 bg-gray-100 rounded">
                <strong>{appointment.doctorName}</strong> - {appointment.reason}<br />
                {appointment.date} at {appointment.time}
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}

