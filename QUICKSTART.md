# LMS Platform - Quick Start Guide

Get your LMS up and running in 5 minutes!

## Prerequisites

- Node.js 18+ installed
- npm or yarn
- Supabase account (free tier available at https://supabase.com)
- Gemini API key (optional, for AI features)

## Step 1: Clone and Install

```bash
# Install dependencies
npm install
```

## Step 2: Get Supabase Keys

1. Go to https://app.supabase.com
2. Create a new project or use existing one
3. Go to **Settings → API** and copy:
   - Project URL (VITE_SUPABASE_URL)
   - Anon Key (VITE_SUPABASE_ANON_KEY)

## Step 3: Setup Environment

Create `.env.local` in project root:

```bash
# Copy template
cp .env.example .env.local

# Edit with your keys:
VITE_SUPABASE_URL=https://[your-project-id].supabase.co
VITE_SUPABASE_ANON_KEY=[your-anon-key]
GEMINI_API_KEY=[optional, from ai.google.dev]
```

**Note:** The anon key is safe to expose—Supabase RLS policies secure the database.

## Step 4: Start Development Server

```bash
npm run dev
```

✅ App running at `http://localhost:3000` (or next available port)

## Step 5: Test Login

1. Open http://localhost:3000
2. Click "Login"
3. Use test credentials:
   - **Email:** `student@example.com`
   - **Password:** `password123`

**What to check:**
- ✅ Login succeeds
- ✅ See user name in header
- ✅ Can browse courses
- ✅ No console errors (F12)

## Test Accounts

Supabase seeding creates these accounts:

**Student Account:**
- Email: `student@example.com`
- Password: `password123`
- Can: browse courses, enroll, track progress

**Instructor Account:**
- Email: `instructor@example.com`
- Password: `password123`
- Can: create/edit courses, view student progress

## What You Get

✅ React frontend (React Router for navigation)
✅ Supabase PostgreSQL database
✅ Email/password authentication
✅ Row-level security (RLS) for data access
✅ Course management (CRUD)
✅ Student enrollment & progress tracking
✅ Quiz system
✅ Google Generative AI integration (for content generation)
✅ Tailwind CSS for styling

## Project Structure

```
LMS/
├── src/
│   ├── components/        # React components
│   ├── context/          # Auth and Course state
│   ├── pages/            # Page components
│   ├── services/         # Supabase queries
│   ├── lib/              # Utilities
│   ├── types.ts          # TypeScript types
│   └── App.tsx           # Main routing
├── supabase/
│   ├── config.toml       # Local Supabase config
│   └── migrations/       # SQL migrations
├── index.html            # HTML entry point
├── vite.config.ts        # Vite configuration
├── package.json          # Dependencies
└── CLAUDE.md             # Developer context
```

## Next Steps

### 1. Explore the App

- **Home** - Browse published courses
- **Dashboard** - See your enrollments (student only)
- **Instructor** - Create/manage courses (instructor only)
- **Login** - Switch roles to test different features

### 2. Test Core Features

- [ ] Login as student
- [ ] Browse courses
- [ ] Enroll in a course
- [ ] View lessons
- [ ] Complete a lesson
- [ ] Check progress on dashboard
- [ ] Logout and login as instructor
- [ ] Create a new course
- [ ] Add sections and lessons to course

### 3. Customize

- Update course data in Supabase
- Modify UI colors/layout (Tailwind CSS)
- Add new pages in `src/pages/`
- Add new components in `src/components/`
- Extend database schema with new tables

## Troubleshooting

### 🔴 Supabase Connection Error

**Symptom:** "Connection refused" or "Cannot reach database"

**Solution:**
```bash
# Verify environment variables
cat .env.local

# Check Supabase project is active
# Visit: https://app.supabase.com/projects
```

---

### 🔴 401 Unauthorized on API Calls

**Symptom:** All API calls return 401 after login

**Solution:**
1. Clear localStorage:
   ```javascript
   localStorage.clear();
   location.reload();
   ```
2. Login again
3. Check RLS policies in Supabase dashboard
   - Go to **Authentication → Policies**
   - Ensure policies allow your operations

---

### 🔴 "Cannot find module" Error

**Symptom:** TypeScript errors about missing modules

**Solution:**
```bash
# Reinstall dependencies
rm node_modules package-lock.json
npm install
```

---

### 🔴 Port Already in Use

**Symptom:** "Port 3000 is already in use"

**Solution:**
```bash
# Vite will automatically use next available port
# Or specify port manually:
PORT=3001 npm run dev
```

---

### 🔴 Gemini API Not Working

**Symptom:** AI features fail, "GEMINI_API_KEY not found"

**Solution:**
1. Get API key from https://ai.google.dev
2. Add to `.env.local`:
   ```
   GEMINI_API_KEY=[your-key]
   ```
3. Restart dev server: `npm run dev`

---

## Debugging

### Check Browser Console
- Open DevTools: `F12`
- Look for errors in **Console** tab
- Check **Network** tab to verify API calls succeed

### Check Supabase Studio
```bash
# View database GUI
npx supabase studio
```
- Inspect tables and data
- Check RLS policies
- View real-time activity

### Check Network Requests
1. Open DevTools: `F12`
2. Go to **Network** tab
3. Look for failed requests
4. Check response body for error message

## Production Deployment

### Deploy to Vercel

1. Push code to GitHub:
   ```bash
   git add .
   git commit -m "LMS deployment"
   git push origin main
   ```

2. Import in Vercel:
   - Go to https://vercel.com/new
   - Select your GitHub repo
   - Select project root

3. Add environment variables:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `GEMINI_API_KEY` (optional)

4. Deploy!

### Production Checklist
- [ ] Environment variables set in Vercel
- [ ] Custom domain configured (optional)
- [ ] CORS settings correct in Supabase
- [ ] Test login on production URL
- [ ] Test course enrollment
- [ ] Monitor Supabase for rate limits

## Resources

- **Developer Context:** [CLAUDE.md](./CLAUDE.md)
- **Testing Guide:** [TESTING_GUIDE.md](./TESTING_GUIDE.md)
- **Supabase Docs:** https://supabase.com/docs
- **React Docs:** https://react.dev
- **Vite Docs:** https://vitejs.dev
- **Vercel Docs:** https://vercel.com/docs

## Support

If stuck:
1. Check [TESTING_GUIDE.md](./TESTING_GUIDE.md) for feature-specific testing
2. Review [CLAUDE.md](./CLAUDE.md) for architecture details
3. Check browser console for error messages
4. Verify environment variables are set correctly
5. Check Supabase dashboard for data/policy issues

---

**You're all set!** 🚀

Your serverless LMS is running. No backend server needed!
