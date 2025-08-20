'use client'

import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"

interface PaymentFormProps {
  onSubmit: (paymentData: any) => void;
}

export function PaymentForm({ onSubmit }: PaymentFormProps) {
  const [amount, setAmount] = useState('')
  const [cardNumber, setCardNumber] = useState('')
  const [expiryDate, setExpiryDate] = useState('')
  const [cvv, setCvv] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit({
      amount: parseFloat(amount),
      cardNumber,
      expiryDate,
      cvv,
      date: new Date().toISOString().split('T')[0],
      description: 'Medical Payment'
    })
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="grid w-full items-center gap-4">
        <div className="flex flex-col space-y-1.5">
          <Label htmlFor="amount">Amount</Label>
          <Input 
            id="amount" 
            placeholder="Enter amount" 
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            type="number"
            step="0.01"
            required
          />
        </div>
        <div className="flex flex-col space-y-1.5">
          <Label htmlFor="cardNumber">Card Number</Label>
          <Input 
            id="cardNumber" 
            placeholder="1234 5678 9012 3456" 
            value={cardNumber}
            onChange={(e) => setCardNumber(e.target.value)}
            required
          />
        </div>
        <div className="flex flex-col space-y-1.5">
          <Label htmlFor="expiryDate">Expiry Date</Label>
          <Input 
            id="expiryDate" 
            placeholder="MM/YY" 
            value={expiryDate}
            onChange={(e) => setExpiryDate(e.target.value)}
            required
          />
        </div>
        <div className="flex flex-col space-y-1.5">
          <Label htmlFor="cvv">CVV</Label>
          <Input 
            id="cvv" 
            placeholder="123" 
            value={cvv}
            onChange={(e) => setCvv(e.target.value)}
            required
          />
        </div>
      </div>
      <Button type="submit" className="mt-4">Submit Payment</Button>
    </form>
  )
}

