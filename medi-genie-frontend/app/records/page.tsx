'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

type MedicalRecord = {
  id: string
  date: string
  doctor: string
  diagnosis: string
  treatment: string
}

const exampleRecords: MedicalRecord[] = [
  {
    id: '1',
    date: '2023-05-15',
    doctor: 'Dr. Smith',
    diagnosis: 'Common Cold',
    treatment: 'Rest and fluids'
  },
  {
    id: '2',
    date: '2023-04-02',
    doctor: 'Dr. Johnson',
    diagnosis: 'Sprained Ankle',
    treatment: 'RICE method and pain medication'
  },
  {
    id: '3',
    date: '2023-03-10',
    doctor: 'Dr. Williams',
    diagnosis: 'Annual Checkup',
    treatment: 'No treatment required'
  }
];

export default function RecordsPage() {
  const [records, setRecords] = useState<MedicalRecord[]>(exampleRecords);

  useEffect(() => {
    fetchRecords()
  }, [])

  const fetchRecords = async () => {
    const response = await fetch('/api/records')
    const data = await response.json()
    setRecords(data)
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Medical Records</h1>
      <Card className="card">
        <CardHeader>
          <CardTitle>Your Medical History</CardTitle>
          <CardDescription>A summary of your past medical visits and treatments</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Doctor</TableHead>
                <TableHead>Diagnosis</TableHead>
                <TableHead>Treatment</TableHead>
                <TableHead>Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {records.map((record) => (
                <TableRow key={record.id}>
                  <TableCell>{record.date}</TableCell>
                  <TableCell>{record.doctor}</TableCell>
                  <TableCell>{record.diagnosis}</TableCell>
                  <TableCell>{record.treatment}</TableCell>
                  <TableCell>
                    <Button onClick={() => alert(`Viewing details for record: 
Date: ${record.date}
Doctor: ${record.doctor}
Diagnosis: ${record.diagnosis}
Treatment: ${record.treatment}`)}>
                      View Details
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
        <div className="p-6 pt-0">
          <Button onClick={() => alert('Requesting full records...')}>Request Full Records</Button>
        </div>
      </Card>
    </div>
  )
}

