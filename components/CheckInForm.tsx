'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

interface Sprint {
  id: string
  title: string
  start_date: string
}

interface CheckIn {
  id: string
  content: string
  proof_url: string | null
}

export default function CheckInForm({ 
  sprint, 
  user,
  todaysCheckIn 
}: { 
  sprint: Sprint
  user: any
  todaysCheckIn: CheckIn | null
}) {
  const [content, setContent] = useState(todaysCheckIn?.content || '')
  const [proofUrl, setProofUrl] = useState(todaysCheckIn?.proof_url || '')
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const today = new Date().toISOString().split('T')[0]
    const dayNumber = calculateDayNumber()

    if (todaysCheckIn) {
      // Update existing check-in
      const { error } = await supabase
        .from('check_ins')
        .update({
          content,
          proof_url: proofUrl || null,
        })
        .eq('id', todaysCheckIn.id)

      if (!error) {
        router.refresh()
      }
    } else {
      // Create new check-in
      const { error } = await supabase
        .from('check_ins')
        .insert({
          user_id: user.id,
          sprint_id: sprint.id,
          day_number: dayNumber,
          content,
          proof_url: proofUrl || null,
          check_in_date: today,
        })

      if (!error) {
        setContent('')
        setProofUrl('')
        router.refresh()
      }
    }

    setLoading(false)
  }

  return (
    <div className="rounded-lg bg-white p-6 shadow">
      <h3 className="mb-4 text-xl font-semibold text-gray-900">Today's Check-in</h3>
      
      {todaysCheckIn && (
        <div className="mb-4 rounded-md bg-green-50 p-3 text-sm text-green-800">
          ✓ You've already checked in today. You can update it below.
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="content" className="block text-sm font-medium text-gray-700">
            What did you do today? *
          </label>
          <textarea
            id="content"
            required
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={4}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
            placeholder="Share what you worked on, what you learned, or what you built..."
          />
        </div>

        <div>
          <label htmlFor="proofUrl" className="block text-sm font-medium text-gray-700">
            Proof (optional): Link or screenshot URL
          </label>
          <input
            id="proofUrl"
            type="url"
            value={proofUrl}
            onChange={(e) => setProofUrl(e.target.value)}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
            placeholder="https://example.com/project or image URL"
          />
          <p className="mt-1 text-xs text-gray-500">
            Share a link to your work, a screenshot, or any proof of your progress
          </p>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-md bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
        >
          {loading ? 'Submitting...' : todaysCheckIn ? 'Update Check-in' : 'Submit Check-in'}
        </button>
      </form>
    </div>
  )
}
