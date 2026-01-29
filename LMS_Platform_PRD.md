# LMS Platform - Product Requirements & Architecture Document

**Version:** 1.0  
**Date:** November 2024  
**Status:** Draft for Development

---

## Executive Summary

This document outlines the architecture and requirements for a multi-tenant Learning Management System (LMS) supporting instructor-created courses with flexible monetisation, comprehensive content types, and integrated assessment tools.

### Key Characteristics
- **Scale:** 100 users at launch → 500 users within 2 years
- **Content:** 5 courses at launch → 50 courses over time
- **Monetisation:** Flexible revenue sharing with multiple payment gateways
- **Content Types:** Video, text, PDFs, quizzes, assignments, H5P activities, custom AI-powered tools
- **Architecture:** Node.js/Express application with React frontend

---

## User Roles & Permissions

### 1. Students
- Enrol in courses (free or paid)
- Access course content based on prerequisites
- Complete lessons, quizzes, and assignments
- Track their own progress
- Download certificates upon completion
- Use embedded AI tools within lessons

### 2. Instructors
- Create and manage courses
- Structure courses into sections/modules/lessons
- Upload/embed content (video, PDFs, etc.)
- Create quizzes with automatic grading
- Create assignments requiring manual review
- Grade assignments and provide feedback
- Set prerequisites between lessons
- Configure course pricing
- View course analytics and student progress
- Access earnings dashboard
- Request payouts

### 3. Administrators
- Full platform access
- Manage users (students, instructors)
- Configure instructor revenue share percentages
- Approve/reject payout requests
- View platform-wide analytics
- Manage payment gateway settings
- Moderate content if needed

---

## Core Features by Module

### Module 1: Authentication & User Management

**Features:**
- Email/password registration and login
- Password reset via email
- User profiles (editable by owner)
- Role-based access control (Student, Instructor, Admin)
- Email verification on signup

**Technical Notes:**
- **Technical Notes:**
- Custom JWT authentication middleware
- Passport.js can extend for social auth later if needed
- Store user timezone preference for deadline handling

### Module 2: Course Management

**Features:**
- Course CRUD (Create, Read, Update, Delete)
- Course metadata: title, description, thumbnail, category, difficulty level
- Course pricing configuration (free, one-time payment, included in subscription)
- Course publishing workflow (draft → published)
- Course archiving (not deleted, just hidden)

**Hierarchy:**
```
Course
  └── Section/Module
        └── Lesson/Unit
              └── Content Blocks (video, text, quiz, etc.)
```

**Technical Notes:**
- Use recursive CTEs or closure table for hierarchical structure if needed (Prisma supports self-relations)
- Versioning not required for MVP but schema should allow it later
- Course duplication feature for instructors creating similar courses

### Module 3: Content Delivery

**Content Block Types:**

1. **Video**
   - Embedded (YouTube, Vimeo) - straightforward iframe
   - Self-hosted - see "Open Decisions" section
   - Playback tracking for progress (video completion %)

2. **Text/Articles**
   - Rich text editor (CKEditor or TinyMCE)
   - Support for images, formatting, code blocks
   - Markdown alternative for instructor preference

3. **PDF/Downloadable Resources**
   - File upload with storage (S3/DO Spaces/similar)
   - In-browser preview when possible
   - Download tracking (optional analytics)

4. **Quizzes**
   - Multiple choice questions
   - Auto-grading on submission
   - Immediate feedback or delayed (instructor choice)
   - Question randomisation optional
   - Time limits optional
   - Multiple attempts configuration
   - Passing score threshold

5. **Assignments**
   - Text instructions for assignment
   - File upload from students (multiple files supported)
   - Instructor grading interface with rubric support
   - Feedback/comments from instructor
   - Resubmission if needed

6. **H5P Interactive Content**
   - See "Open Decisions" for integration approach
   - Support common H5P types: presentations, interactive videos, flashcards

7. **AI-Powered Tools/Games**
   - Custom React apps embedded within lessons
   - Communication with LMS backend for progress/completion
   - SSO passthrough so students don't re-authenticate
   - See "Open Decisions" for implementation approach

**Prerequisites System:**
- Lessons can require completion of previous lesson(s)
- Enforced at navigation level (locked until prerequisite met)
- Progress calculation respects prerequisite chains

### Module 4: Assessment & Progress Tracking

**Progress Tracking:**
- Per-lesson completion status (complete/incomplete)
- Per-course overall progress (% complete)
- Time spent per lesson (optional analytics)
- Last accessed date/time

