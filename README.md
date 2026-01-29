# LMS Platform

A modern, serverless learning management system built with React, Vite, TypeScript, Supabase, and deployed on Vercel.

**No backend server needed** — everything runs on Supabase (PostgreSQL + Auth) and Vercel (frontend).

## Quick Start

### Prerequisites
- Node.js 18+
- Supabase account (free tier available)
- Vercel account (optional, for deployment)

### Local Development

1. **Clone & Install:**
   ```bash
   npm install
   ```

2. **Setup Environment:**
   ```bash
   cp .env.example .env.local
   # Edit .env.local with your Supabase keys:
   # VITE_SUPABASE_URL=https://[project-id].supabase.co
   # VITE_SUPABASE_ANON_KEY=[your-anon-key]
   # GEMINI_API_KEY=[optional, for AI features]
   ```

3. **Start Dev Server:**
   ```bash
   npm run dev
   ```
   App will be at `http://localhost:3000` (or next available port)

4. **Login with Test Credentials:**
   - Email: `student@example.com`
   - Password: `password123`

## Features

✅ **User Management** - Email/password authentication via Supabase
✅ **Role-Based Access** - Students, Instructors, Admins
✅ **Course Management** - Create, edit, publish courses
✅ **Lesson Types** - Video, text, quizzes, assignments
✅ **Progress Tracking** - Automatic completion tracking
✅ **AI Integration** - Google Generative AI for content generation
✅ **Responsive UI** - Mobile-friendly design with Tailwind CSS

## Architecture

```
Frontend (React + Vite + TypeScript)
    ↓
Supabase
├── PostgreSQL Database
├── Email/Password Auth
└── Row-Level Security (RLS)
    ↓
Vercel (Production Deployment)
```

**No Express/Node backend needed** — all business logic runs in React with Supabase handling data access.

## File Structure

```
src/
├── components/        # React UI components
├── context/          # Auth and Course state (Context API)
├── pages/            # Page components
├── services/         # Supabase queries and API calls
├── lib/              # Utilities (supabaseClient, etc.)
├── types.ts          # TypeScript interfaces
└── App.tsx           # Main routing
```

## Deployment

### Vercel

1. Push code to GitHub
2. Import project in Vercel dashboard
3. Add environment variables:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `GEMINI_API_KEY` (optional)
4. Deploy on push to main

### Production Build
```bash
npm run build  # Creates dist/
npm run preview  # Test production build locally
```

## Documentation

- **[CLAUDE.md](./CLAUDE.md)** - Developer context and architecture details
- **[QUICKSTART.md](./QUICKSTART.md)** - Detailed setup guide
- **[TESTING_GUIDE.md](./TESTING_GUIDE.md)** - How to test features

## Key Technologies

| Layer | Technology |
|-------|-----------|
| Framework | React 19 + TypeScript 5 |
| Build | Vite 6 |
| Database | Supabase (PostgreSQL) |
| Auth | Supabase Auth |
| Frontend Deployment | Vercel |
| Styling | Tailwind CSS |
| AI | Google Generative AI |

## Common Tasks

### Create a New Page
1. Add component to `src/pages/`
2. Import and add route in `src/App.tsx`
3. Use `AuthContext` for user data if needed

### Add a Database Feature
1. Implement query in `src/services/courseService.ts`
2. Add method to `CourseContext` if affects global state
3. Use `useContext(CourseContext)` in component

### Setup AI Features
- Ensure `GEMINI_API_KEY` is in `.env.local`
- Use methods in `src/services/geminiService.ts`
- See `CLAUDE.md` for examples

## Troubleshooting

**Supabase Connection Error?**
- Verify `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in `.env.local`
- Check Supabase project is active

**401 Unauthorized?**
- Clear localStorage and login again
- Check RLS policies in Supabase dashboard

**Gemini API Errors?**
- Verify `GEMINI_API_KEY` is set
- Check rate limits (may throttle on free tier)

## Resources

- [Supabase Documentation](https://supabase.com/docs)
- [React Documentation](https://react.dev)
- [Vite Documentation](https://vitejs.dev)
- [Tailwind CSS](https://tailwindcss.com)
- [Vercel Deployment](https://vercel.com/docs)

## Support

For detailed guidance:
- See [CLAUDE.md](./CLAUDE.md) for architecture and patterns
- Check [TESTING_GUIDE.md](./TESTING_GUIDE.md) for feature testing
- Review Supabase dashboard at https://app.supabase.com

---

**Your serverless LMS is ready!** 🚀
