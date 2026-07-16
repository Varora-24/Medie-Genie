'use client'

import React, { useState, useRef, useEffect, useTransition } from 'react'
import { getChatMessages, uploadChatAttachment } from '@/lib/actions/chat'
import {
  Send,
  Loader2,
  Plus,
  MessageSquare,
  Bot,
  User,
  AlertTriangle,
  ChevronLeft,
  HeartPulse,
  Pill,
  Phone,
  Paperclip,
  X,
  FileText
} from 'lucide-react'
import Link from 'next/link'

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
  attachmentUrl?: string | null
  createdAt: Date
}

interface ChatInterfaceProps {
  initialSessions: ChatSession[]
  emergencyContacts?: any[]
}

export default function ChatInterface({ initialSessions, emergencyContacts = [] }: ChatInterfaceProps) {
  const [sessions, setSessions] = useState<ChatSession[]>(initialSessions)
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [confirmingTool, setConfirmingTool] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [, startTransition] = useTransition()
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

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
    await sendChatMessage(input)
  }

  const sendChatMessage = async (text: string) => {
    const trimmed = text.trim()
    if ((!trimmed && !selectedFile) || isLoading) return

    setError(null)

    // Optimistic: add user message to UI immediately
    const optimisticUserMsg: ChatMessage = {
      id: `temp-${Date.now()}`,
      senderRole: 'PATIENT',
      content: trimmed || (selectedFile ? `[Attached file: ${selectedFile.name}]` : ''),
      flagged: false,
      attachmentUrl: selectedFile ? URL.createObjectURL(selectedFile) : null,
      createdAt: new Date(),
    }
    setMessages((prev) => [...prev, optimisticUserMsg])
    
    setInput('')
    setIsLoading(true)
    
    let uploadedUrl = null
    const fileToUpload = selectedFile
    setSelectedFile(null)

    try {
      if (fileToUpload) {
        const formData = new FormData()
        formData.append('file', fileToUpload)
        const uploadRes = await uploadChatAttachment(formData)
        if (uploadRes.error) {
          throw new Error(uploadRes.error)
        }
        uploadedUrl = uploadRes.url
      }

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: trimmed || `[Attached file: ${fileToUpload?.name}]`,
          sessionId: activeSessionId || undefined,
          attachmentUrl: uploadedUrl,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        // API error — restore the input so user doesn't lose their message
        setInput(trimmed)
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
          title: trimmed.length > 50 ? trimmed.slice(0, 50) + '…' : trimmed,
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
      setInput(trimmed)
      setMessages((prev) => prev.filter((m) => m.id !== optimisticUserMsg.id))
      setError('Network error. Please check your connection and try again.')
    } finally {
      setIsLoading(false)
    }
  }

  
  const handleConfirmTool = async (messageId: string, sessionId: string, toolName: string, args: any) => {
    setConfirmingTool(messageId)
    setError(null)
    try {
      const res = await fetch('/api/chat/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messageId, sessionId, toolName, args })
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Failed to execute action.')
        return
      }
      // Add success AI message
      const aiMsg: ChatMessage = {
        id: `ai-${Date.now()}`,
        senderRole: 'AI',
        content: data.reply || '✅ Action completed successfully.',
        flagged: false,
        createdAt: new Date(),
      }
      
      // Update the original pending tool call message to actioned
      setMessages((prev) => prev.map(m => {
        if (m.id === messageId) {
          return {
            ...m,
            content: JSON.stringify({ type: 'TOOL_CALL_ACTIONED', name: toolName, args })
          }
        }
        return m
      }).concat(aiMsg))
    } catch {
      setError('Network error during confirmation.')
    } finally {
      setConfirmingTool(null)
    }
  }

  const renderMessageContent = (msg: ChatMessage) => {
    if (msg.senderRole === 'AI') {
      try {
        const parsed = JSON.parse(msg.content)
        if (parsed.type === 'TOOL_CALL_PENDING') {
          return (
            <div className="bg-white border border-indigo-100 p-4 rounded-xl shadow-sm my-2 text-slate-800">
              <h4 className="font-bold mb-2 flex items-center gap-2">
                <Bot className="h-4 w-4 text-indigo-600" />
                Action Confirmation Required
              </h4>
              {parsed.name === 'create_reminder' && (
                <p className="text-sm mb-4">
                  I'll create a reminder for: <strong className="text-indigo-700">{parsed.args.title}</strong> on {new Date(parsed.args.dueDate).toLocaleString()}
                </p>
              )}
              {parsed.name === 'book_appointment' && (
                <p className="text-sm mb-4">
                  I'll book an appointment on {new Date(parsed.args.dateTime).toLocaleString()} for "{parsed.args.reason}".
                </p>
              )}
              <div className="flex gap-3">
                <button
                  onClick={() => handleConfirmTool(msg.id, activeSessionId as string, parsed.name, parsed.args)}
                  disabled={confirmingTool === msg.id}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-2 disabled:bg-indigo-300"
                >
                  {confirmingTool === msg.id ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Confirm'}
                </button>
                <button
                  disabled={confirmingTool === msg.id}
                  onClick={() => setMessages(prev => prev.filter(m => m.id !== msg.id))}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-medium rounded-lg transition-colors disabled:bg-slate-50 disabled:text-slate-400"
                >
                  Cancel
                </button>
              </div>
            </div>
          )
        } else if (parsed.type === 'TOOL_CALL_ACTIONED') {
          return (
            <div className="bg-emerald-50 border border-emerald-100 p-3 rounded-xl shadow-sm my-2 text-slate-800 flex items-center gap-2">
              <div className="h-6 w-6 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
                <span className="text-emerald-600 font-bold text-xs">✓</span>
              </div>
              <p className="text-sm font-medium text-emerald-800">
                {parsed.name === 'create_reminder' ? 'Reminder created successfully.' : 'Appointment booked successfully.'}
              </p>
            </div>
          )
        }
      } catch (e) {
        // Not a JSON tool call
      }
    }
    return <div className="whitespace-pre-wrap">{msg.content}</div>
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
          <span className="text-sm font-semibold text-slate-800">Genie Assist</span>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-center px-6">
              <Bot className="h-10 w-10 text-slate-300 mb-3" />
              <h3 className="text-base font-bold text-slate-700 mb-1">
                How can Genie Assist help?
              </h3>
              <p className="text-sm text-slate-400 max-w-sm">
                Tell me what you&apos;re experiencing and I&apos;ll provide general
                guidance. Remember — I&apos;m not a doctor.
              </p>
            </div>
          )}

          {messages.map((msg, index) => {
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
                    {msg.attachmentUrl && (
                      <div className="mb-2">
                        {msg.attachmentUrl.endsWith('.pdf') ? (
                          <a href={msg.attachmentUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 p-2 bg-white/10 rounded-lg border border-white/20 hover:bg-white/20 transition-colors">
                            <FileText className="h-4 w-4" />
                            <span className="text-xs font-medium truncate max-w-[200px]">Attached PDF</span>
                          </a>
                        ) : (
                          <img 
                            src={msg.attachmentUrl} 
                            alt="Attachment" 
                            className="max-w-full max-h-48 rounded-lg object-contain bg-white/5 border border-white/10"
                          />
                        )}
                      </div>
                    )}
                    {renderMessageContent(msg)}
                  </div>
                </div>

                {/* Triage action buttons for the last AI message */}
                {index === messages.length - 1 && !isUser && !isLoading && (
                  <div className="mt-4 flex flex-col gap-3 ml-9">
                    {msg.flagged ? (
                      <div className="bg-red-50 p-4 rounded-xl border border-red-200 shadow-sm max-w-[85%] lg:max-w-[70%] space-y-3">
                        <p className="text-sm text-red-800 font-bold uppercase tracking-wide flex items-center gap-2">
                          <AlertTriangle className="h-5 w-5" />
                          Call Emergency Services Immediately
                        </p>
                        <p className="text-xs text-red-700 font-medium">
                          Do not wait. The facility finder below is only for secondary reference.
                        </p>
                        <Link
                          href="/dashboard/find-care?emergency=true"
                          className="mt-2 inline-flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-bold rounded-lg transition-colors shadow-sm"
                        >
                          <HeartPulse className="h-4 w-4" />
                          Find Emergency Rooms Near Me
                        </Link>
                        
                        {/* Emergency Contacts Section */}
                        {emergencyContacts && emergencyContacts.length > 0 && (
                          <div className="mt-4 pt-4 border-t border-red-200 space-y-2">
                            <p className="text-sm text-red-800 font-bold flex items-center gap-2">
                              <Phone className="h-4 w-4" />
                              Notify your emergency contacts
                            </p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
                              {emergencyContacts.map((contact) => (
                                <a
                                  key={contact.id}
                                  href={`tel:${contact.phone}`}
                                  className="flex items-center justify-between p-2.5 bg-white rounded-lg border border-red-200 hover:border-red-300 transition-colors"
                                >
                                  <div>
                                    <p className="text-sm font-bold text-slate-800">{contact.name}</p>
                                    <p className="text-xs text-slate-500">{contact.relation}</p>
                                  </div>
                                  <div className="h-8 w-8 rounded-full bg-red-50 flex items-center justify-center text-red-600">
                                    <Phone className="h-4 w-4" />
                                  </div>
                                </a>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="flex flex-wrap gap-2 max-w-[85%] lg:max-w-[70%]">
                        <button
                          onClick={() => sendChatMessage("Could you suggest some home remedies or general self-care guidance for these symptoms?")}
                          className="flex items-center gap-2 px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 text-sm font-semibold rounded-lg transition-colors"
                        >
                          <Pill className="h-4 w-4" />
                          Home Remedy Suggestions
                        </button>
                        <Link
                          href="/dashboard/find-care"
                          className="flex items-center gap-2 px-4 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 text-sm font-semibold rounded-lg transition-colors"
                        >
                          <HeartPulse className="h-4 w-4" />
                          Find Medical Care Near Me
                        </Link>
                      </div>
                    )}
                  </div>
                )}
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
          
          {/* File Preview */}
          {selectedFile && (
            <div className="mb-3 flex items-center gap-3 p-3 bg-indigo-50 border border-indigo-100 rounded-xl relative">
              <div className="flex items-center justify-center h-10 w-10 bg-white rounded-lg border border-indigo-200 text-indigo-500 overflow-hidden">
                {selectedFile.type.startsWith('image/') ? (
                  <img src={URL.createObjectURL(selectedFile)} alt="Preview" className="h-full w-full object-cover" />
                ) : (
                  <FileText className="h-5 w-5" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-800 truncate">{selectedFile.name}</p>
                <p className="text-xs text-slate-500">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
              </div>
              <button 
                onClick={() => setSelectedFile(null)}
                className="p-1.5 hover:bg-indigo-100 rounded-lg text-indigo-400 hover:text-indigo-600 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          )}

          <div className="flex items-end gap-2">
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isLoading || selectedFile !== null}
              className="h-11 w-11 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition-colors disabled:bg-slate-50 disabled:text-slate-300 cursor-pointer flex-shrink-0"
              title="Attach an image or PDF"
            >
              <Paperclip className="h-5 w-5" />
            </button>
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              accept="image/jpeg,image/png,image/webp,application/pdf"
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) {
                  if (file.size > 5 * 1024 * 1024) {
                    setError('File must be smaller than 5MB')
                    return
                  }
                  setSelectedFile(file)
                  setError(null)
                  inputRef.current?.focus()
                }
                e.target.value = ''
              }}
            />
            
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="How can Genie Assist help?..."
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
              disabled={isLoading || (!input.trim() && !selectedFile)}
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
