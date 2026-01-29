-- Fix auth trigger RLS issue
-- Drop the old restrictive policy and create a more permissive one for the trigger

DROP POLICY IF EXISTS "Users can insert own profile" ON users;

CREATE POLICY "Allow trigger or self to create users" ON users
  FOR INSERT
  WITH CHECK (auth.uid() IS NULL OR auth.uid() = id);

-- Update the trigger function with proper error handling
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, name, role, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'STUDENT'::user_role),
    COALESCE(
      NEW.raw_user_meta_data->>'avatar_url',
      'https://api.dicebear.com/7.x/avataaars/svg?seed=' || NEW.email
    )
  );
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'Error creating user profile during signup: % %', SQLSTATE, SQLERRM;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
