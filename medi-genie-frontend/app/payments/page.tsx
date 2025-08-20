'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { PaymentForm } from '@/components/PaymentForm'

type Payment = {
  id: string
  date: string
  description: string
  amount: number
}

export default function PaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([])
  const [showPaymentForm, setShowPaymentForm] = useState(false)

  useEffect(() => {
    fetchPayments()
  }, [])

  const fetchPayments = async () => {
    const response = await fetch('/api/payments')
    const data = await response.json()
    setPayments(data)
  }

  const handlePaymentSubmit = async (paymentData: any) => {
    const response = await fetch('/api/payments', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(paymentData),
    })

    if (response.ok) {
      alert('Payment submitted successfully!')
      setShowPaymentForm(false)
      fetchPayments()
    } else {
      alert('Failed to submit payment. Please try again.')
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Payments</h1>
      <Card className="card">
        <CardHeader>
          <CardTitle>Payment History</CardTitle>
          <CardDescription>Your recent medical payments</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {payments.map((payment) => (
                <TableRow key={payment.id}>
                  <TableCell>{payment.date}</TableCell>
                  <TableCell>{payment.description}</TableCell>
                  <TableCell>${payment.amount.toFixed(2)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
        <CardFooter>
          <Button onClick={() => setShowPaymentForm(true)}>Make a Payment</Button>
        </CardFooter>
      </Card>
      {showPaymentForm && (
        <Card className="card">
          <CardHeader>
            <CardTitle>Make a Payment</CardTitle>
            <CardDescription>Enter your payment details</CardDescription>
          </CardHeader>
          <CardContent>
            <PaymentForm onSubmit={handlePaymentSubmit} />
          </CardContent>
        </Card>
      )}
    </div>
  )
}

