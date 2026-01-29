# LMS Platform - Testing Guide

Test all LMS features with this step-by-step guide. Everything connects to Supabase—no backend server needed.

## Setup

Before testing, ensure:
1. Dev server running: `npm run dev`
2. Environment variables set (`.env.local`)
3. Supabase project active
4. Test credentials seeded:
   - Email: `student@example.com` / Password: `password123`
   - Email: `instructor@example.com` / Password: `password123`

---

## Test 1: Login & Authentication

### Student Login

1. Go to http://localhost:3000
2. Click "Login"
3. Enter credentials:
   - Email: `student@example.com`
   - Password: `password123`
4. Click "Sign In"

**What to check:**
- ✅ Login succeeds (no error toast)
- ✅ Redirected to home page
- ✅ User name appears in header
- ✅ No console errors (F12)

**Network tab verification:**
- Should see Supabase auth request with JWT token
- Token stored in localStorage (check: `localStorage.getItem('sb-[project-id]-auth-token')`)

---

### Logout

1. Click user menu in top-right
2. Click "Logout"

**What to check:**
- ✅ Logged out successfully
- ✅ Redirected to login page
- ✅ localStorage token cleared

---

## Test 2: Course Discovery

### Browse Courses

1. Login as student
2. You're on home page showing all published courses
3. Scroll to see course cards

**What to check:**
- ✅ Courses load from Supabase
- ✅ Each card shows: title, instructor, level, rating
- ✅ Search bar works (type to filter courses)
- ✅ Category filters work

**Network tab verification:**
- Should see `GET` request to Supabase `courses` table
- Response contains course array with all fields

---

### Search Courses

1. Type in search box (e.g., "web")
2. Results filter in real-time

**What to check:**
- ✅ Search filters courses by title/description
- ✅ Results update instantly
- ✅ No errors

---

## Test 3: Course Details & Enrollment

### View Course Details

1. Click on any course card
2. See full course page

**What to check:**
- ✅ Course title, description, instructor name visible
- ✅ Sections and lessons displayed in tree structure
- ✅ "Enroll" button visible (if not enrolled)
- ✅ Lesson count and total duration shown

---

### Enroll in Course

1. On course detail page, click "Enroll" button
2. Confirm enrollment

**What to check:**
- ✅ Enrollment succeeds
- ✅ Button changes to "Continue Learning"
- ✅ No console errors
- ✅ Progress shows 0%

**Network tab verification:**
- POST request to Supabase `enrollments` table
- Enrollment record created with user_id, course_id, progress=0

---

## Test 4: Dashboard (My Courses)

### View Enrolled Courses

1. Click "Dashboard" in nav
2. See all courses you're enrolled in

**What to check:**
- ✅ Shows only your enrollments
- ✅ Each course card shows: title, progress %, instructor
- ✅ "Continue Learning" button available
- ✅ Progress calculates correctly

**Example:** If you completed 2 of 6 lessons, progress = 33%

---

### Check Progress Tracking

1. On dashboard, click "Continue Learning" on a course
2. Take a lesson (see Test 5)
3. Return to dashboard
4. Progress should update

**What to check:**
- ✅ Progress % increases as you complete lessons
- ✅ Correct calculation: (completed / total) * 100

---

## Test 5: Lesson Viewer

### View Lesson

1. From dashboard or course detail, click a lesson
2. Full-screen lesson viewer opens

**What to check:**
- ✅ Lesson content displays correctly
- ✅ Lesson type (video/text/quiz) renders properly
- ✅ Navigation: previous/next lesson buttons work
- ✅ Section title and lesson order visible

---

### Complete Lesson

1. At bottom of lesson, click "Mark as Complete"

**What to check:**
- ✅ Completion succeeds
- ✅ Button changes to "Completed ✓"
- ✅ No error message
- ✅ Progress on dashboard increases

**Network tab verification:**
- POST request to Supabase `enrollments` table
- `completed_lesson_ids` array includes this lesson
- `progress` % recalculated

---

### Lesson Navigation

1. Click "Next Lesson" button
2. Advances to next lesson in section
3. Click "Previous Lesson"
4. Goes back

**What to check:**
- ✅ Navigation works
- ✅ Correct lesson displays
- ✅ Lesson content loads

---

## Test 6: Quiz Taking

### Take a Quiz

1. Find a lesson with type = "QUIZ"
2. Click on it
3. Quiz viewer shows questions

**What to check:**
- ✅ All questions display
- ✅ Multiple choice options clickable
- ✅ Can select/deselect answers
- ✅ Submit button available

---

### Submit Quiz

1. Select answers for all questions
2. Click "Submit Quiz"

**What to check:**
- ✅ Submission succeeds
- ✅ Results show score
- ✅ Lesson marked as complete
- ✅ Can't retake (or shows retake option)

---

## Test 7: Instructor Features

### Login as Instructor

1. Logout (if logged in as student)
2. Login with instructor credentials:
   - Email: `instructor@example.com`
   - Password: `password123`

**What to check:**
- ✅ Login succeeds
- ✅ Redirected to instructor dashboard
- ✅ "Instructor" menu item visible in nav

---

### View Instructor Dashboard

1. Click "Instructor" in nav
2. See list of your courses

**What to check:**
- ✅ Shows only your courses (instructor_id = your_id)
- ✅ Each course shows: title, students enrolled, rating
- ✅ "Create Course" and "Edit" buttons available

---

### Create New Course

1. Click "Create Course" button
2. Fill in form:
   - Title: "Advanced React"
   - Description: "Learn React advanced patterns"
   - Level: "Intermediate"
   - Category: "Web Development"
3. Click "Create"

**What to check:**
- ✅ Course created successfully
- ✅ Redirected to course editor
- ✅ New course shows in instructor dashboard
- ✅ `instructor_id` set to your user ID

