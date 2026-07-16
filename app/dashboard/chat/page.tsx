import React from 'react'
import { getChatSessions } from '@/lib/actions/chat'
import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import ChatInterface from './chat-interface'
import { ShieldAlert } from 'lucide-react'

import db from '@/lib/db'

export default async function ChatPage() {
  const session = await auth()
  if (!session?.user) {
    redirect('/login')
  }

  const userId = (session.user as any).id
  const chatSessions = await getChatSessions()
  const emergencyContacts = await db.emergencyContact.findMany({
    where: { userId },
    orderBy: { createdAt: 'asc' }
  })

  return (
    <div className="space-y-4">
      {/* Non-dismissible medical disclaimer */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 flex items-start gap-3">
        <ShieldAlert className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-semibold text-amber-800">
            This is not a substitute for professional medical advice.
          </p>
          <p className="text-xs text-amber-700 mt-0.5">
            The AI assistant provides general guidance only — it cannot diagnose conditions
            or prescribe medication. In an emergency, contact emergency services immediately.
          </p>
        </div>
      </div>

      <ChatInterface initialSessions={chatSessions as any} emergencyContacts={emergencyContacts as any} />
    </div>
  )
}
