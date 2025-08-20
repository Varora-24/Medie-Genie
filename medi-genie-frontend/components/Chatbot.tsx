'use client'

import { useState, useRef, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { MessageCircle, Send } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"

type Message = {
  text: string;
  sender: 'user' | 'bot';
};

const initialMessages: Message[] = [
  { text: "Hello! I'm your Medi-Genie assistant. How can I assist you with your healthcare needs today?", sender: 'bot' },
];

interface ChatbotProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

export default function Chatbot({ isOpen, setIsOpen }: ChatbotProps) {
  const [messages, setMessages] = useState<Message[]>(initialMessages)
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(scrollToBottom, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (input.trim() === '') return

    const userMessage: Message = { text: input, sender: 'user' }
    setMessages(prevMessages => [...prevMessages, userMessage])
    setInput('')
    setIsLoading(true)

    try {
      const response = await fetch('/api/chatbot', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: input }),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      if (!data || typeof data.response !== 'string') {
        throw new Error('Invalid response from server')
      }

      const botMessage: Message = { text: data.response, sender: 'bot' }
      setMessages(prevMessages => [...prevMessages, botMessage])
    } catch (error) {
      console.error('Error in chatbot response:', error)
      const errorMessage: Message = { 
        text: "I'm sorry, I'm having trouble responding right now. Please try again later.", 
        sender: 'bot' 
      }
      setMessages(prevMessages => [...prevMessages, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Medi-Genie Assistant</DialogTitle>
            <DialogDescription>
              How can I help you today?
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="h-[300px] w-full pr-4">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`mb-4 ${
                  message.sender === 'user' ? 'text-right' : 'text-left'
                }`}
              >
                <span
                  className={`inline-block p-2 rounded-lg ${
                    message.sender === 'user'
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-200 text-gray-800'
                  }`}
                >
                  {message.text}
                </span>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </ScrollArea>
          <form onSubmit={handleSendMessage} className="mt-4 flex items-center">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type your message here..."
              className="flex-grow mr-2"
              disabled={isLoading}
            />
            <Button type="submit" size="icon" disabled={isLoading}>
              <Send className="h-4 w-4" />
              <span className="sr-only">Send message</span>
            </Button>
          </form>
        </DialogContent>
      </Dialog>
      <Button 
        variant="secondary" 
        size="lg" 
        className="fixed bottom-4 left-4 rounded-full w-16 h-16 shadow-lg z-50"
        onClick={() => setIsOpen(true)}
      >
        <MessageCircle className="w-8 h-8" />
        <span className="sr-only">Open Chatbot</span>
      </Button>
    </>
  )
}