---

### Edit Course

1. Click "Edit" on a course
2. Modify fields (e.g., title)
3. Click "Save"

**What to check:**
- ✅ Changes saved to database
- ✅ Dashboard reflects updates
- ✅ No console errors

---

### Add Sections & Lessons

1. On course editor, click "Add Section"
2. Enter section title: "Basics"
3. Click "Add Lesson" under section
4. Fill in lesson details:
   - Title: "Getting Started"
   - Type: "VIDEO"
   - Duration: "10"
   - Content: "https://example.com/video.mp4"
5. Click "Save Lesson"

**What to check:**
- ✅ Section created in database
- ✅ Lesson added to section
- ✅ Lesson appears in course structure
- ✅ Order maintained

---

## Test 8: Data Integrity

### Student Can't See Other Students' Data

1. Enroll in course as student
2. Open DevTools → Application → localStorage
3. Copy your `sb-[project-id]-auth-token`
4. Logout
5. Login as different student
6. Try to access other student's enrollments via Supabase Studio

**What to check:**
- ✅ RLS policies prevent accessing other students' data
- ✅ Each user only sees their own enrollments
- ✅ No data leakage between users

---

### Instructor Can Only Edit Own Courses

1. Login as instructor
2. Try to edit course created by different instructor (via URL manipulation if needed)

**What to check:**
- ✅ RLS policy blocks edit attempt
- ✅ Error message: "Permission denied" or similar
- ✅ Course data not modified

---

## Test 9: Error Handling

### Login with Invalid Credentials

1. Go to login
2. Enter: Email: `fake@example.com`, Password: `wrongpassword`
3. Click "Sign In"

**What to check:**
- ✅ Error message displays
- ✅ Friendly message: "Invalid login credentials"
- ✅ Not logged in

---

### Enrollment Already Exists

1. Enroll in a course
2. Return to course detail
3. Try to enroll again (if button still shows)

**What to check:**
- ✅ Error handled gracefully
- ✅ UNIQUE constraint on (user_id, course_id) prevents duplicates
- ✅ User doesn't get double-charged (if paid)

---

### Missing Environment Variables

1. Remove `VITE_SUPABASE_URL` from `.env.local`
2. Restart dev server
3. Try to use app

**What to check:**
- ✅ Clear error message about missing config
- ✅ Not a cryptic "cannot read property" error

---

## Test 10: Performance & UI

### Page Load Times

1. Open Network tab in DevTools
2. Load home page
3. Check load time

**What to check:**
- ✅ Initial load < 3 seconds
- ✅ Images load without placeholder lag
- ✅ No 404 errors

---

### Responsive Design

1. Resize browser window (small/medium/large)
2. Or use DevTools device emulation (F12 → device toggle)
3. Test mobile (e.g., iPhone 12, 375px width)

**What to check:**
- ✅ Layout adapts to screen size
- ✅ Navigation menu works on mobile
- ✅ Course cards stack vertically on mobile
- ✅ Text readable without horizontal scroll

---

### Loading States

1. On course enrollment, click "Enroll"
2. Watch button during request

**What to check:**
- ✅ Button shows loading spinner
- ✅ User can't click multiple times
- ✅ Success/error message appears

---

## Test 11: Certificate (if implemented)

### Generate Certificate

1. Complete a course (all lessons marked complete)
2. Go to certificate page (e.g., `/certificate/[courseId]`)

**What to check:**
- ✅ Certificate displays with course name
- ✅ Your name appears
- ✅ Completion date shown
- ✅ Can print or download

---

## Test 12: AI Features (if enabled)

### AI Tutor Chat

1. Open lesson
2. Click "Ask Tutor" or similar
3. Type question about lesson

**What to check:**
- ✅ AI responds with relevant answer
- ✅ No direct quiz answers given
- ✅ Timeout handled gracefully if API slow

---

### Generate Course Curriculum (Instructor)

1. In course editor, click "Generate Curriculum with AI"
2. Enter topic: "Machine Learning Basics"
3. Wait for response

**What to check:**
- ✅ AI generates section/lesson structure
- ✅ Suggestions are relevant
- ✅ Can accept/reject suggestions
- ✅ Spinner shows during generation

---

## Verification Checklist

✅ **Authentication**
- [ ] Student login/logout works
- [ ] Instructor login/logout works
- [ ] Sessions persist on page refresh
- [ ] Invalid credentials show error

✅ **Course Management**
- [ ] Browse courses
- [ ] Search/filter works
- [ ] View course details
- [ ] Enroll in course

✅ **Learning Experience**
- [ ] View lessons
- [ ] Complete lessons
- [ ] Progress tracks correctly
- [ ] Quizzes work

✅ **Instructor Features**
- [ ] View instructor dashboard
- [ ] Create course
- [ ] Edit course
- [ ] Add sections/lessons

✅ **Data Security**
- [ ] RLS policies work
- [ ] Users can't see other data
- [ ] Instructors can't edit others' courses

✅ **Error Handling**
- [ ] Invalid login shows error
- [ ] Network errors handled
- [ ] Missing data shows graceful message

✅ **Performance**
- [ ] Page loads quickly
- [ ] Responsive on mobile
- [ ] Loading states work

---

## Debugging Tips

### Check Supabase Data
```bash
# View database GUI
npx supabase studio
```

### Check Browser Console
- Press `F12`
- Go to **Console** tab
- Look for errors/warnings

### Check Network Requests
- Press `F12`
- Go to **Network** tab
- Reload page
- Look for failed requests (red)

### Check RLS Policies
1. Go to Supabase dashboard
2. Click **Authentication → Policies**
3. Verify policies allow your operations

---

**All tests passed?** Your LMS is ready for production! 🚀
