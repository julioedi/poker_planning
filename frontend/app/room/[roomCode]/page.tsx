'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'

export default function RoomPage() {
  const params = useParams()
  const roomCode = params.roomCode as string
  const [isConnected, setIsConnected] = useState(false)

  useEffect(() => {
    // TODO: Implement Socket.IO connection
    setIsConnected(true)
  }, [])

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Poker Planning Room
          </h1>
          <p className="text-gray-600 mt-2">
            Room Code: <span className="font-mono bg-gray-200 px-2 py-1 rounded">{roomCode}</span>
          </p>
          <div className="flex items-center mt-2">
            <div className={`w-3 h-3 rounded-full mr-2 ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
            <span className="text-sm text-gray-600">
              {isConnected ? 'Connected' : 'Connecting...'}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Voting Area */}
          <div className="lg:col-span-2">
            <div className="card">
              <div className="card-header">
                <h3 className="card-title">Current Topic</h3>
              </div>
              <div className="card-content">
                <p className="text-gray-500 text-sm">
                  No active topic
                </p>
              </div>
            </div>

            {/* Voting Cards */}
            <div className="card mt-6">
              <div className="card-header">
                <h3 className="card-title">Vote</h3>
              </div>
              <div className="card-content">
                <div className="grid grid-cols-3 md:grid-cols-5 gap-4">
                  {['1', '2', '3', '5', '8', '13', '21', '?', '☕'].map((value) => (
                    <button
                      key={value}
                      className="btn-outline btn-lg text-lg font-bold"
                    >
                      {value}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Participants */}
            <div className="card">
              <div className="card-header">
                <h3 className="card-title">Participants</h3>
              </div>
              <div className="card-content">
                <p className="text-gray-500 text-sm">
                  No participants yet
                </p>
              </div>
            </div>

            {/* Topics */}
            <div className="card">
              <div className="card-header">
                <h3 className="card-title">Topics</h3>
              </div>
              <div className="card-content">
                <p className="text-gray-500 text-sm">
                  No topics added
                </p>
              </div>
            </div>

            {/* Chat */}
            <div className="card">
              <div className="card-header">
                <h3 className="card-title">Chat</h3>
              </div>
              <div className="card-content">
                <div className="h-64 bg-gray-50 rounded border p-3 mb-3 overflow-y-auto">
                  <p className="text-gray-500 text-sm">
                    No messages yet
                  </p>
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Type a message..."
                    className="input flex-1"
                  />
                  <button className="btn-primary btn-sm">
                    Send
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 