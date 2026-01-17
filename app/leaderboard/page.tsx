import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Navbar from '@/components/Navbar'

export default async function LeaderboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Get active sprint
  const { data: sprint } = await supabase
    .from('sprints')
    .select('*')
    .eq('is_active', true)
    .single()

  if (!sprint) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
          <p className="text-gray-600">No active sprint available.</p>
        </div>
      </div>
    )
  }

  // Get all participants for the active sprint, ordered by consistency (streak, then total check-ins)
  const { data: participants } = await supabase
    .from('sprint_participants')
    .select(`
      *,
      user_profiles (
        id,
        full_name,
        username
      )
    `)
    .eq('sprint_id', sprint.id)
    .order('current_streak', { ascending: false })
    .order('total_check_ins', { ascending: false })

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Leaderboard</h1>
          <p className="mt-2 text-gray-600">Most consistent participants in {sprint.title}</p>
        </div>

        <div className="rounded-lg bg-white shadow">
          <div className="divide-y divide-gray-200">
            {participants && participants.length > 0 ? (
              participants.map((participant: any, index: number) => (
                <div
                  key={participant.id}
                  className="flex items-center justify-between p-6 hover:bg-gray-50"
                >
                  <div className="flex items-center space-x-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100">
                      <span className="text-lg font-bold text-blue-600">
                        {index + 1}
                      </span>
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">
                        {participant.user_profiles?.full_name || 
                         participant.user_profiles?.username || 
                         'Anonymous'}
                      </p>
                      <p className="text-sm text-gray-500">
                        {participant.total_check_ins} check-ins total
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="rounded-md bg-green-100 px-3 py-1">
                      <span className="text-lg font-bold text-green-800">
                        🔥 {participant.current_streak}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-gray-500">
                      {participant.longest_streak} day best
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-8 text-center text-gray-600">
                No participants yet.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
