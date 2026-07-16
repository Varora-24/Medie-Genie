'use client'

import React, { useState, useEffect } from 'react'
import { Plus, Trash2, Edit2, Phone, AlertCircle } from 'lucide-react'
import { getEmergencyContacts, addEmergencyContact, updateEmergencyContact, deleteEmergencyContact } from '@/lib/actions/emergency-contacts'

export default function EmergencyContactsPage() {
  const [contacts, setContacts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [isAdding, setIsAdding] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)

  // Form State
  const [name, setName] = useState('')
  const [relation, setRelation] = useState('')
  const [phone, setPhone] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    fetchContacts()
  }, [])

  const fetchContacts = async () => {
    try {
      const data = await getEmergencyContacts()
      setContacts(data)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setName('')
    setRelation('')
    setPhone('')
    setError('')
    setIsAdding(false)
    setEditingId(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    try {
      if (editingId) {
        await updateEmergencyContact(editingId, { name, relation, phone })
      } else {
        await addEmergencyContact({ name, relation, phone })
      }
      await fetchContacts()
      resetForm()
    } catch (err: any) {
      setError(err.message)
    }
  }

  const handleEdit = (contact: any) => {
    setName(contact.name)
    setRelation(contact.relation)
    setPhone(contact.phone)
    setEditingId(contact.id)
    setIsAdding(true)
  }

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this contact?')) {
      try {
        await deleteEmergencyContact(id)
        await fetchContacts()
      } catch (err: any) {
        setError(err.message)
      }
    }
  }

  if (loading) {
    return <div className="p-8">Loading contacts...</div>
  }

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-8 space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Emergency Contacts</h1>
          <p className="text-slate-500 mt-1">Manage who to contact in a medical emergency.</p>
        </div>
        {!isAdding && contacts.length < 5 && (
          <button
            onClick={() => setIsAdding(true)}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl transition-colors"
          >
            <Plus className="h-5 w-5" />
            Add Contact
          </button>
        )}
      </div>

      {contacts.length === 0 && !isAdding && (
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-12 text-center">
          <AlertCircle className="h-12 w-12 text-slate-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-slate-700 mb-2">No emergency contacts</h3>
          <p className="text-slate-500 mb-6">You haven't added any emergency contacts yet. We recommend adding at least one.</p>
          <button
            onClick={() => setIsAdding(true)}
            className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-xl transition-colors font-medium"
          >
            <Plus className="h-5 w-5" />
            Add Your First Contact
          </button>
        </div>
      )}

      {isAdding && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-slate-800 mb-4">
            {editingId ? 'Edit Contact' : 'Add New Contact'}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 bg-red-50 text-red-600 rounded-lg text-sm">{error}</div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-sm font-medium text-slate-700">Full Name</label>
                <input
                  required
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  placeholder="e.g. Jane Doe"
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-slate-700">Relationship</label>
                <input
                  required
                  type="text"
                  value={relation}
                  onChange={(e) => setRelation(e.target.value)}
                  className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  placeholder="e.g. Spouse, Parent, Friend"
                />
              </div>
              <div className="space-y-1 md:col-span-2">
                <label className="text-sm font-medium text-slate-700">Phone Number</label>
                <input
                  required
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  placeholder="e.g. +1 (555) 123-4567"
                />
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <button
                type="submit"
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-xl transition-colors font-medium"
              >
                {editingId ? 'Save Changes' : 'Add Contact'}
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-6 py-2 rounded-xl transition-colors font-medium"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {contacts.map((contact) => (
          <div key={contact.id} className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition-shadow group">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-semibold text-slate-800 text-lg">{contact.name}</h3>
                <span className="inline-block px-2.5 py-1 bg-slate-100 text-slate-600 text-xs font-medium rounded-full mt-2">
                  {contact.relation}
                </span>
                <div className="mt-4 flex items-center gap-2 text-slate-600">
                  <Phone className="h-4 w-4" />
                  <a href={`tel:${contact.phone}`} className="hover:text-indigo-600 transition-colors">
                    {contact.phone}
                  </a>
                </div>
              </div>
              <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => handleEdit(contact)}
                  className="p-2 text-slate-400 hover:text-indigo-600 bg-slate-50 hover:bg-indigo-50 rounded-lg transition-colors"
                >
                  <Edit2 className="h-4 w-4" />
                </button>
                <button
                  onClick={() => handleDelete(contact.id)}
                  className="p-2 text-slate-400 hover:text-red-600 bg-slate-50 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
