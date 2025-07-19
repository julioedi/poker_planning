'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useRouter } from 'next/navigation'
import { toast } from 'react-hot-toast'
import axios from 'axios'

interface JoinRoomFormData {
  roomCode: string
}

export default function JoinRoomForm() {
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const { register, handleSubmit, formState: { errors } } = useForm<JoinRoomFormData>()

  const onSubmit = async (data: JoinRoomFormData) => {
    setIsLoading(true)
    try {
      // For now, just redirect to room with the code
      // In a real app, you'd validate the room code first
      router.push(`/room/${data.roomCode}`)
    } catch (error: any) {
      toast.error('Failed to join room')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <label htmlFor="roomCode" className="block text-sm font-medium text-secondary-700 mb-1">
          Room Code
        </label>
        <input
          id="roomCode"
          type="text"
          {...register('roomCode', { 
            required: 'Room code is required',
            pattern: {
              value: /^[A-Z0-9]{6}$/,
              message: 'Room code must be 6 characters (letters and numbers)'
            }
          })}
          className="input"
          placeholder="Enter 6-digit room code"
          maxLength={6}
        />
        {errors.roomCode && (
          <p className="mt-1 text-sm text-red-600">{errors.roomCode.message}</p>
        )}
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="btn-primary btn-md w-full"
      >
        {isLoading ? 'Joining...' : 'Join Room'}
      </button>
    </form>
  )
} 