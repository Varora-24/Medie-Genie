'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

type Prescription = {
  id: string
  medication: string
  dosage: string
  frequency: string
  refillsLeft: number
}

export default function PrescriptionsPage() {
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([])

  useEffect(() => {
    fetchPrescriptions()
  }, [])

  const fetchPrescriptions = async () => {
    const response = await fetch('/api/prescriptions')
    const data = await response.json()
    setPrescriptions(data)
  }

  const handleRefillRequest = async (id: string) => {
    // In a real app, this would send a request to the backend to process the refill
    alert(`Refill requested for prescription ${id}`)
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Prescriptions</h1>
      <Card className="card">
        <CardHeader>
          <CardTitle>Current Prescriptions</CardTitle>
          <CardDescription>Your active medication prescriptions</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Medication</TableHead>
                <TableHead>Dosage</TableHead>
                <TableHead>Frequency</TableHead>
                <TableHead>Refills Left</TableHead>
                <TableHead>Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {prescriptions.map((prescription) => (
                <TableRow key={prescription.id}>
                  <TableCell>{prescription.medication}</TableCell>
                  <TableCell>{prescription.dosage}</TableCell>
                  <TableCell>{prescription.frequency}</TableCell>
                  <TableCell>{prescription.refillsLeft}</TableCell>
                  <TableCell>
                    <Button 
                      onClick={() => handleRefillRequest(prescription.id)}
                      disabled={prescription.refillsLeft === 0}
                    >
                      Request Refill
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}

