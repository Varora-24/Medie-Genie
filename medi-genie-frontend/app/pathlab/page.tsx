'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

type Test = {
  id: string
  name: string
  price: number
}

type Booking = {
  id: string
  tests: Test[]
  date: string
  address: string
  status: 'Pending' | 'Confirmed' | 'Completed'
}

const availableTests: Test[] = [
  { id: '1', name: 'Complete Blood Count (CBC)', price: 30 },
  { id: '2', name: 'Lipid Profile', price: 45 },
  { id: '3', name: 'Thyroid Function Test', price: 60 },
  { id: '4', name: 'Vitamin D Test', price: 50 },
  { id: '5', name: 'HbA1c (Diabetes Test)', price: 40 },
]

export default function PathlabPage() {
  const [amount, setAmount] = useState<number>(0)
  const [address, setAddress] = useState('')
  const [date, setDate] = useState('')
  const [bookings, setBookings] = useState<Booking[]>([])

  useEffect(() => {
    // In a real app, you would fetch this data from your API
    const mockBookings: Booking[] = [
      {
        id: '1',
        tests: [availableTests[0], availableTests[2]],
        date: '2023-06-15',
        address: '123 Main St, Anytown, USA',
        status: 'Confirmed'
      },
      {
        id: '2',
        tests: [availableTests[1], availableTests[4]],
        date: '2023-06-20',
        address: '456 Elm St, Othertown, USA',
        status: 'Pending'
      }
    ]
    setBookings(mockBookings)
  }, [])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // In a real app, you would send this data to your backend
    const newBooking: Booking = {
      id: (bookings.length + 1).toString(),
      tests: [{ id: 'custom', name: 'Custom Test', price: amount }],
      date,
      address,
      status: 'Pending'
    }
    setBookings([...bookings, newBooking])
    alert(`Booking confirmed for a test with amount $${amount} on ${date}. Sample will be collected at: ${address}`)
    // Reset form
    setAmount(0)
    setAddress('')
    setDate('')
  }

  const totalPrice = amount;

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Pathlab Services</h1>
      <Card>
        <CardHeader>
          <CardTitle>Book a Home Sample Collection</CardTitle>
          <CardDescription>Select tests and schedule a home visit for sample collection</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="amount">Enter Amount</Label>
              <Input
                id="amount"
                type="number"
                placeholder="Enter amount"
                value={amount}
                onChange={(e) => setAmount(parseFloat(e.target.value))}
                required
              />
            </div>
            <div className="text-right font-bold">
              Total: ${totalPrice}
            </div>
            <div className="space-y-2">
              <Label htmlFor="address">Collection Address</Label>
              <Input 
                id="address" 
                value={address} 
                onChange={(e) => setAddress(e.target.value)} 
                placeholder="Enter your address"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="date">Preferred Date</Label>
              <Input 
                id="date" 
                type="date" 
                value={date} 
                onChange={(e) => setDate(e.target.value)} 
                required
              />
            </div>
            <Button type="submit" disabled={amount <= 0}>Book Home Collection</Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Current Bookings</CardTitle>
          <CardDescription>Your upcoming and recent lab test bookings</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Tests</TableHead>
                <TableHead>Address</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {bookings.map(booking => (
                <TableRow key={booking.id}>
                  <TableCell>{booking.date}</TableCell>
                  <TableCell>{booking.tests.map(t => t.name).join(', ')}</TableCell>
                  <TableCell>{booking.address}</TableCell>
                  <TableCell>{booking.status}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}

