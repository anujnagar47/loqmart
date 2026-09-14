import { useState, useEffect, useRef } from "react"
import { Send, X, MessageSquare } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

interface Message {
  id: string
  sender_id: string
  receiver_id: string
  content: string
  created_at: string
}

export function ChatWindow({ 
  currentUserId, 
  receiverId, 
  receiverName 
}: { 
  currentUserId: string
  receiverId: string
  receiverName: string 
}) {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (isOpen) {
      fetchMessages()
      // Setup polling or realtime subscription here
      const interval = setInterval(fetchMessages, 5000)
      return () => clearInterval(interval)
    }
  }, [isOpen, receiverId])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const fetchMessages = async () => {
    try {
      const res = await fetch(`/api/chat?otherId=${receiverId}`)
      if (res.ok) {
        const data = await res.json()
        setMessages(data.messages || [])
      }
    } catch (e) {
      console.error("Failed to fetch messages", e)
    }
  }

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim()) return

    setIsLoading(true)
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sender_id: currentUserId,
          receiver_id: receiverId,
          content: newMessage.trim()
        })
      })

      if (res.ok) {
        setNewMessage("")
        fetchMessages()
      }
    } catch (e) {
      console.error("Failed to send message", e)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      {/* Floating Action Button */}
      {!isOpen && (
        <button 
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 w-14 h-14 bg-primary text-on-primary rounded-full shadow-lg flex items-center justify-center hover:scale-105 transition-transform z-50"
        >
          <MessageSquare className="w-6 h-6" />
        </button>
      )}

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.9 }}
            className="fixed bottom-6 right-6 w-80 sm:w-96 h-[500px] bg-surface-container-lowest rounded-2xl shadow-2xl flex flex-col z-50 overflow-hidden border border-outline-variant"
          >
            {/* Header */}
            <div className="bg-primary-container p-4 flex items-center justify-between text-on-primary-fixed">
              <div>
                <h3 className="font-bold">{receiverName}</h3>
                <p className="text-xs opacity-80">Usually replies in 2 hours</p>
              </div>
              <button onClick={() => setIsOpen(false)} className="p-2 hover:bg-black/10 rounded-full transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Messages Area */}
            <div className="flex-1 p-4 overflow-y-auto bg-surface flex flex-col gap-3">
              {messages.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center opacity-50">
                  <MessageSquare className="w-12 h-12 mb-2" />
                  <p className="text-sm">No messages yet. Send a message to start the conversation!</p>
                </div>
              ) : (
                messages.map((msg) => {
                  const isMe = msg.sender_id === currentUserId
                  return (
                    <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[80%] rounded-2xl p-3 text-sm ${
                        isMe 
                          ? 'bg-primary text-on-primary rounded-tr-sm' 
                          : 'bg-surface-variant text-on-surface-variant rounded-tl-sm'
                      }`}>
                        {msg.content}
                      </div>
                    </div>
                  )
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <form onSubmit={sendMessage} className="p-3 bg-surface-container-lowest border-t border-outline-variant flex gap-2">
              <input 
                type="text" 
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type a message..."
                className="flex-1 bg-surface-container rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
              <button 
                type="submit" 
                disabled={!newMessage.trim() || isLoading}
                className="w-10 h-10 bg-primary text-on-primary rounded-full flex items-center justify-center disabled:opacity-50 transition-opacity"
              >
                <Send className="w-4 h-4 ml-0.5" />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
