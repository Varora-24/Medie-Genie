'use client'

import React, { useState, useEffect } from 'react'
import { getLabServices, getPatientLabBookings, createLabBooking } from '@/lib/actions/lab-actions'
import { 
  Activity, 
  Calendar, 
  Home, 
  Building2,
  CheckCircle2,
  AlertCircle,
  Tag
} from 'lucide-react'

type LabService = {
  id: string
  name: string
  category: string
  description: string | null
  homeVisitAvailable: boolean
  labVisitAvailable: boolean
}

type LabBooking = {
  id: string
  visitType: string
  address: string | null
  scheduledAt: Date
  status: string
  notes: string | null
  service: LabService
}

export default function LabServicesPage() {
  const [services, setServices] = useState<LabService[]>([])
  const [bookings, setBookings] = useState<LabBooking[]>([])
  const [activeTab, setActiveTab] = useState<'browse' | 'my-bookings'>('browse')
  const [selectedCategory, setSelectedCategory] = useState<string>('All')
  const [loading, setLoading] = useState<boolean>(true)

  // Modal State
  const [selectedService, setSelectedService] = useState<LabService | null>(null)
  const [visitType, setVisitType] = useState<'HOME' | 'LAB'>('HOME')
  const [address, setAddress] = useState<string>('')
  const [scheduledAt, setScheduledAt] = useState<string>('')
  const [notes, setNotes] = useState<string>('')
  const [bookingLoading, setBookingLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  useEffect(() => {
    async function loadData() {
      setLoading(true)
      try {
        const [loadedServices, loadedBookings] = await Promise.all([
          getLabServices(),
          getPatientLabBookings()
        ])
        setServices(loadedServices)
        setBookings(loadedBookings as any)
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [successMsg])

  const categories = ['All', ...Array.from(new Set(services.map(s => s.category)))]
  const filteredServices = selectedCategory === 'All' 
    ? services 
    : services.filter(s => s.category === selectedCategory)

  const handleOpenModal = (service: LabService) => {
    setSelectedService(service)
    setVisitType(service.homeVisitAvailable ? 'HOME' : 'LAB')
    setAddress('')
    setScheduledAt('')
    setNotes('')
    setError(null)
  }

  const handleBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedService) return

    setBookingLoading(true)
    setError(null)

    const res = await createLabBooking({
      serviceId: selectedService.id,
      visitType,
      address,
      scheduledAt,
      notes
    })

    setBookingLoading(false)

    if (res.success) {
      setSuccessMsg(`Your booking for ${selectedService.name} has been confirmed!`)
      setSelectedService(null)
      setTimeout(() => setSuccessMsg(null), 6000)
    } else {
      setError(res.error || 'Failed to book appointment')
    }
  }

  return (
    <div className="max-w-6xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight flex items-center gap-3">
          <Activity className="h-8 w-8 text-indigo-600" />
          Pathology & Lab Services
        </h1>
        <p className="mt-2 text-lg text-gray-600">
          Book diagnostics, routine blood tests, and scans. Choose home sample collection or direct lab walk-in.
        </p>
      </div>

      {/* Success Notification */}
      {successMsg && (
        <div className="mb-6 rounded-lg bg-green-50 p-4 border border-green-200 flex items-center gap-3">
          <CheckCircle2 className="h-6 w-6 text-green-600 flex-shrink-0" />
          <span className="text-green-800 font-medium">{successMsg}</span>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="border-b border-gray-200 mb-8">
        <nav className="-mb-px flex gap-8" aria-label="Tabs">
          <button
            onClick={() => setActiveTab('browse')}
            className={`py-4 px-1 border-b-2 font-semibold text-sm ${
              activeTab === 'browse'
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Browse Diagnostics ({services.length})
          </button>
          <button
            onClick={() => setActiveTab('my-bookings')}
            className={`py-4 px-1 border-b-2 font-semibold text-sm ${
              activeTab === 'my-bookings'
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            My Lab Bookings ({bookings.length})
          </button>
        </nav>
      </div>

      {loading ? (
        <div className="text-center py-16">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-indigo-600 border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]" />
          <p className="mt-4 text-gray-500 font-medium">Loading lab services...</p>
        </div>
      ) : activeTab === 'browse' ? (
        /* BROWSE TAB */
        <div>
          {/* Category Filter */}
          <div className="flex flex-wrap gap-2 mb-6">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  selectedCategory === cat
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Services Grid */}
          {filteredServices.length === 0 ? (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center text-gray-500">
              No diagnostic tests found in this category.
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {filteredServices.map((svc) => (
                <div 
                  key={svc.id} 
                  className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow border border-gray-200 flex flex-col overflow-hidden"
                >
                  <div className="p-6 flex-1 flex flex-col">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-50 text-indigo-700 border border-indigo-100">
                        <Tag className="h-3 w-3 mr-1" />
                        {svc.category}
                      </span>
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 mb-2">{svc.name}</h3>
                    <p className="text-sm text-gray-600 mb-6 flex-1">
                      {svc.description || "Routine pathology/lab testing service."}
                    </p>
                    
                    <div className="pt-4 border-t border-gray-100 flex items-center justify-between mt-auto">
                      <div className="flex gap-2">
                        {svc.homeVisitAvailable && (
                          <span title="Home Collection Available" className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-emerald-50 text-emerald-700">
                            <Home className="h-3.5 w-3.5 mr-1" /> Home
                          </span>
                        )}
                        {svc.labVisitAvailable && (
                          <span title="Lab Visit Available" className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-blue-50 text-blue-700">
                            <Building2 className="h-3.5 w-3.5 mr-1" /> Lab Visit
                          </span>
                        )}
                      </div>

                      <button
                        onClick={() => handleOpenModal(svc)}
                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-semibold rounded-lg text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm transition-colors"
                      >
                        Book Test
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        /* MY BOOKINGS TAB */
        <div>
          {bookings.length === 0 ? (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center text-gray-500">
              You haven't scheduled any lab tests yet. Switch to the Browse tab to book your diagnostic services!
            </div>
          ) : (
            <div className="space-y-4">
              {bookings.map((b) => (
                <div key={b.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                  <div>
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-gray-100 text-gray-800 mb-2">
                      {b.service.category}
                    </span>
                    <h3 className="text-xl font-bold text-gray-900">{b.service.name}</h3>
                    <div className="mt-2 text-sm text-gray-600 flex flex-wrap gap-x-6 gap-y-1">
                      <span className="flex items-center gap-1.5 font-medium text-gray-900">
                        <Calendar className="h-4 w-4 text-indigo-500" />
                        {new Date(b.scheduledAt).toLocaleString(undefined, {
                          weekday: 'short',
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                          hour: 'numeric',
                          minute: '2-digit'
                        })}
                      </span>
                      <span className="flex items-center gap-1.5 text-gray-600">
                        {b.visitType === 'HOME' ? (
                          <>
                            <Home className="h-4 w-4 text-emerald-600" />
                            <span>Home Collection: <strong>{b.address || 'Saved Address'}</strong></span>
                          </>
                        ) : (
                          <>
                            <Building2 className="h-4 w-4 text-blue-600" />
                            <span>Direct Lab Walk-in</span>
                          </>
                        )}
                      </span>
                    </div>
                    {b.notes && (
                      <p className="mt-2 text-sm text-gray-500 bg-gray-50 p-2 rounded border border-gray-200">
                        <strong>Notes:</strong> {b.notes}
                      </p>
                    )}
                  </div>

                  <div>
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold tracking-wide uppercase ${
                      b.status === 'CONFIRMED' ? 'bg-green-100 text-green-800' :
                      b.status === 'CANCELLED' ? 'bg-red-100 text-red-800' :
                      'bg-amber-100 text-amber-800'
                    }`}>
                      {b.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* BOOKING MODAL */}
      {selectedService && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-40 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full overflow-hidden border border-gray-200 animate-in fade-in zoom-in-95">
            <div className="bg-indigo-600 px-6 py-4 flex items-center justify-between">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Activity className="h-6 w-6" />
                Book {selectedService.name}
              </h3>
              <button 
                onClick={() => setSelectedService(null)}
                className="text-indigo-200 hover:text-white text-sm font-bold p-1"
              >
                Close ✕
              </button>
            </div>

            <form onSubmit={handleBookingSubmit} className="p-6 space-y-4">
              {error && (
                <div className="rounded-md bg-red-50 p-3 border border-red-200 flex items-center gap-2 text-sm text-red-700">
                  <AlertCircle className="h-5 w-5 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Select Visit Type</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    disabled={!selectedService.homeVisitAvailable}
                    onClick={() => setVisitType('HOME')}
                    className={`flex items-center justify-center gap-2 py-3 px-4 rounded-xl border-2 font-semibold text-sm transition-colors ${
                      !selectedService.homeVisitAvailable ? 'opacity-40 cursor-not-allowed bg-gray-50 border-gray-200 text-gray-400' :
                      visitType === 'HOME' ? 'border-emerald-600 bg-emerald-50 text-emerald-700' : 'border-gray-200 bg-white hover:bg-gray-50 text-gray-700'
                    }`}
                  >
                    <Home className="h-5 w-5" /> Home Collection
                  </button>

                  <button
                    type="button"
                    disabled={!selectedService.labVisitAvailable}
                    onClick={() => setVisitType('LAB')}
                    className={`flex items-center justify-center gap-2 py-3 px-4 rounded-xl border-2 font-semibold text-sm transition-colors ${
                      !selectedService.labVisitAvailable ? 'opacity-40 cursor-not-allowed bg-gray-50 border-gray-200 text-gray-400' :
                      visitType === 'LAB' ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-gray-200 bg-white hover:bg-gray-50 text-gray-700'
                    }`}
                  >
                    <Building2 className="h-5 w-5" /> Lab Walk-in
                  </button>
                </div>
              </div>

              {visitType === 'HOME' && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Sample Collection Address <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 123 Health Ave, Apt 4B, Sydney"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-sm"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Preferred Date & Time <span className="text-red-500">*</span>
                </label>
                <input
                  type="datetime-local"
                  required
                  value={scheduledAt}
                  onChange={(e) => setScheduledAt(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Additional Notes / Instructions <span className="text-gray-400 font-normal">(Optional)</span>
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Fasting since 10pm previous night, please call upon arriving"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-sm"
                />
              </div>

              <div className="pt-4 flex items-center justify-end gap-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setSelectedService(null)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={bookingLoading}
                  className="px-5 py-2 rounded-lg bg-indigo-600 text-white font-semibold text-sm hover:bg-indigo-700 shadow-md transition-all disabled:opacity-50 flex items-center gap-2"
                >
                  {bookingLoading && (
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-solid border-white border-r-transparent" />
                  )}
                  Confirm Lab Booking
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
