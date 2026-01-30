# LMS Platform - Developer Context

## Overview

The LMS is a modern, serverless learning management system built on **React + Vite + TypeScript + Supabase + Vercel**. No traditional backend needed—all logic runs on the frontend with Supabase handling authentication, database, and real-time features.

**Key Points:**
- Frontend-only application (deployed on Vercel)
- PostgreSQL database via Supabase
- Email/password authentication via Supabase Auth
- AI-powered content generation via Google Gemini API
- Role-based access control (STUDENT, INSTRUCTOR, ADMIN)
- Real-time capable (Supabase subscriptions)

---

## Architecture

### Tech Stack

| Layer | Technology | Version | Purpose |
|-------|-----------|---------|---------|
| **Framework** | React | 19.2.0 | UI framework |
| **Build** | Vite | 6.2.0 | Fast bundler, dev server |
| **Language** | TypeScript | 5.8.2 | Type safety |
| **Routing** | React Router | 7.9.6 | Client-side routing (HashRouter) |
| **Database** | Supabase (PostgreSQL) | - | Auth + Database |
| **State** | React Context | - | Global state (Auth, Courses) |
| **Styling** | Tailwind CSS | - | Utility-first CSS (CDN in index.html) |
| **Icons** | Lucide React | 0.554.0 | Icon library |
| **Drag & Drop** | @dnd-kit | 6.1.0 | Accessible drag-and-drop |
| **Rich Text** | Tiptap | 2.1.0 | WYSIWYG editor for text blocks |
| **AI** | Google Generative AI | 1.30.0 | Gemini API for content generation |
| **Deployment** | Vercel | - | Production hosting |

### Project Structure

```
LMS/
├── src/
│   ├── components/          # React UI components
│   │   ├── Layout.tsx       # Navigation header with auth menu
│   │   ├── ProtectedRoute.tsx # Role-based route guard
│   │   ├── CourseCard.tsx   # Course preview card
│   │   ├── QuizViewer.tsx   # Quiz interface
│   │   ├── GeminiTutor.tsx  # AI tutor chat
│   │   ├── course-builder/  # Slide-based course editor
│   │   │   ├── CourseBuilder.tsx    # Main editor container
│   │   │   ├── CurriculumPanel.tsx  # Section/lesson sidebar
│   │   │   ├── slides/              # Slide-based lesson editor (v2)
│   │   │   │   ├── SlideEditor.tsx  # Main slide editor
│   │   │   │   ├── SlideCanvas.tsx  # Renders slide templates
│   │   │   │   ├── SlideThumbnails.tsx # Slide sidebar with drag-drop
│   │   │   │   ├── TemplatePicker.tsx # Template & theme selection
│   │   │   │   └── slideTypes.ts    # Types, themes, templates
│   │   │   ├── blocks/              # Legacy block components
│   │   │   └── hooks/useCurriculum.ts # State + autosave
│   │   └── [other components]
│   ├── context/
│   │   ├── AuthContext.tsx  # User auth state + methods
│   │   └── CourseContext.tsx # Course/enrollment state
│   ├── pages/               # Page components (routes)
│   │   ├── Home.tsx         # Course listing
│   │   ├── Login.tsx        # Auth page
│   │   ├── Dashboard.tsx    # Student progress view
│   │   ├── CourseDetail.tsx # Course info + enrollment
│   │   ├── LessonViewer.tsx # Full-screen lesson
│   │   ├── InstructorDashboard.tsx # Instructor view
│   │   ├── CourseEditor.tsx # Create/edit courses
│   │   └── Certificate.tsx  # Completion certificate
│   ├── services/
│   │   ├── authService.ts   # Supabase auth methods
│   │   ├── courseService.ts # Course CRUD + enrollment logic
│   │   └── geminiService.ts # AI content generation
│   ├── lib/
│   │   ├── supabaseClient.ts # Supabase JS client
│   │   └── utils.ts         # Helper functions
│   ├── types.ts             # TypeScript interfaces
│   ├── constants.ts         # Mock data + enums
│   ├── App.tsx              # Route setup
│   └── index.tsx            # React mount point
├── supabase/
│   ├── config.toml          # Local Supabase config
│   └── migrations/
│       ├── 001_schema.sql   # Tables, enums, indexes
│       ├── 002_rls_policies.sql # Row-level security
│       ├── 003_auth_trigger.sql # Auto-create user profile
│       ├── 004_helper_functions.sql # DB utility functions
│       └── 005_fix_auth_trigger.sql # Auth fixes
├── index.html               # HTML template (Tailwind CDN)
├── vite.config.ts           # Vite configuration
├── tsconfig.json            # TypeScript config
├── package.json             # Dependencies
├── .env.local               # Local Supabase keys (GITIGNORED)
└── CLAUDE.md                # This file
```