**Grading:**
- Quizzes: automatic scoring stored
- Assignments: instructor manual grading
- No weighted gradebook for MVP (just completion + individual scores)
- Instructors see list of submissions requiring grading

**Certificates:**
- Auto-generated on course completion
- PDF generation with course name, student name, completion date
- Customisable template per course (logo, signature, styling)
- Unique verification code embedded
- Public verification lookup page (enter code → validate certificate)

### Module 5: Commerce & Payments

**Payment Gateways:**
- PayStack (primary for South African market)
- PayFast (secondary option)
- Abstracted payment interface for adding more gateways later

**Pricing Models:**
- Free courses
- One-time purchase per course
- Subscription access (monthly/annual) - access to all or bundled courses
- Courses can be marked as "included in subscription" or separate purchase

**Revenue Sharing:**
- Configurable split percentage (flexible: per instructor, per course, or both)
- Platform tracks gross revenue, instructor share, platform share
- Currency: South African Rands (ZAR)
- VAT handling built-in (South African VAT rules)

**Instructor Payouts:**
- Instructors see earnings dashboard (pending, available, paid out)
- Request payout when balance reaches threshold (configurable)
- Admin approves payout requests
- Record of all transactions and payouts
- Payout methods: bank transfer details stored securely

### Module 6: Admin Panel

**Admin Panel Strategy:**
- Since we are using Node.js, we do not have the built-in Django Admin.
- **Recommendation:** Build a custom Admin Dashboard using React + Tailwind.
- **Alternative:** Use a headless CMS or admin tool like AdminJS or Retool.
- **MVP Features:**
  - User management (view, edit, deactivate)
  - Course moderation
  - Financial overview
  - Platform settings

**Analytics Dashboard:**
- Total users, courses, revenue
- Growth trends over time
- Most popular courses
- Instructor performance overview

---

## Database Schema Overview

### Core Tables

