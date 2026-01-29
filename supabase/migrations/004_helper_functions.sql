-- Helper function to increment course student count
CREATE OR REPLACE FUNCTION increment_course_students(course_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE courses
  SET total_students = total_students + 1
  WHERE id = course_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
