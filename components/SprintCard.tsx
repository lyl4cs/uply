'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

interface Sprint {
  id: string
  title: string
  description: string | null
  skill: string
  start_date: string
  end_date: string
}

interface Participation {
  id: string
  current_streak: number
  longest_streak: number
  total_check_ins: number
}

export default function SprintCard({ 
  sprint, 
  participation, 
  user 
}: { 
  sprint: Sprint
  participation: Participation | null
  user: any
}) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const calculateDayNumber = () => {
    const today = new Date()
    const startDate = new Date(sprint.start_date)
    const diffTime = today.getTime() - startDate.getTime()
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1
    return Math.max(1, Math.min(30, diffDays))
  }

  const handleJoinSprint = async () => {
    setLoading(true)
    const { error } = await supabase
      .from('sprint_participants')
      .insert({
        user_id: user.id,
        sprint_id: sprint.id,
      })

    if (!error) {
      router.refresh()
    }
    setLoading(false)
  }

  const daysRemaining = () => {
    const today = new Date()
    const endDate = new Date(sprint.end_date)
    const diffTime = endDate.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return Math.max(0, diffDays)
  }

  return (
    <div className="rounded-lg bg-white p-6 shadow">
      <div className="mb-4">
        <h2 className="text-2xl font-bold text-gray-900">{sprint.title}</h2>
        <p className="mt-1 text-gray-600">{sprint.description}</p>
      </div>

      <div className="mb-4 grid grid-cols-3 gap-4">
        <div>
          <p className="text-sm text-gray-500">Skill</p>
          <p className="text-lg font-semibold text-gray-900">{sprint.skill}</p>
        </div>
        <div>
          <p className="text-sm text-gray-500">Day</p>
          <p className="text-lg font-semibold text-gray-900">{calculateDayNumber()} / 30</p>
        </div>
        <div>
          <p className="text-sm text-gray-500">Days Left</p>
          <p className="text-lg font-semibold text-gray-900">{daysRemaining()}</p>
        </div>
      </div>

      {participation ? (
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-4 rounded-md bg-blue-50 p-4">
            <div>
              <p className="text-sm text-blue-600">Current Streak</p>
              <p className="text-2xl font-bold text-blue-900">{participation.current_streak}</p>
            </div>
            <div>
              <p className="text-sm text-blue-600">Longest Streak</p>
              <p className="text-2xl font-bold text-blue-900">{participation.longest_streak}</p>
            </div>
            <div>
              <p className="text-sm text-blue-600">Total Check-ins</p>
              <p className="text-2xl font-bold text-blue-900">{participation.total_check_ins}</p>
            </div>
          </div>
          <p className="text-sm text-green-600 font-medium">✓ You're participating in this sprint!</p>
        </div>
      ) : (
        <button
          onClick={handleJoinSprint}
          disabled={loading}
          className="w-full rounded-md bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
        >
          {loading ? 'Joining...' : 'Join Sprint'}
        </button>
      )}
    </div>
  )
}
