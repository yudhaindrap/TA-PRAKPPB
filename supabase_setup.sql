-- SQL Script untuk Setup Profile Edit Feature di Supabase
-- Jalankan script ini di Supabase SQL Editor

-- 1. Buat tabel user_profiles untuk menyimpan data profil tambahan
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  bio TEXT,
  profile_photo_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- 2. Buat index untuk performa query
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON user_profiles(user_id);

-- 3. Enable Row Level Security (RLS)
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- 4. Policy: User hanya bisa membaca profil sendiri
CREATE POLICY "Users can read own profile" ON user_profiles
  FOR SELECT
  USING (auth.uid() = user_id);

-- 5. Policy: User hanya bisa insert profil sendiri
CREATE POLICY "Users can insert own profile" ON user_profiles
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- 6. Policy: User hanya bisa update profil sendiri
CREATE POLICY "Users can update own profile" ON user_profiles
  FOR UPDATE
  USING (auth.uid() = user_id);

-- 7. Policy: User hanya bisa delete profil sendiri
CREATE POLICY "Users can delete own profile" ON user_profiles
  FOR DELETE
  USING (auth.uid() = user_id);

-- 8. Buat fungsi untuk auto-update timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 9. Buat trigger untuk auto-update timestamp
CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 10. Buat fungsi untuk auto-create profil saat user baru register
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (user_id, display_name)
  VALUES (
    NEW.id,
    COALESCE(
      NEW.raw_user_meta_data->>'display_name',
      CASE 
        WHEN NEW.email IS NOT NULL AND NEW.email != '' THEN split_part(NEW.email, '@', 1)
        ELSE 'User'
      END
    )
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 11. Buat trigger untuk auto-create profil
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- NOTES:
-- Setelah menjalankan SQL di atas, lakukan setup Storage Bucket:
-- 1. Buka Storage di Supabase Dashboard
-- 2. Buat bucket baru dengan nama "profile-photos"
-- 3. Set bucket menjadi PUBLIC (atau buat policy untuk authenticated users)
-- 4. Policy untuk bucket:
--    - SELECT: authenticated users dapat membaca
--    - INSERT: authenticated users dapat upload (dengan validasi user_id di path)
--    - UPDATE: owner file dapat update
--    - DELETE: owner file dapat delete
