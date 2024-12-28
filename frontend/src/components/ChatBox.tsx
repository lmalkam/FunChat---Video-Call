import React, { useState, useRef, useEffect } from 'react'

interface ChatBoxProps {
  messages: { username: string; message: string }[]
  onSendMessage: (message: string) => void
}

const ChatBox: React.FC<ChatBoxProps> = ({ messages, onSendMessage }) => {
  const [newMessage, setNewMessage] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (newMessage.trim()) {
      onSendMessage(newMessage)
      setNewMessage('')
    }
  }

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  return (
    <div className="bg-white shadow rounded-lg p-4 flex flex-col h-64">
      <h2 className="text-lg font-semibold mb-2">Chat</h2>
      <div className="flex-grow overflow-y-auto mb-2">
        {messages.map((message, index) => (
          <div key={index} className="mb-2">
            <span className="font-bold">{message.username}: </span>
            {message.message}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      <form onSubmit={handleSubmit} className="flex">
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          className="flex-grow border rounded-l-lg px-2 py-1"
          placeholder="Type a message..."
        />
        <button type="submit" className="bg-blue-500 text-white px-4 py-1 rounded-r-lg">
          Send
        </button>
      </form>
    </div>
  )
}

export default ChatBox

