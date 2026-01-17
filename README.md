# Uply - 30-Day Skill Sprints

A web app where people commit to 30-day challenges to build/learn specific skills.

## Features

- ✅ User signup/login with Supabase auth
- ✅ Users can join 30-day "sprints" (cohort-based challenges)
- ✅ Daily check-in system where users post what they did + proof (text, link, or screenshot)
- ✅ Public feed showing everyone's daily check-ins
- ✅ Streak tracking (how many days in a row they checked in)
- ✅ Simple leaderboard showing who's most consistent
- ✅ Clean, modern UI with Tailwind CSS

## Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set up Supabase:**
   - Create a new project at [supabase.com](https://supabase.com)
   - Go to SQL Editor and run the SQL from `supabase/schema.sql`
   - Copy your project URL and anon key

3. **Configure environment variables:**
   Create a `.env.local` file in the root directory:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. **Run the development server:**
   ```bash
   npm run dev
   ```

5. **Open [http://localhost:3000](http://localhost:3000) in your browser**

## Database Schema

The app uses the following main tables:
- `sprints` - 30-day challenges
- `check_ins` - Daily submissions from users
- `sprint_participants` - Tracks who joined which sprint (includes streak data)
- `user_profiles` - User profile information

## Tech Stack

- **Next.js 16** - React framework
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **Supabase** - Authentication & Database
- **PostgreSQL** - Database (via Supabase)

## Project Structure

```
app/
  dashboard/     # Main dashboard with sprint and check-in
  feed/          # Public feed of all check-ins
  leaderboard/   # Leaderboard showing most consistent users
  login/         # Login page
  signup/        # Signup page
components/
  CheckInForm.tsx    # Form for daily check-ins
  Navbar.tsx         # Navigation bar
  SprintCard.tsx     # Sprint display card
lib/
  supabase/          # Supabase client utilities
supabase/
  schema.sql         # Database schema and setup
```

## MVP Status

✅ Core features are implemented and working:
- Authentication (signup/login)
- One active sprint support
- Daily check-ins with text and proof URLs
- Public feed
- Streak tracking (automatic via database triggers)
- Leaderboard
