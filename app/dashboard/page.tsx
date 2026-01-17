import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Navbar from '@/components/Navbar'
import SprintCard from '@/components/SprintCard'
import CheckInForm from '@/components/CheckInForm'

export default async function DashboardPage() {
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

  // Get user's participation in this sprint
  let participation = null
  if (sprint) {
    const { data } = await supabase
      .from('sprint_participants')
      .select('*')
      .eq('user_id', user.id)
      .eq('sprint_id', sprint.id)
      .single()
    
    participation = data
  }

  // Get user's profile
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  // Get today's check-in if exists
  let todaysCheckIn = null
  if (sprint) {
    const { data } = await supabase
      .from('check_ins')
      .select('*')
      .eq('user_id', user.id)
      .eq('sprint_id', sprint.id)
      .eq('check_in_date', new Date().toISOString().split('T')[0])
      .single()
    
    todaysCheckIn = data
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Welcome{profile?.full_name ? `, ${profile.full_name}` : ''}!
          </h1>
          <p className="mt-2 text-gray-600">Track your daily progress and stay accountable</p>
        </div>

        {sprint && (
          <>
            <SprintCard sprint={sprint} participation={participation} user={user} />
            {participation && (
              <div className="mt-8">
                <CheckInForm sprint={sprint} user={user} todaysCheckIn={todaysCheckIn} />
              </div>
            )}
          </>
        )}

        {!sprint && (
          <div className="rounded-lg bg-white p-8 text-center shadow">
            <p className="text-gray-600">No active sprint available at the moment.</p>
          </div>
        )}
      </div>
    </div>
  )
}