---

## Database Schema

### Core Tables

**`users` (extends Supabase auth.users)**
```sql
- id (UUID, FK→auth.users)
- email
- name
- role (ENUM: STUDENT, INSTRUCTOR, ADMIN)
- avatar_url
- created_at, updated_at
```

**`courses`**
```sql
- id (UUID)
- instructor_id (FK→users)
- title, description
- thumbnail_url, price
- category, level
- published (boolean)
- total_students, rating
- created_at, updated_at
```

**`sections`**
```sql
- id (UUID)
- course_id (FK→courses)
- title, order
```

**`lessons`**
```sql
- id (UUID)
- section_id (FK→sections)
- title, duration
- type (ENUM: VIDEO, TEXT, QUIZ, ASSIGNMENT)
- content (JSONB - flexible lesson data)
- is_locked, order
- created_at, updated_at
```

**`enrollments`**
```sql
- id (UUID)
- user_id (FK→users)
- course_id (FK→courses)
- progress (0-100, calculated from completed lessons)
- completed_lesson_ids (TEXT array)
- last_accessed_lesson_id (UUID)
- enrolled_at, last_accessed_at
- UNIQUE(user_id, course_id)
```

**`quizzes`, `questions`, `quiz_attempts`** (for structured assessment)

### Key Features

- **Row-Level Security (RLS):** Each user can only access their own data
- **Cascading Deletes:** Deleting a course deletes sections, lessons, enrollments
- **Auto-Profile Creation:** Trigger automatically creates user profile when auth user signs up
- **Progress Calculation:** Progress % = (completed_lesson_ids.length / total_lessons) * 100

---

## Authentication Flow

### User Registration
1. User enters email, password, name, role in Login page
2. `authService.register()` calls `supabase.auth.signUp()`
3. Supabase auth trigger creates user profile in `users` table
4. User context auto-loads profile on auth state change

### User Login
1. User enters email + password
2. `authService.login()` calls `supabase.auth.signInWithPassword()`
3. JWT token stored in localStorage (managed by Supabase client)
4. User context loads profile, `isAuthenticated` → true

### Session Persistence
- Supabase automatically restores session from localStorage on app start
- `AuthContext.useEffect` runs `onAuthStateChange()` to load current user
- Routes check `isAuthenticated` to redirect to login if needed

### Protected Routes
- `<ProtectedRoute>` component wraps role-sensitive pages
- Checks `user?.role` against allowed roles
- Renders 403 error or redirects if unauthorized

---

## State Management

### AuthContext
```typescript
interface AuthContextType {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  login(email: string, password: string): Promise<void>
  register(name: string, email: string, role: UserRole, password: string): Promise<void>
  logout(): Promise<void>
}
```

Usage:
```typescript
const { user, login, logout, isAuthenticated } = useContext(AuthContext)
```

### CourseContext
```typescript
interface CourseContextType {
  courses: Course[]
  enrollments: Enrollment[]
  searchQuery: string
  selectedCategory: string
  enrollInCourse(courseId: string): Promise<void>
  completeLesson(courseId: string, lessonId: string): Promise<void>
  getEnrollment(courseId: string): Enrollment | undefined
  isLessonCompleted(courseId: string, lessonId: string): boolean
  addCourse(course: Omit<Course, 'id'>): Promise<void>
  updateCourse(id: string, updates: Partial<Course>): Promise<void>
  deleteCourse(id: string): Promise<void>
  refreshData(): Promise<void>
}
```

Usage:
```typescript
const { courses, enrollments, completeLesson } = useContext(CourseContext)
```

---

## API Integration (Service Layer)

### `authService.ts`
```typescript
login(email: string, password: string)
register(name: string, email: string, role: UserRole, password: string)
logout(): Promise<void>
refreshCurrentUser(): Promise<User>
```