**Users** (extends Django's User model)
```
- id
- email (unique)
- first_name, last_name
- role (student/instructor/admin)
- profile_image
- bio
- timezone
- created_at, updated_at
```

**Courses**
```
- id
- title
- slug (unique URL-friendly)
- description (rich text)
- thumbnail_url
- instructor_id (FK to Users)
- category
- difficulty_level
- pricing_type (free/paid/subscription)
- price (if paid)
- is_published
- created_at, updated_at
```

**Sections**
```
- id
- course_id (FK to Courses)
- title
- order (for sequencing)
- created_at, updated_at
```

**Lessons**
```
- id
- section_id (FK to Sections)
- title
- order (within section)
- lesson_type (video/text/quiz/assignment/h5p/ai_tool)
- content (JSON field for flexible content storage)
- prerequisite_lesson_ids (array or M2M relationship)
- created_at, updated_at
```

**Enrollments**
```
- id
- student_id (FK to Users)
- course_id (FK to Courses)
- enrolled_at
- completed_at (nullable)
- payment_id (nullable, FK to Payments)
```

**LessonProgress**
```
- id
- enrollment_id (FK to Enrollments)
- lesson_id (FK to Lessons)
- status (not_started/in_progress/completed)
- time_spent (seconds)
- last_accessed_at
- completed_at (nullable)
```

**Quizzes**
```
- id
- lesson_id (FK to Lessons)
- passing_score
- max_attempts
- time_limit (minutes, nullable)
```

**Questions**
```
- id
- quiz_id (FK to Quizzes)
- question_text
- question_type (multiple_choice)
- options (JSON array)
- correct_answer
- points
- order
```

**QuizAttempts**
```
- id
- quiz_id (FK to Quizzes)
- student_id (FK to Users)
- answers (JSON)
- score
- passed (boolean)
- started_at
- submitted_at
```

**Assignments**
```
- id
- lesson_id (FK to Lessons)
- instructions (rich text)
- max_score
- allow_resubmission
```

**AssignmentSubmissions**
```
- id
- assignment_id (FK to Assignments)
- student_id (FK to Users)
- file_urls (array)
- submission_text (optional)
- submitted_at
- graded_at (nullable)
- score (nullable)
- feedback (nullable)
```

**Payments**
```
- id
- user_id (FK to Users)
- course_id (FK to Courses, nullable for subscriptions)
- amount
- currency (ZAR)
- payment_gateway (paystack/payfast)
- gateway_transaction_id
- status (pending/completed/failed/refunded)
- created_at
```

**InstructorEarnings**
```
- id
- instructor_id (FK to Users)
- payment_id (FK to Payments)
- gross_amount
- revenue_share_percentage
- instructor_amount
- platform_amount
- created_at
```

**Payouts**
```
- id
- instructor_id (FK to Users)
- amount
- status (requested/approved/paid/rejected)
- requested_at
- processed_at (nullable)
- payment_method_details (JSON - bank info)
- admin_notes
```

**Certificates**
```
- id
- enrollment_id (FK to Enrollments)
- verification_code (unique)
- issued_at
- pdf_url
```

---

## Technology Stack Recommendation

### Backend: **Node.js + Express + Prisma**

**Rationale:**
1.  **JavaScript Everywhere** - Unified language for frontend and backend, simplifying development and context switching.
2.  **Performance** - Non-blocking I/O is excellent for handling many concurrent connections (e.g., real-time progress updates).
3.  **Prisma ORM** - Type-safe database access with excellent developer experience and migration tools.
4.  **Ecosystem** - Massive package ecosystem (npm) for every possible integration.
5.  **Flexibility** - unopinionated framework allows for custom architecture tailored to specific needs.

**Key Packages:**
- `express` - Web server framework
- `prisma` - ORM and database management
- `jsonwebtoken` & `bcrypt` - Authentication
- `multer` - File upload handling
- `cors` - Cross-origin resource sharing
- `swagger-jsdoc` - API documentation
- `pdfkit` - PDF certificate generation

### Frontend: **React + Vite (or Next.js)**

**Options:**

**Option A: React SPA (Vite)**
- Pure client-side React application
- Communicates with Django REST API
- Deployed separately (Vercel, Netlify, or same server)
- Good for: Clear separation, easier to reason about for AI agents
- Deployment complexity: Moderate (two deployments)

**Option B: Next.js**
- Server-side rendering capabilities
- API routes available (though using Django's API primarily)
- Better SEO out of the box
- Good for: Modern developer experience, easier deployment
- Can still consume Django REST API
- Deployment complexity: Moderate (two systems but Next.js handles more)

**Recommendation: Start with React SPA (Option A)**
- Clearer boundaries for AI agents to work with
- Custom admin dashboard will be built as part of the React app (or separate route)
- Student/Instructor dashboards as React apps
- Can migrate to Next.js later if SEO becomes critical

**Key Libraries:**
- `react-router-dom` - Client-side routing
- `tanstack-query` (React Query) - Data fetching and caching
- `axios` - HTTP client
- `react-hook-form` - Form handling
- `tailwindcss` - Styling (or your preference)
- `recharts` or `chart.js` - Analytics visualisation
- Video player: `react-player` (supports YouTube, Vimeo, custom sources)

### Database: **PostgreSQL**

**Rationale:**
- JSON field support (useful for flexible lesson content storage)
- Array fields (for prerequisite lists)
- Full-text search capabilities
- Rock-solid reliability
- JSON field support (useful for flexible lesson content storage)
- Array fields (for prerequisite lists)
- Full-text search capabilities
- Rock-solid reliability
- Excellent Prisma support

### File Storage: **S3-Compatible (DigitalOcean Spaces, AWS S3, or Backblaze B2)**

**Rationale:**
- Don't store files on application server
- CDN capabilities for global content delivery
- AWS SDK or Multer-S3 makes this easy to set up
- Cost-effective at your scale

### Background Tasks: **BullMQ + Redis**

**Use Cases:**
- Sending enrolment confirmation emails
- Generating certificates on course completion
- Processing uploaded video files (if self-hosting)
- Generating analytics reports
- Payout processing notifications

### Caching: **Redis**

**Use Cases:**
- Session storage
- API response caching
- BullMQ task queue (doubles as task broker)

### Payment Gateways: **PayStack & PayFast**

**Integration:**
- Both have Node.js SDKs or REST APIs
- Webhook handlers in Express for payment confirmations
- Abstract payment interface for adding more gateways later

---

## API Structure

### RESTful Endpoints

**Authentication:**
```
POST /api/auth/register/
POST /api/auth/login/
POST /api/auth/logout/
POST /api/auth/password-reset/
POST /api/auth/password-reset-confirm/
```

**Courses:**
```
GET    /api/courses/                    # List published courses
GET    /api/courses/{id}/                # Course detail
POST   /api/courses/                     # Create (instructor only)
PUT    /api/courses/{id}/                # Update (instructor only)
DELETE /api/courses/{id}/                # Delete (instructor only)
GET    /api/courses/{id}/sections/       # Course structure
POST   /api/courses/{id}/enroll/         # Enroll student
```

**Lessons:**
```
GET    /api/lessons/{id}/                # Lesson detail (checks prerequisites)
PUT    /api/lessons/{id}/progress/       # Update progress
POST   /api/lessons/{id}/complete/       # Mark complete
```

**Quizzes:**
```
GET    /api/quizzes/{id}/                # Quiz questions (if enrolled)
POST   /api/quizzes/{id}/submit/         # Submit answers
GET    /api/quizzes/{id}/attempts/       # Student's attempt history
```

**Assignments:**
```
GET    /api/assignments/{id}/             # Assignment details
POST   /api/assignments/{id}/submit/      # Submit assignment
GET    /api/assignments/{id}/submissions/ # Instructor views submissions
PUT    /api/submissions/{id}/grade/       # Instructor grades submission
```

**Payments:**
```
POST   /api/payments/initiate/           # Start payment flow
POST   /api/payments/webhook/paystack/   # PayStack webhook
POST   /api/payments/webhook/payfast/    # PayFast webhook
GET    /api/payments/history/            # User payment history
```

**Instructor:**
```
GET    /api/instructor/courses/          # Instructor's courses
GET    /api/instructor/earnings/         # Earnings dashboard
POST   /api/instructor/payouts/request/  # Request payout
GET    /api/instructor/students/         # Students in instructor's courses
GET    /api/instructor/analytics/        # Course analytics
```

**Admin:**
```
GET    /api/admin/users/                 # User management (admin panel better for this)
GET    /api/admin/payouts/pending/       # Pending payout requests
PUT    /api/admin/payouts/{id}/approve/  # Approve payout
GET    /api/admin/analytics/             # Platform analytics
```

**Certificates:**
```
GET    /api/certificates/{enrollment_id}/generate/ # Generate certificate
GET    /api/certificates/verify/{code}/            # Verify certificate
```

---

## Third-Party Integrations

### 1. Payment Gateways

**PayStack**
- SDK: `paystackapi` (Python)
- Webhook endpoint for payment confirmations
- Test mode for development
- Documentation: https://paystack.com/docs/

**PayFast**
- SDK: `payfast` (Python) or custom implementation
- Similar webhook approach
- Documentation: https://developers.payfast.co.za/

### 2. Email Service

**Recommendation: SendGrid or Mailgun**
- Transactional emails (registration, password reset, payment confirmations)
- Nodemailer integration
- Track open rates and deliverability

### 3. File Storage

**DigitalOcean Spaces** (S3-compatible)
- Cost-effective for South African deployment
- CDN included
- Simple setup with AWS SDK

**Alternative: AWS S3 + CloudFront**
- More expensive but more robust
- Global presence

### 4. Video Hosting (Self-Hosted Option)

**See "Open Decisions" section below**

### 5. H5P Integration

**See "Open Decisions" section below**

---

## Open Architectural Decisions

These decisions can be deferred but architecture is designed to accommodate options:

### 1. Instructor Revenue Share Configuration

**Options:**

**A. Global Per-Instructor Setting**
- Admin sets revenue share % for each instructor in their profile
- Simple to implement: one field on User model
- All courses by that instructor use same percentage

**B. Per-Course Setting**
- Each course has revenue_share_percentage field
- More flexible but more complex to configure
- Allows experimenting with different models

**C. Hybrid Approach (Recommended)**
- Instructor has default revenue_share_percentage
- Individual courses can override this default
- Database: `Course.revenue_share_override` (nullable decimal field)
- Logic: `course.revenue_share_override or course.instructor.default_revenue_share`

**Implementation Recommendation:**
Start with **Option A** for MVP, refactor to **Option C** when needed (minimal schema change).

---

### 2. Video Self-Hosting Solution

**Context:** You want self-hosted video with "a solid framework that isn't custom."

**Options:**

**A. Cloudflare Stream (Recommended)**
- **Pros:** Turnkey solution, excellent streaming performance, built-in adaptive bitrate, very developer-friendly API
- **Cons:** US$1 per 1,000 minutes stored + US$1 per 1,000 minutes delivered (cost scales with usage)
- **Integration:** Upload to Cloudflare, they handle encoding/delivery, you get video ID to embed
- **Fits Your Needs:** Not custom, solid framework, handles all the hard parts

**B. Mux**
- **Pros:** Similar to Cloudflare, excellent API, built for developers
- **Cons:** Slightly more expensive, more features than you need
- **Integration:** Similar to Cloudflare

**C. AWS MediaConvert + S3 + CloudFront**
- **Pros:** Full control, potentially cheaper at high scale
- **Cons:** Complex setup, need to manage encoding pipeline yourself
- **Not Recommended:** Too much custom work

**D. Video.js + Self-Encoded Files**
- **Pros:** Cheapest option, full control
- **Cons:** You handle all encoding (FFmpeg), storage, CDN configuration
- **Not Recommended:** This is the "custom" solution you wanted to avoid

**E. Bunny.net Stream**
- **Pros:** Cheaper than Cloudflare/Mux (£5/1TB storage, £5/1TB delivery), good performance
- **Cons:** Less polished developer experience, smaller company
- **Worth Considering:** Excellent middle ground

**Recommendation for Your Scale:**
- **MVP:** Start with embedded YouTube/Vimeo only (zero cost, zero infrastructure)
- **When Self-Hosting Needed:** Use **Cloudflare Stream** (best balance of cost/features/simplicity for <500 users)
- **Alternative:** **Bunny.net** if budget is very tight

**Architecture Impact:**
- `Lesson.content` JSON field includes:
  ```json
  {
    "video_type": "cloudflare|youtube|vimeo",
    "video_id": "...",
    "video_url": "..."
  }
  ```
- Player component in React handles different sources
- Progress tracking via player events (same regardless of source)

---

### 3. H5P Integration Approach

**Context:** You want H5P interactive content but unsure of integration method.

**Options:**

**A. H5P.com Hosted (Recommended for MVP)**
- **Pros:** Zero setup, just embed iframes, H5P handles all updates/maintenance
- **Cons:** Monthly cost (starts free, ~US$50/mo for your scale), less customisation
- **Integration:** Instructors create on H5P.com, paste embed code into lesson
- **Simplest Approach:** Perfect for getting started

**B. Self-Hosted H5P (Requires PHP)**
- **Pros:** No recurring cost after setup, full control
- **Cons:** H5P core is PHP-based - doesn't fit Node.js stack cleanly
- **Options:**
  - Run separate PHP app alongside Node.js (added complexity)
  - Use H5P's standalone mode (community-maintained, less support)
- **Not Recommended:** Breaks your stack simplicity

**C. H5P Standalone (h5p-standalone)**
- **Pros:** JavaScript-only implementation, can self-host
- **Cons:** Less mature, fewer content types supported
- **Uncertain Long-Term Viability**

**D. Hybrid: LTI Integration**
- **Pros:** Standards-based, works with many tools
- **Cons:** Overkill for your use case

**Recommendation:**
- **MVP:** Use **H5P.com hosted** with iframe embeds (Option A)
- **Future:** If cost becomes issue at scale, evaluate self-hosting then
- Budget ~£40/month in year 2 if heavily using H5P

**Architecture Impact:**
- `Lesson.content` for H5P type includes:
  ```json
  {
    "h5p_embed_url": "https://h5p.com/h5p/embed/...",
    "h5p_content_id": "..."
  }
  ```
- Completion tracking via H5P's xAPI statements (they support this)

---

### 4. AI-Powered Tools Embedding

**Context:** Custom React apps that access LLMs via API, integrated within lessons.

**Options:**

**A. Simple Iframe Approach**
- **Pros:** Easiest to implement, clear separation of concerns, deploy AI tools independently
- **Cons:** Styling/UX discontinuity, need postMessage for completion tracking
- **Implementation:**
  - AI tool deployed separately (Vercel, Netlify)
  - LMS embeds via iframe
  - postMessage API for completion signals
  - JWT token passed via URL param for auth

**B. Micro-Frontend (Module Federation)**
- **Pros:** Seamless UX, shared styling, truly integrated feel
- **Cons:** Complex build process, webpack configuration hell, difficult for AI agents to maintain
- **Not Recommended:** Overkill for your scale

**C. Monorepo with Shared Components**
- **Pros:** Code reuse, unified build
- **Cons:** AI tools deployed with main app (slower deployment for independent updates)
- **Middle Ground:** Could work but complicates things

**D. Backend-Rendered Component Approach**
- **Pros:** No iframe, SSR possibilities
- **Cons:** Requires Next.js or similar, mixing rendering strategies gets messy

**Recommendation:**
Start with **Option A (Iframe)** because:
1. Clear boundaries make it easier for AI agents to build tools independently
2. Can iterate on AI tools without touching LMS core
3. Can upgrade to better integration later without breaking anything
4. Simple completion tracking via postMessage

**Implementation Details:**

**AI Tool Side:**
```javascript
// In your AI tool React app
window.parent.postMessage({
  type: 'AI_TOOL_COMPLETE',
  lessonId: params.lessonId,
  userId: params.userId,
  data: { score: 95, time_spent: 300 }
}, '*'); // In production, specify exact origin
```

**LMS Side (React):**
```javascript
// In lesson viewer component
useEffect(() => {
  const handleMessage = (event) => {
    if (event.data.type === 'AI_TOOL_COMPLETE') {
      // Call API to mark lesson progress
      updateLessonProgress(event.data);
    }
  };
  window.addEventListener('message', handleMessage);
  return () => window.removeEventListener('message', handleMessage);
}, []);
```

**Lesson Content Structure:**
```json
{
  "type": "ai_tool",
  "tool_url": "https://ai-math-tutor.yoursite.com",
  "tool_params": {
    "difficulty": "intermediate",
    "topic": "algebra"
  }
}
```

**Authentication Flow:**
1. LMS generates short-lived JWT token for student
2. Token includes: user_id, lesson_id, tool_permissions
3. Appended to iframe URL: `{tool_url}?token={jwt}`
4. AI tool validates token with LMS backend
5. AI tool allows interaction
6. On completion, posts message back to parent

**Architecture Impact:**
- Add `AIToolSession` model to track interactions
- Endpoint: `POST /api/ai-tools/validate-token/`
- Endpoint: `POST /api/ai-tools/complete/`

---

### 5. Gradebook vs Simple Completion (Decision Point 4.5)

**Context:** You're unsure if instructors need full gradebook or just completion data.

**Current Scope:** Not for academic transcripts, so completion likely sufficient.

**Recommendation:**
- **MVP:** Track completion + individual quiz scores + assignment grades
- **Display:** Show student their scores per assessment, overall course progress %
- **Instructor View:** List of students with completion %, individual assessment scores
- **Defer:** Full weighted gradebook with grade calculations, GPA equivalents, etc.

**Architecture Impact:**
- Current schema supports this without changes
- If gradebook needed later:
  - Add `GradeWeight` model (quiz: 40%, assignment: 60%, etc.)
  - Add `OverallGrade` calculation method
  - Update instructor dashboard
- Easy to add without refactoring

---

## Phased Implementation Roadmap

### Phase 1: MVP (Core LMS Functionality)
**Goal:** Functional LMS with courses, enrolment, content delivery, basic payments

**Modules:**
1. **Authentication & User Management**
   - User registration, login, password reset
   - Basic profiles
   - Role assignment

2. **Course Structure**
   - Course creation (instructors)
   - Section/lesson hierarchy
   - Simple text and embedded video lessons only
   - Course publishing

3. **Enrolment & Access**
   - Free course enrolment
   - Basic prerequisite checking
   - Lesson navigation

4. **Progress Tracking**
   - Mark lessons complete
   - Course progress percentage
   - Simple student dashboard

5. **Admin Panel**
   - Django admin customisation
   - User management
   - Course oversight

**Estimated Timeline:** 4-6 weeks with AI agent assistance

---

### Phase 2: Assessment & Certification
**Goal:** Add quizzes, assignments, and completion certificates

**Modules:**
1. **Quizzes**
   - Multiple choice questions
   - Auto-grading
   - Attempt tracking
   - Instructor quiz creation interface

2. **Assignments**
   - File upload submissions
   - Instructor grading interface
   - Feedback system

3. **Certificates**
   - Auto-generation on course completion
   - PDF with verification code
   - Public verification page

**Estimated Timeline:** 3-4 weeks

---

### Phase 3: Payments & Revenue
**Goal:** Monetise courses and handle instructor payouts

**Modules:**
1. **Payment Integration**
   - PayStack integration
   - PayFast integration
   - Webhook handlers
   - Payment history

2. **Course Pricing**
   - Set course prices
   - Free vs paid courses
   - Subscription model setup

3. **Revenue Sharing**
   - Configure instructor percentages
   - Track earnings
   - Instructor earnings dashboard

4. **Payout System**
   - Payout request workflow
   - Admin approval interface
   - Payout history

**Estimated Timeline:** 3-4 weeks

---

### Phase 4: Advanced Content Types
**Goal:** Add H5P, AI tools, self-hosted video, PDFs

**Modules:**
1. **File Management**
   - PDF uploads with storage
   - Downloadable resources
   - File access control

2. **H5P Integration**
   - Embed H5P.com content
   - Completion tracking via xAPI

3. **AI Tool Embedding**
   - Iframe integration
   - postMessage completion tracking
   - JWT auth for tools

4. **Self-Hosted Video** (Optional)
   - Cloudflare Stream integration
   - Video upload workflow
   - Adaptive streaming player

**Estimated Timeline:** 3-4 weeks

---

### Phase 5: Polish & Analytics
**Goal:** Improve UX, add analytics, optimise performance

**Modules:**
1. **Instructor Analytics**
   - Course performance metrics
   - Student progress overview
   - Revenue analytics

2. **Student Experience**
   - Course search and filtering
   - Course recommendations
   - Improved lesson navigation

3. **Performance**
   - API response caching
   - Database query optimisation
   - Image/video CDN setup

4. **Notifications**
   - Email notifications (enrolment, completion, grades)
   - In-app notifications

**Estimated Timeline:** 2-3 weeks

---

### Total Estimated Timeline: 15-21 weeks (4-5 months)

**Notes:**
- Timeline assumes part-time development with AI agent assistance
- Each phase should be fully tested before moving to next
- Can deploy to staging after Phase 1 for early feedback
- Phases 2-5 can be reordered based on priority

---

## Working with AI Agents: Best Practices

### 1. Start with Database Models
- Have agent generate Django models first
- Review and validate schema before any views/logic
- Models are the foundation - get them right early

### 2. Work Module by Module
- Complete one module fully before starting next
- Don't let agent jump between unrelated features
- Example: Finish all quiz functionality before touching assignments

### 3. Maintain Context Documents
As you build, keep these files updated:
- `API_ENDPOINTS.md` - List all endpoints with request/response examples
- `DATABASE_SCHEMA.md` - Current state of models
- `COMPLETED_FEATURES.md` - What's done, what's in progress

Reference these in prompts: "Following the API structure in API_ENDPOINTS.md, now add..."

### 4. Test Incrementally
- After each feature, test it manually
- Don't accumulate untested code
- Catch hallucinations early before they cascade

### 5. Use Django Admin as Safety Net
- Configure admin for every model
- Provides backup interface if frontend breaks
- Easier to verify backend logic works correctly

### 6. Session Boundaries
- Complete a logical feature in one session
- Start new chat when switching modules
- Prevents context window pollution

### 7. Code Review Checklist for AI Output
- Does it follow Django conventions?
- Are there security issues (SQL injection, XSS)?
- Is error handling present?
- Are edge cases considered?
- Is it testable?

---

## Security Considerations

### 1. Authentication & Authorization
- Use Django's built-in authentication (don't roll your own)
- JWT tokens for API authentication (djangorestframework-simplejwt)
- Token refresh mechanism
- Permission classes on every API endpoint
- Row-level permissions (students can only access their own data)

### 2. Payment Security
- Never store credit card details (PCI compliance nightmare)
- Use payment gateway hosted checkout when possible
- Verify webhook signatures
- Idempotency for payment processing (handle duplicate webhooks)

### 3. File Upload Security
- Validate file types and sizes
- Scan uploads for malware (ClamAV integration)
- Use signed URLs for private file access (S3 presigned URLs)
- Never serve user uploads from same domain as application

### 4. API Rate Limiting
- Implement rate limiting (django-ratelimit)
- Prevent brute force attacks on login
- Limit file upload frequency

### 5. Data Privacy
- GDPR/POPIA compliance for South African users
- Allow users to export their data
- Allow users to delete their accounts
- Clear privacy policy

### 6. Content Security
- Sanitise rich text input (prevent XSS)
- Use Django's template escaping
- Content Security Policy headers
- HTTPS everywhere (use Let's Encrypt)

---

## Deployment Architecture

### Recommended Setup

**Application Server:**
- DigitalOcean App Platform or Heroku (easy Django deployment)
- Alternative: VPS with Docker (more control, more complexity)

**Database:**
- Managed PostgreSQL (DigitalOcean, AWS RDS, or similar)
- Automated backups
- Connection pooling (PgBouncer)

**File Storage:**
- DigitalOcean Spaces or AWS S3
- CDN for asset delivery

**Background Tasks:**
- Redis instance (DigitalOcean Managed Redis or similar)
- Celery workers (separate process from web server)

**Email:**
- SendGrid or Mailgun

**Monitoring:**
- Sentry for error tracking
- Application performance monitoring (optional)

**Domains & SSL:**
- Custom domain
- Let's Encrypt SSL (automatic renewal)

**Estimated Monthly Cost (MVP):**
- App Server: $15-25
- Database: $15-25
- Redis: $10-15
- Storage: $5-10
- Email: $0-15 (depends on volume)
- **Total: ~$60-90/month**

**Scaling to 500 Users:**
- Likely same infrastructure with slightly larger tiers
- **Estimated: $120-150/month**

---

## Success Metrics

### Technical Metrics
- Page load time < 2 seconds
- API response time < 200ms (p95)
- Uptime > 99.5%
- Zero payment processing errors

### Business Metrics
- Course completion rate > 60%
- Instructor satisfaction with tools
- Student satisfaction scores
- Revenue growth trajectory
- Instructor payout processing time < 7 days

---

## Risks & Mitigations

### Risk 1: AI Agent Hallucinations
**Mitigation:** Incremental testing, code review, maintain context docs, work in small chunks

### Risk 2: Payment Gateway Issues
**Mitigation:** Extensive testing in sandbox mode, webhook retry logic, manual admin override capabilities

### Risk 3: Video Storage Costs
**Mitigation:** Start with embedded videos, add self-hosting only when needed, set file size limits

### Risk 4: Instructor Revenue Disputes
**Mitigation:** Clear terms of service, transparent earnings dashboard, detailed transaction logs

### Risk 5: Scope Creep
**Mitigation:** Strict phased approach, resist adding features mid-phase, maintain priority list

---

## Next Steps

1. **Review & Approve PRD**
   - Validate assumptions
   - Finalise open decisions
   - Set priorities

2. **Set Up Development Environment**
   - Install Django, PostgreSQL, Redis
   - Configure git repository
   - Set up linting/formatting standards

3. **Generate Django Models**
   - Start with Phase 1 models
   - Create migrations
   - Configure admin

4. **Build API Foundation**
   - Authentication endpoints
   - Basic CRUD for courses
   - Test with Postman/curl

5. **Create React Shell**
   - Routing structure
   - Authentication flow
   - Basic layout components

6. **Iterate Module by Module**
   - Follow phased roadmap
   - Test continuously
   - Document as you go

---

## Appendix A: Useful Django Packages

- `django-environ` - Environment variable management
- `django-extensions` - Useful management commands
- `django-debug-toolbar` - Development debugging
- `django-silk` - API profiling
- `factory_boy` - Test data generation
- `pytest-django` - Better testing framework
- `django-mptt` - Hierarchical data (course structure)
- `django-crispy-forms` - Better form rendering
- `django-import-export` - Data import/export in admin

---

## Appendix B: Frontend Component Structure

```
src/
├── components/
│   ├── auth/
│   │   ├── LoginForm.jsx
│   │   ├── RegisterForm.jsx
│   │   └── PasswordReset.jsx
│   ├── courses/
│   │   ├── CourseCard.jsx
│   │   ├── CourseList.jsx
│   │   ├── CourseDetail.jsx
│   │   └── CoursePlayer.jsx
│   ├── lessons/
│   │   ├── LessonViewer.jsx
│   │   ├── VideoLesson.jsx
│   │   ├── TextLesson.jsx
│   │   ├── QuizLesson.jsx
│   │   └── AssignmentLesson.jsx
│   ├── instructor/
│   │   ├── CourseBuilder.jsx
│   │   ├── LessonEditor.jsx
│   │   ├── StudentList.jsx
│   │   └── EarningsDashboard.jsx
│   └── shared/
│       ├── Header.jsx
│       ├── Footer.jsx
│       ├── Sidebar.jsx
│       └── ProgressBar.jsx
├── pages/
│   ├── HomePage.jsx
│   ├── CourseCatalog.jsx
│   ├── CourseDetailPage.jsx
│   ├── StudentDashboard.jsx
│   ├── InstructorDashboard.jsx
│   └── AdminDashboard.jsx
├── hooks/
│   ├── useAuth.js
│   ├── useCourse.js
│   └── useProgress.js
├── services/
│   ├── api.js
│   ├── auth.js
│   └── payment.js
└── utils/
    ├── constants.js
    └── helpers.js
```

---

## Appendix C: Example API Response Formats

**Course List:**
```json
{
  "count": 5,
  "next": null,
  "previous": null,
  "results": [
    {
      "id": 1,
      "title": "Introduction to Python",
      "slug": "intro-to-python",
      "description": "Learn Python from scratch",
      "thumbnail_url": "https://...",
      "instructor": {
        "id": 42,
        "name": "Jane Smith"
      },
      "price": 499.00,
      "currency": "ZAR",
      "is_enrolled": false,
      "student_count": 127,
      "rating": 4.8
    }
  ]
}
```

**Lesson Detail:**
```json
{
  "id": 15,
  "title": "Variables and Data Types",
  "section": {
    "id": 3,
    "title": "Python Basics"
  },
  "order": 2,
  "lesson_type": "video",
  "content": {
    "video_type": "youtube",
    "video_id": "dQw4w9WgXcQ",
    "duration": 720
  },
  "is_completed": false,
  "is_locked": false,
  "next_lesson_id": 16,
  "previous_lesson_id": 14
}
```

---

**Document Version:** 1.0  
**Last Updated:** November 2024  
**Status:** Ready for Implementation
