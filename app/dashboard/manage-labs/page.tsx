'use client'

import React, { useState, useEffect } from 'react'
import { 
  getAllLabBookings, 
  getLabServices, 
  updateLabBookingStatus, 
  createLabService, 
  deleteLabService 
} from '@/lib/actions/lab-actions'
import { 
  Activity, 
  Plus, 
  Trash2, 
  CheckCircle2, 
  ClipboardList,
  AlertCircle,
  Tag,
  Home,
  Building2
} from 'lucide-react'

export default function AdminManageLabsPage() {
  const [activeTab, setActiveTab] = useState<'bookings' | 'services'>('bookings')
  const [bookings, setBookings] = useState<any[]>([])
  const [services, setServices] = useState<any[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [msg, setMsg] = useState<string | null>(null)

  // New Service Form State
  const [showAddForm, setShowAddForm] = useState<boolean>(false)
  const [name, setName] = useState<string>('')
  const [category, setCategory] = useState<string>('')
  const [description, setDescription] = useState<string>('')
  const [homeVisitAvailable, setHomeVisitAvailable] = useState<boolean>(true)
  const [labVisitAvailable, setLabVisitAvailable] = useState<boolean>(true)
  const [formError, setFormError] = useState<string | null>(null)
  const [formLoading, setFormLoading] = useState<boolean>(false)

  const loadData = async () => {
    setLoading(true)
    try {
      const [loadedBookings, loadedServices] = await Promise.all([
        getAllLabBookings(),
        getLabServices()
      ])
      setBookings(loadedBookings)
      setServices(loadedServices)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleStatusChange = async (bookingId: string, newStatus: string) => {
    const res = await updateLabBookingStatus(bookingId, newStatus)
    if (res.success) {
      setMsg(`Booking status updated to ${newStatus}`)
      setTimeout(() => setMsg(null), 4000)
      loadData()
    }
  }

  const handleCreateService = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormLoading(true)
    setFormError(null)

    const res = await createLabService({
      name,
      category,
      description,
      homeVisitAvailable,
      labVisitAvailable
    })

    setFormLoading(false)
    if (res.success) {
      setMsg('New diagnostic service created successfully!')
      setTimeout(() => setMsg(null), 4000)
      setShowAddForm(false)
      setName('')
      setCategory('')
      setDescription('')
      loadData()
    } else {
      setFormError(res.error || 'Failed to create service.')
    }
  }

  const handleDeleteService = async (id: string, serviceName: string) => {
    if (!confirm(`Are you sure you want to delete "${serviceName}"?`)) return
    const res = await deleteLabService(id)
    if (res.success) {
      setMsg(`Service "${serviceName}" deleted.`)
      setTimeout(() => setMsg(null), 4000)
      loadData()
    }
  }

  return (
    <div className="max-w-6xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight flex items-center gap-3">
            <ClipboardList className="h-8 w-8 text-indigo-600" />
            Admin Lab Management
          </h1>
          <p className="mt-2 text-md text-gray-600">
            Oversee patient pathology appointments and configure diagnostic service catalog.
          </p>
        </div>

        {activeTab === 'services' && (
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white font-semibold rounded-xl shadow-md hover:bg-indigo-700 transition-colors"
          >
            <Plus className="h-5 w-5" />
            {showAddForm ? 'Close Form' : 'Add New Test'}
          </button>
        )}
      </div>

      {msg && (
        <div className="mb-6 rounded-lg bg-green-50 p-4 border border-green-200 flex items-center gap-3">
          <CheckCircle2 className="h-6 w-6 text-green-600 flex-shrink-0" />
          <span className="text-green-800 font-medium">{msg}</span>
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-8">
        <nav className="-mb-px flex gap-8">
          <button
            onClick={() => { setActiveTab('bookings'); setShowAddForm(false); }}
            className={`py-4 px-1 border-b-2 font-semibold text-sm ${
              activeTab === 'bookings'
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            All Patient Bookings ({bookings.length})
          </button>
          <button
            onClick={() => setActiveTab('services')}
            className={`py-4 px-1 border-b-2 font-semibold text-sm ${
              activeTab === 'services'
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Service Catalog ({services.length})
          </button>
        </nav>
      </div>

      {loading ? (
        <div className="text-center py-16">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-indigo-600 border-r-transparent align-[-0.125em]" />
          <p className="mt-4 text-gray-500 font-medium">Loading lab management data...</p>
        </div>
      ) : activeTab === 'bookings' ? (
        /* BOOKINGS TABLE */
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          {bookings.length === 0 ? (
            <div className="p-12 text-center text-gray-500">No lab test bookings have been scheduled yet.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Test & Category</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Patient Info</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Date & Visit Type</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Status & Action</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {bookings.map((b) => (
                    <tr key={b.id} className="hover:bg-gray-50/80 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="font-bold text-gray-900">{b.service.name}</div>
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-indigo-50 text-indigo-700 mt-1">
                          {b.service.category}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-semibold text-gray-900">{b.patient.name || 'Anonymous'}</div>
                        <div className="text-xs text-gray-500">{b.patient.email}</div>
                        {b.patient.phone && <div className="text-xs text-gray-500">{b.patient.phone}</div>}
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900">
                          {new Date(b.scheduledAt).toLocaleString(undefined, {
                            weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit'
                          })}
                        </div>
                        <div className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                          {b.visitType === 'HOME' ? (
                            <span className="text-emerald-700 font-semibold flex items-center gap-1">
                              <Home className="h-3.5 w-3.5" /> Home ({b.address || 'N/A'})
                            </span>
                          ) : (
                            <span className="text-blue-700 font-semibold flex items-center gap-1">
                              <Building2 className="h-3.5 w-3.5" /> Lab Walk-in
                            </span>
                          )}
                        </div>
                        {b.notes && <div className="text-xs text-gray-400 mt-1 max-w-xs truncate" title={b.notes}>Note: {b.notes}</div>}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <select
                          value={b.status}
                          onChange={(e) => handleStatusChange(b.id, e.target.value)}
                          className={`rounded-lg font-bold text-xs py-1.5 px-3 border shadow-sm cursor-pointer transition-all ${
                            b.status === 'CONFIRMED' ? 'bg-green-50 text-green-800 border-green-300' :
                            b.status === 'COMPLETED' ? 'bg-blue-50 text-blue-800 border-blue-300' :
                            b.status === 'CANCELLED' ? 'bg-red-50 text-red-800 border-red-300' :
                            'bg-amber-50 text-amber-800 border-amber-300'
                          }`}
                        >
                          <option value="PENDING">PENDING</option>
                          <option value="CONFIRMED">CONFIRMED</option>
                          <option value="COMPLETED">COMPLETED</option>
                          <option value="CANCELLED">CANCELLED</option>
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : (
        /* SERVICES CATALOG */
        <div className="space-y-6">
          {showAddForm && (
            <form onSubmit={handleCreateService} className="bg-white p-6 rounded-xl border border-indigo-200 shadow-sm space-y-4 animate-in fade-in">
              <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <Plus className="h-5 w-5 text-indigo-600" />
                Add Diagnostic Test to Catalog
              </h3>

              {formError && (
                <div className="rounded-md bg-red-50 p-3 border border-red-200 text-sm text-red-700 flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 flex-shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Test / Scan Name <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Vitamin D3 Assay"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Category <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Biochemistry, Hematology, Radiology"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Description</label>
                <textarea
                  rows={2}
                  placeholder="Explain what this test assesses for the patient..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div className="flex items-center gap-6 pt-2">
                <label className="flex items-center gap-2 cursor-pointer text-sm font-medium text-gray-700">
                  <input
                    type="checkbox"
                    checked={homeVisitAvailable}
                    onChange={(e) => setHomeVisitAvailable(e.target.checked)}
                    className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  Allow Home Sample Collection
                </label>
                <label className="flex items-center gap-2 cursor-pointer text-sm font-medium text-gray-700">
                  <input
                    type="checkbox"
                    checked={labVisitAvailable}
                    onChange={(e) => setLabVisitAvailable(e.target.checked)}
                    className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  Allow Direct Lab Walk-in
                </label>
              </div>

              <div className="pt-3 flex justify-end">
                <button
                  type="submit"
                  disabled={formLoading}
                  className="px-6 py-2.5 bg-indigo-600 text-white font-bold rounded-lg shadow hover:bg-indigo-700 transition-colors text-sm"
                >
                  {formLoading ? 'Saving...' : 'Save Diagnostic Service'}
                </button>
              </div>
            </form>
          )}

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="divide-y divide-gray-200">
              {services.map((svc) => (
                <div key={svc.id} className="p-6 flex items-center justify-between gap-4 hover:bg-gray-50/50 transition-colors">
                  <div>
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-gray-100 text-gray-700 mb-1">
                      {svc.category}
                    </span>
                    <h4 className="text-lg font-bold text-gray-900">{svc.name}</h4>
                    <p className="text-sm text-gray-600 mt-1 max-w-2xl">{svc.description || 'No description provided.'}</p>
                    <div className="flex gap-2 mt-3">
                      {svc.homeVisitAvailable && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-emerald-50 text-emerald-700">
                          ✓ Home Collection Supported
                        </span>
                      )}
                      {svc.labVisitAvailable && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-50 text-blue-700">
                          ✓ Lab Walk-in Supported
                        </span>
                      )}
                    </div>
                  </div>

                  <button
                    onClick={() => handleDeleteService(svc.id, svc.name)}
                    className="p-2 text-gray-400 hover:text-red-600 transition-colors rounded-lg hover:bg-red-50"
                    title="Delete Service"
                  >
                    <Trash2 className="h-5 w-5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
