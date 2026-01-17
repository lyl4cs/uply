import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Navbar from '@/components/Navbar'

export default async function FeedPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Get all check-ins with user profiles, ordered by newest first
  const { data: checkIns } = await supabase
    .from('check_ins')
    .select(`
      *,
      user_profiles (
        id,
        full_name,
        username
      ),
      sprints (
        title,
        skill
      )
    `)
    .order('created_at', { ascending: false })
    .limit(50)

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Public Feed</h1>
          <p className="mt-2 text-gray-600">See what everyone is building and learning</p>
        </div>

        <div className="space-y-4">
          {checkIns && checkIns.length > 0 ? (
            checkIns.map((checkIn: any) => (
              <div key={checkIn.id} className="rounded-lg bg-white p-6 shadow">
                <div className="mb-3 flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100">
                      <span className="text-sm font-semibold text-blue-600">
                        {checkIn.user_profiles?.full_name?.[0]?.toUpperCase() || 
                         checkIn.user_profiles?.username?.[0]?.toUpperCase() || 
                         'U'}
                      </span>
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">
                        {checkIn.user_profiles?.full_name || 
                         checkIn.user_profiles?.username || 
                         'Anonymous'}
                      </p>
                      <p className="text-sm text-gray-500">
                        Day {checkIn.day_number} • {checkIn.sprints?.title}
                      </p>
                    </div>
                  </div>
                  <span className="text-sm text-gray-500">
                    {new Date(checkIn.created_at).toLocaleDateString()}
                  </span>
                </div>

                <p className="mb-3 text-gray-700 whitespace-pre-wrap">{checkIn.content}</p>

                {checkIn.proof_url && (
                  <div className="mt-3">
                    <a
                      href={checkIn.proof_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                    >
                      View Proof →
                    </a>
                  </div>
                )}
              </div>
            ))
          ) : (
            <div className="rounded-lg bg-white p-8 text-center shadow">
              <p className="text-gray-600">No check-ins yet. Be the first to share your progress!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
