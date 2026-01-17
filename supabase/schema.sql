-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Sprints table: 30-day challenges
CREATE TABLE IF NOT EXISTS sprints (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  skill TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  is_active BOOLEAN DEFAULT true
);

-- Check-ins table: daily submissions
CREATE TABLE IF NOT EXISTS check_ins (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  sprint_id UUID NOT NULL REFERENCES sprints(id) ON DELETE CASCADE,
  day_number INTEGER NOT NULL, -- Day 1-30
  content TEXT NOT NULL,
  proof_url TEXT, -- Link or screenshot URL
  check_in_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, sprint_id, check_in_date)
);

-- Sprint participants: track who joined which sprint
CREATE TABLE IF NOT EXISTS sprint_participants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  sprint_id UUID NOT NULL REFERENCES sprints(id) ON DELETE CASCADE,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  current_streak INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  total_check_ins INTEGER DEFAULT 0,
  UNIQUE(user_id, sprint_id)
);

-- User profiles (extends auth.users)
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (id)
);

-- Enable Row Level Security
ALTER TABLE sprints ENABLE ROW LEVEL SECURITY;
ALTER TABLE check_ins ENABLE ROW LEVEL SECURITY;
ALTER TABLE sprint_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- RLS Policies for sprints (public read, authenticated write)
CREATE POLICY "Sprints are viewable by everyone" ON sprints FOR SELECT USING (true);
CREATE POLICY "Sprints can be created by authenticated users" ON sprints FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- RLS Policies for check_ins
CREATE POLICY "Check-ins are viewable by everyone" ON check_ins FOR SELECT USING (true);
CREATE POLICY "Users can insert their own check-ins" ON check_ins FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own check-ins" ON check_ins FOR UPDATE USING (auth.uid() = user_id);

-- RLS Policies for sprint_participants
CREATE POLICY "Sprint participants are viewable by everyone" ON sprint_participants FOR SELECT USING (true);
CREATE POLICY "Users can join sprints" ON sprint_participants FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own participation" ON sprint_participants FOR UPDATE USING (auth.uid() = user_id);

-- RLS Policies for user_profiles
CREATE POLICY "Profiles are viewable by everyone" ON user_profiles FOR SELECT USING (true);
CREATE POLICY "Users can insert their own profile" ON user_profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update their own profile" ON user_profiles FOR UPDATE USING (auth.uid() = id);

-- Function to automatically create user profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (id, username, full_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', 'user_' || substr(NEW.id::text, 1, 8)),
    COALESCE(NEW.raw_user_meta_data->>'full_name', '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to call the function when a new user signs up
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update streak when check-in is created
CREATE OR REPLACE FUNCTION update_streak_on_checkin()
RETURNS TRIGGER AS $$
DECLARE
  prev_checkin_date DATE;
  current_streak INTEGER;
BEGIN
  -- Get the most recent check-in date for this user and sprint
  SELECT MAX(check_in_date) INTO prev_checkin_date
  FROM check_ins
  WHERE user_id = NEW.user_id AND sprint_id = NEW.sprint_id AND id != NEW.id;

  -- Get current streak
  SELECT sp.current_streak INTO current_streak
  FROM sprint_participants sp
  WHERE sp.user_id = NEW.user_id AND sp.sprint_id = NEW.sprint_id;

  -- If no previous check-in or previous check-in was yesterday, increment streak
  IF prev_checkin_date IS NULL THEN
    current_streak := 1;
  ELSIF prev_checkin_date = NEW.check_in_date - INTERVAL '1 day' THEN
    current_streak := COALESCE(current_streak, 0) + 1;
  ELSIF prev_checkin_date < NEW.check_in_date - INTERVAL '1 day' THEN
    -- Streak broken, reset to 1
    current_streak := 1;
  ELSE
    -- Same day or future, don't change streak
    current_streak := COALESCE(current_streak, 1);
  END IF;

  -- Update or insert sprint_participants
  INSERT INTO sprint_participants (user_id, sprint_id, current_streak, longest_streak, total_check_ins)
  VALUES (NEW.user_id, NEW.sprint_id, current_streak, current_streak, 1)
  ON CONFLICT (user_id, sprint_id)
  DO UPDATE SET
    current_streak = EXCLUDED.current_streak,
    longest_streak = GREATEST(sprint_participants.longest_streak, EXCLUDED.current_streak),
    total_check_ins = sprint_participants.total_check_ins + 1;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update streak on check-in
CREATE TRIGGER on_checkin_created
  AFTER INSERT ON check_ins
  FOR EACH ROW EXECUTE FUNCTION update_streak_on_checkin();

-- Insert a default active sprint (you can modify this)
INSERT INTO sprints (title, description, skill, start_date, end_date, is_active)
VALUES (
  '30-Day Coding Challenge',
  'Build something every day for 30 days. Share your progress and stay accountable!',
  'Programming',
  CURRENT_DATE,
  CURRENT_DATE + INTERVAL '29 days',
  true
)
ON CONFLICT DO NOTHING;
