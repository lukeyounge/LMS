-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_attempts ENABLE ROW LEVEL SECURITY;

-- Helper function to get user role
CREATE OR REPLACE FUNCTION get_user_role(user_id UUID)
RETURNS user_role AS $$
  SELECT role FROM users WHERE id = user_id;
$$ LANGUAGE sql SECURITY DEFINER;

-- USERS policies
CREATE POLICY "Users can view all profiles" ON users FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON users FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Allow trigger or self to create users" ON users
  FOR INSERT
  WITH CHECK (auth.uid() IS NULL OR auth.uid() = id);

-- COURSES policies
CREATE POLICY "Anyone can view published courses" ON courses
  FOR SELECT USING (published = true OR instructor_id = auth.uid() OR get_user_role(auth.uid()) = 'ADMIN');

CREATE POLICY "Instructors can create courses" ON courses
  FOR INSERT WITH CHECK (
    instructor_id = auth.uid() AND
    (get_user_role(auth.uid()) = 'INSTRUCTOR' OR get_user_role(auth.uid()) = 'ADMIN')
  );

CREATE POLICY "Instructors can update own courses" ON courses
  FOR UPDATE USING (instructor_id = auth.uid() OR get_user_role(auth.uid()) = 'ADMIN');

CREATE POLICY "Instructors can delete own courses" ON courses
  FOR DELETE USING (instructor_id = auth.uid() OR get_user_role(auth.uid()) = 'ADMIN');

-- SECTIONS policies
CREATE POLICY "Anyone can view sections of published courses" ON sections
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM courses
      WHERE courses.id = sections.course_id
      AND (courses.published = true OR courses.instructor_id = auth.uid())
    )
  );

CREATE POLICY "Instructors can manage own sections" ON sections
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM courses
      WHERE courses.id = sections.course_id
      AND courses.instructor_id = auth.uid()
    )
  );

-- LESSONS policies
CREATE POLICY "Anyone can view lessons of published courses" ON lessons
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM sections
      JOIN courses ON courses.id = sections.course_id
      WHERE sections.id = lessons.section_id
      AND (courses.published = true OR courses.instructor_id = auth.uid())
    )
  );

CREATE POLICY "Instructors can manage own lessons" ON lessons
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM sections
      JOIN courses ON courses.id = sections.course_id
      WHERE sections.id = lessons.section_id
      AND courses.instructor_id = auth.uid()
    )
  );

-- ENROLLMENTS policies
CREATE POLICY "Users can view own enrollments" ON enrollments
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Students can enroll" ON enrollments
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Students can update own enrollments" ON enrollments
  FOR UPDATE USING (user_id = auth.uid());

-- QUIZZES policies
CREATE POLICY "Enrolled students can view quizzes" ON quizzes
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM lessons
      JOIN sections ON sections.id = lessons.section_id
      JOIN enrollments ON enrollments.course_id = sections.course_id
      WHERE lessons.id = quizzes.lesson_id
      AND enrollments.user_id = auth.uid()
    )
  );

CREATE POLICY "Instructors can manage quizzes" ON quizzes
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM lessons
      JOIN sections ON sections.id = lessons.section_id
      JOIN courses ON courses.id = sections.course_id
      WHERE lessons.id = quizzes.lesson_id
      AND courses.instructor_id = auth.uid()
    )
  );

-- QUESTIONS policies
CREATE POLICY "Anyone can view questions" ON questions FOR SELECT USING (true);

CREATE POLICY "Instructors can manage questions" ON questions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM quizzes
      JOIN lessons ON lessons.id = quizzes.lesson_id
      JOIN sections ON sections.id = lessons.section_id
      JOIN courses ON courses.id = sections.course_id
      WHERE quizzes.id = questions.quiz_id
      AND courses.instructor_id = auth.uid()
    )
  );

-- QUIZ_ATTEMPTS policies
CREATE POLICY "Students can view own attempts" ON quiz_attempts
  FOR SELECT USING (student_id = auth.uid());

CREATE POLICY "Students can submit attempts" ON quiz_attempts
  FOR INSERT WITH CHECK (student_id = auth.uid());