### `courseService.ts`
```typescript
// Course operations
getAllCourses(): Promise<Course[]>
getCourseById(id: string): Promise<Course>
createCourse(course: Omit<Course, 'id'>): Promise<Course>
updateCourse(id: string, updates: Partial<Course>): Promise<void>
deleteCourse(id: string): Promise<void>
publishCourse(courseId: string, published: boolean): Promise<void>
getInstructorCourses(): Promise<Course[]>

// Section CRUD
createSection(courseId: string, title: string): Promise<Section>
updateSection(sectionId: string, updates: Partial<Section>): Promise<Section>
deleteSection(sectionId: string): Promise<void>
reorderSections(courseId: string, sectionIds: string[]): Promise<void>

// Lesson CRUD
createLesson(sectionId: string, title: string, type?: LessonType): Promise<Lesson>
updateLesson(lessonId: string, updates: Partial<Lesson>): Promise<Lesson>
deleteLesson(lessonId: string): Promise<void>
reorderLessons(sectionId: string, lessonIds: string[]): Promise<void>
saveLessonContent(lessonId: string, content: LessonContent): Promise<void>

// Enrollment
enrollInCourse(courseId: string): Promise<void>
completeLesson(courseId: string, lessonId: string): Promise<void>
getMyEnrollments(): Promise<Enrollment[]>
```

### `geminiService.ts`
```typescript
createTutorChat(context: LessonContext): Promise<string>
generateCourseCurriculum(topic: string, level: string): Promise<CourseStructure>
generateLessonContent(title: string, courseName: string): Promise<string>
generateQuizQuestions(topic: string, difficulty: string): Promise<Question[]>
generateCourseImage(prompt: string): Promise<string>
```

---

## Routing

The app uses **React Router with HashRouter** (URLs have `/#/`).

```
/                      → Home (course listing)
/login                 → Login/Register page
/course/:id            → Course detail + enroll button
/dashboard             → Student's enrolled courses
/learn/:courseId/lesson/:lessonId → Full-screen lesson viewer
/certificate/:courseId → Completion certificate
/instructor            → Instructor dashboard (role-protected)
/instructor/edit/:courseId → Course Builder (role-protected)
```

**Protected Routes:**
- `/dashboard` - STUDENT only
- `/instructor/*` - INSTRUCTOR only
- Unauthenticated users redirected to `/login`

---

## Common Development Tasks

### Adding a New Page
1. Create component in `src/pages/YourPage.tsx`
2. Add route to `App.tsx`:
   ```typescript
   <Route path="/your-path" element={<YourPage />} />
   ```
3. If role-protected:
   ```typescript
   <Route path="/admin" element={<ProtectedRoute roles={['ADMIN']} element={<AdminPage />} />} />
   ```

### Adding a New Course Feature
1. Create service method in `courseService.ts`
2. Add action to `CourseContext` if it affects global state
3. Use `useContext(CourseContext)` in component to call method
4. Handle loading/error states

### Working with Supabase Data
1. Always use the Supabase client from `lib/supabaseClient.ts`
2. Use type-safe queries:
   ```typescript
   const { data, error } = await supabase
     .from('courses')
     .select('*')
     .eq('instructor_id', user.id)
   ```
3. RLS policies automatically filter data to current user
4. Watch for `error?.message` - Supabase returns helpful errors

### AI Content Generation
1. Import `geminiService`
2. Call appropriate method:
   ```typescript
   const curriculum = await generateCourseCurriculum('Web Dev', 'Beginner')
   ```
3. Handle rate limiting (Gemini API may throttle)
4. User sees loading spinner during generation

