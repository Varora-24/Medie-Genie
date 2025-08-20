'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DateInput } from "@/components/ui/date-input"

export default function VideoConferencingPage() {
  const [selectedDoctor, setSelectedDoctor] = useState('')
  const [selectedDate, setSelectedDate] = useState('')
  const [selectedTime, setSelectedTime] = useState('')

  const handleScheduleAppointment = async (e: React.FormEvent) => {
    e.preventDefault()
    // In a real application, this would send the appointment data to the server
    console.log('Scheduling appointment:', { selectedDoctor, selectedDate, selectedTime })
    alert('Video conference appointment scheduled successfully!')
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Video Conferencing</h1>
      <Card>
        <CardHeader>
          <CardTitle>Schedule a Video Conference</CardTitle>
          <CardDescription>Book a virtual appointment with one of our doctors</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleScheduleAppointment} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="doctor">Select a Doctor</Label>
              <Select onValueChange={setSelectedDoctor} required>
                <SelectTrigger id="doctor">
                  <SelectValue placeholder="Choose a doctor" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="dr-smith">Dr. Smith</SelectItem>
                  <SelectItem value="dr-johnson">Dr. Johnson</SelectItem>
                  <SelectItem value="dr-williams">Dr. Williams</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="date">Select Date</Label>
              <DateInput
                id="date"
                value={selectedDate}
                onChange={setSelectedDate}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="time">Select Time</Label>
              <Select onValueChange={setSelectedTime} required>
                <SelectTrigger id="time">
                  <SelectValue placeholder="Choose a time slot" />
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
            <Button type="submit">Schedule Appointment</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

