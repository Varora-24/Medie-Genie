'use client'

import React, { useState, useRef, useEffect, useTransition } from 'react'
import { getChatMessages } from '@/lib/actions/chat'
import {
  Send,
  Loader2,
  Plus,
  MessageSquare,
  Bot,
  User,
  AlertTriangle,
  ChevronLeft,
} from 'lucide-react'

interface ChatSession {
  id: string
  title: string
  createdAt: Date
  _count: { messages: number }
}

interface ChatMessage {
  id: string
  senderRole: string
  content: string
  flagged: boolean
  createdAt: Date
}

interface ChatInterfaceProps {
  initialSessions: ChatSession[]
}

export default function ChatInterface({ initialSessions }: ChatInterfaceProps) {
  const [sessions, setSessions] = useState<ChatSession[]>(initialSessions)
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [, startTransition] = useTransition()
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus()
  }, [activeSessionId])

  const loadSession = async (sessionId: string) => {
    setActiveSessionId(sessionId)
    setError(null)
    setSidebarOpen(false)
    startTransition(async () => {
      const msgs = await getChatMessages(sessionId)
      setMessages(msgs as ChatMessage[])
    })
  }

  const startNewChat = () => {
    setActiveSessionId(null)
    setMessages([])
    setError(null)
    setInput('')
    setSidebarOpen(false)
    inputRef.current?.focus()
  }

  const handleSend = async () => {
    const trimmed = input.trim()
    if (!trimmed || isLoading) return

    setError(null)

    // Optimistic: add user message to UI immediately
    const optimisticUserMsg: ChatMessage = {
      id: `temp-${Date.now()}`,
      senderRole: 'PATIENT',
      content: trimmed,
      flagged: false,
      createdAt: new Date(),
    }
    setMessages((prev) => [...prev, optimisticUserMsg])
    // Do NOT clear input yet — only clear on success
    const sentText = trimmed
    setInput('')
    setIsLoading(true)

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: sentText,
          sessionId: activeSessionId || undefined,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        // API error — restore the input so user doesn't lose their message
        setInput(sentText)
        // Remove the optimistic user message
        setMessages((prev) => prev.filter((m) => m.id !== optimisticUserMsg.id))
        setError(data.error || 'Something went wrong. Please try again.')
        return
      }

      // Update session id if this was a new session
      if (!activeSessionId && data.sessionId) {
        setActiveSessionId(data.sessionId)
        // Add to sessions sidebar
        const newSession: ChatSession = {
          id: data.sessionId,
          title: sentText.length > 50 ? sentText.slice(0, 50) + '…' : sentText,
          createdAt: new Date(),
          _count: { messages: 2 },
        }
        setSessions((prev) => [newSession, ...prev])
      }

      // Add AI reply
      const aiMsg: ChatMessage = {
        id: `ai-${Date.now()}`,
        senderRole: 'AI',
        content: data.reply,
        flagged: data.flagged,
        createdAt: new Date(),
      }
      setMessages((prev) => [...prev, aiMsg])
    } catch {
      setInput(sentText)
      setMessages((prev) => prev.filter((m) => m.id !== optimisticUserMsg.id))
      setError('Network error. Please check your connection and try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="flex h-[calc(100vh-8.5rem)] bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      {/* ── Session Sidebar ─────────────────────────────────────── */}
      <div
        className={`${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0 absolute lg:relative z-20 w-72 h-full bg-slate-50 border-r border-slate-200 flex flex-col transition-transform`}
      >
        <div className="p-4 border-b border-slate-200 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-800">Conversations</h3>
          <button
            onClick={startNewChat}
            className="p-1.5 rounded-lg hover:bg-slate-200 text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
            title="New chat"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {sessions.length === 0 ? (
            <p className="text-xs text-slate-400 text-center mt-8 px-4">
              No conversations yet. Send a message to start.
            </p>
          ) : (
            sessions.map((s) => (
              <button
                key={s.id}
                onClick={() => loadSession(s.id)}
                className={`w-full text-left px-3 py-2.5 rounded-lg text-sm transition-colors cursor-pointer ${
                  activeSessionId === s.id
                    ? 'bg-indigo-50 text-indigo-700 font-semibold'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <div className="flex items-center gap-2">
                  <MessageSquare className="h-3.5 w-3.5 flex-shrink-0 text-slate-400" />
                  <span className="truncate">{s.title}</span>
                </div>
                <span className="text-[10px] text-slate-400 ml-5.5 block mt-0.5">
                  {s._count.messages} messages
                </span>
              </button>
            ))
          )}
        </div>
      </div>

      {/* ── Sidebar overlay on mobile ───────────────────────────── */}
      {sidebarOpen && (
        <div
          className="lg:hidden absolute inset-0 z-10 bg-black/20"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ── Main Chat Area ──────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Chat header */}
        <div className="h-12 px-4 flex items-center gap-3 border-b border-slate-200 bg-white flex-shrink-0">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 cursor-pointer"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <Bot className="h-4.5 w-4.5 text-indigo-600" />
          <span className="text-sm font-semibold text-slate-800">Symptom Assistant</span>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-center px-6">
              <Bot className="h-10 w-10 text-slate-300 mb-3" />
              <h3 className="text-base font-bold text-slate-700 mb-1">
                Describe your symptoms
              </h3>
              <p className="text-sm text-slate-400 max-w-sm">
                Tell me what you&apos;re experiencing and I&apos;ll provide general
                guidance. Remember — I&apos;m not a doctor.
              </p>
            </div>
          )}

          {messages.map((msg) => {
            const isUser = msg.senderRole === 'PATIENT'
            return (
              <div
                key={msg.id}
                className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`flex gap-2.5 max-w-[85%] lg:max-w-[70%] ${
                    isUser ? 'flex-row-reverse' : 'flex-row'
                  }`}
                >
                  {/* Avatar */}
                  <div
                    className={`h-7 w-7 rounded-full flex items-center justify-center flex-shrink-0 mt-1 ${
                      isUser
                        ? 'bg-indigo-100 text-indigo-600'
                        : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    {isUser ? (
                      <User className="h-3.5 w-3.5" />
                    ) : (
                      <Bot className="h-3.5 w-3.5" />
                    )}
                  </div>

                  {/* Bubble */}
                  <div
                    className={`rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                      isUser
                        ? 'bg-indigo-600 text-white rounded-br-md'
                        : msg.flagged
                        ? 'bg-red-50 text-slate-800 border-2 border-red-200 rounded-bl-md'
                        : 'bg-slate-100 text-slate-800 rounded-bl-md'
                    }`}
                  >
                    {msg.flagged && !isUser && (
                      <div className="flex items-center gap-1.5 text-red-600 text-xs font-bold mb-2">
                        <AlertTriangle className="h-3.5 w-3.5" />
                        Emergency guidance
                      </div>
                    )}
                    <div className="whitespace-pre-wrap">{msg.content}</div>
                  </div>
                </div>
              </div>
            )
          })}

          {/* Loading indicator */}
          {isLoading && (
            <div className="flex justify-start">
              <div className="flex gap-2.5">
                <div className="h-7 w-7 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center flex-shrink-0 mt-1">
                  <Bot className="h-3.5 w-3.5" />
                </div>
                <div className="bg-slate-100 rounded-2xl rounded-bl-md px-4 py-3 text-sm text-slate-500 flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Thinking…
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Error banner */}
        {error && (
          <div className="mx-4 mb-2 px-4 py-2.5 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700 font-medium flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 flex-shrink-0" />
            {error}
          </div>
        )}

        {/* Input bar */}
        <div className="p-4 border-t border-slate-200 bg-white flex-shrink-0">
          <div className="flex items-end gap-2">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Describe your symptoms…"
              rows={1}
              disabled={isLoading}
              className="flex-1 resize-none rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all disabled:bg-slate-50 disabled:text-slate-400"
              style={{ maxHeight: '120px' }}
              onInput={(e) => {
                const target = e.target as HTMLTextAreaElement
                target.style.height = 'auto'
                target.style.height = Math.min(target.scrollHeight, 120) + 'px'
              }}
            />
            <button
              onClick={handleSend}
              disabled={isLoading || !input.trim()}
              className="h-11 w-11 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white flex items-center justify-center transition-colors disabled:bg-slate-200 disabled:text-slate-400 cursor-pointer flex-shrink-0"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </button>
          </div>
          <p className="text-[10px] text-slate-400 mt-2 text-center">
            Press Enter to send · Shift+Enter for new line
          </p>
        </div>
      </div>
    </div>
  )
}