### Testing Locally
1. **Start Supabase:** `supabase start` (if using local Supabase)
2. **Start dev server:** `npm run dev`
3. **Access app:** `http://localhost:3000` (or Vite's assigned port)
4. **Use Supabase Studio:** `npx supabase studio` to inspect database

---

## Environment Configuration

### Development (`.env.local`)
```
VITE_SUPABASE_URL=https://[project-id].supabase.co
VITE_SUPABASE_ANON_KEY=[your-anon-key]
GEMINI_API_KEY=[optional, for AI features]
```

### Production (Vercel)
Set the same environment variables in Vercel project settings.

**Note:** The anon key is safe to expose (it's the public JWT key). RLS policies secure the database.

---

## Key Architectural Patterns

### 1. **Service Layer Pattern**
- All Supabase queries isolated in `services/`
- Components call services, not Supabase directly
- Easy to mock for testing, update logic in one place

### 2. **Context for Global State**
- `AuthContext` - User identity and auth methods
- `CourseContext` - Course data and enrollment state
- Prevents prop drilling, allows any component to access state

### 3. **Role-Based Access Control (RBAC)**
- User role stored in database
- `<ProtectedRoute>` enforces permissions
- RLS policies prevent unauthorized database access
- Frontend checks happen before showing UI (UX), backend RLS prevents data leaks (security)

### 4. **JSONB for Flexible Lesson Content**
- Lesson `content` field is JSONB, not normalized tables
- **Slide-based format (v2):** `{ version: 2, theme: ThemeId, slides: Slide[] }`
  - 8 slide templates: `title`, `content`, `media`, `split`, `quiz`, `webapp`, `code`, `bullets`
  - 4 themes: `modern-light`, `modern-dark`, `warm`, `ocean`
  - Webapp template embeds external URLs seamlessly (for custom interactive apps)
- Legacy page-based format (v1): `{ pages: Page[] }` still supported
- Type guards: `isSlideBasedContent()`, `isPageBasedContent()` for backward compatibility

### 5. **Real-time Ready**
- Supabase subscriptions not yet fully used, but infrastructure is there
- Can add real-time updates for live collab if needed
- Example: `supabase.on('postgres_changes', ...).subscribe()`

---

## Performance & Optimization

### Current Optimizations
- **Code Splitting:** Vite automatically chunks routes
- **Lazy Loading:** React Router supports route-based code splitting
- **Image Optimization:** Thumbnails hosted via Supabase Storage
- **Database Indexing:** Indexes on foreign keys and common queries
- **RLS Filtering:** Database filters at query time, not in app

### Future Optimization Ideas
- Implement virtual scrolling for long course lists
- Add service worker for offline lesson viewing
- Cache lesson content locally
- Implement debouncing for search/filters

---

## Deployment

### Vercel
1. Push code to GitHub
2. Import project in Vercel dashboard
3. Set environment variables (Supabase URL/key, Gemini API key)
4. Deploy on push to main

### Build & Preview Locally
```bash
npm run build    # Create dist/
npm run preview  # Preview production build locally
```

---

## Troubleshooting

### CORS Issues
- **Symptom:** Supabase requests fail with CORS error
- **Solution:** Ensure VITE_SUPABASE_URL uses correct domain. Supabase CORS is usually auto-configured.

### 401 Unauthorized
- **Symptom:** API calls return 401 after login
- **Solution:** Check RLS policies. Verify anon key has appropriate permissions.

### Token Not Persisting
- **Symptom:** Logged out on page refresh
- **Solution:** Supabase should auto-restore from localStorage. Check browser storage is not blocked.

### Gemini API Errors
- **Symptom:** AI features fail
- **Solution:** Verify GEMINI_API_KEY is set. Check rate limits (Gemini may throttle).

### Database Connection Issues
- **Solution:** Verify VITE_SUPABASE_URL is correct. Check Supabase project is active.

---

## Common Patterns & Tips

### Accessing Authenticated User
```typescript
const { user } = useContext(AuthContext)
if (!user) return <Navigate to="/login" />
```

### Fetching Data with Loading State
```typescript
const [loading, setLoading] = useState(false)
useEffect(() => {
  setLoading(true)
  courseService.getAllCourses().then(setCourses).finally(() => setLoading(false))
}, [])
```

### Error Handling
```typescript
try {
  await courseService.enrollInCourse(courseId)
} catch (error: any) {
  console.error('Enrollment failed:', error.message)
  setErrorMessage(error.message)
}
```

### Role Checks
```typescript
const isInstructor = user?.role === 'INSTRUCTOR'
const isAdmin = user?.role === 'ADMIN'
```

---

## Learning & Memory Management

### When Starting Work
1. Search this file for relevant patterns
2. Check `src/services/` to understand existing Supabase queries
3. Look at similar components for implementation examples
4. Review `src/types.ts` for data structures

### Documenting Decisions
- Add notes to this file when adding major features
- Update database schema section if adding tables
- Document new service methods with JSDoc comments

### Known Limitations & TODOs
- [ ] Real-time subscriptions not yet implemented
- [ ] Offline support needs service worker
- [ ] Admin dashboard is minimal
- [ ] Payment integration not included
- [ ] Video hosting via external provider (not Supabase Storage)
- [ ] AI content generation deferred for Course Builder (existing in legacy editor)

---

## Resources

- **Supabase Docs:** https://supabase.com/docs
- **React Router Docs:** https://reactrouter.com/
- **Vite Docs:** https://vitejs.dev/
- **Tailwind CSS:** https://tailwindcss.com/
- **Google Generative AI:** https://ai.google.dev/
- **Vercel Deployment:** https://vercel.com/docs

---

**Last Updated:** January 2026
**Architecture:** React + Vite + TypeScript + Supabase + Vercel (serverless)
**Deployment:** Vercel (frontend), Supabase (database + auth)
