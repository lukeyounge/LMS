import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { UserRole } from '../types';
import { Button } from '../components/Button';
import { Book, Mail, User as UserIcon, Lock, ArrowRight, AlertCircle } from 'lucide-react';

export const Login: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, register } = useAuth();
  
  const [isLogin, setIsLogin] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>(UserRole.STUDENT);

  const from = location.state?.from?.pathname || '/';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      if (isLogin) {
        await login(email, password);
      } else {
        await register(name, email, role, password);
      }
      navigate(from, { replace: true });
    } catch (err: any) {
      setError(err.message || "Authentication failed");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-white">
      {/* Left Side - Visual */}
      <div className="hidden lg:flex lg:w-1/2 bg-primary-900 relative overflow-hidden items-center justify-center text-white p-12">
        <div className="relative z-10 max-w-lg">
          <div className="flex items-center gap-3 text-3xl font-bold mb-8">
            <Book className="h-10 w-10 text-primary-300" />
            <span>LMS Platform</span>
          </div>
          <h1 className="text-5xl font-bold mb-6 leading-tight">
            Master New Skills,<br />
            <span className="text-primary-300">Anytime, Anywhere.</span>
          </h1>
          <p className="text-primary-100 text-lg mb-8">
            Join thousands of learners and instructors on the most advanced learning management system powered by AI.
          </p>
          
          <div className="grid grid-cols-2 gap-6 mt-12">
            <div className="bg-white/10 backdrop-blur-sm p-6 rounded-xl">
              <h3 className="text-xl font-bold mb-2">For Students</h3>
              <p className="text-primary-200 text-sm">Access world-class courses, track progress, and earn certificates.</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm p-6 rounded-xl">
              <h3 className="text-xl font-bold mb-2">For Instructors</h3>
              <p className="text-primary-200 text-sm">Create courses, manage students, and grow your audience.</p>
            </div>
          </div>
        </div>

        {/* Abstract shapes */}
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 bg-primary-700 rounded-full opacity-50 blur-3xl"></div>
        <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-96 h-96 bg-primary-500 rounded-full opacity-30 blur-3xl"></div>
      </div>

      {/* Right Side - Form */}
      <div className="flex-1 flex flex-col justify-center px-4 sm:px-12 lg:px-24 bg-gray-50">
        <div className="max-w-md mx-auto w-full bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              {isLogin ? 'Welcome back!' : 'Create an account'}
            </h2>
            <p className="text-gray-500 text-sm">
              {isLogin 
                ? 'Please enter your details to access your account.' 
                : 'Start your learning journey today.'}
            </p>
          </div>

          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                <div className="relative">
                  <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="pl-10 w-full bg-white text-gray-900 border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-primary-500 outline-none placeholder-gray-400"
                    placeholder="John Doe"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 w-full bg-white text-gray-900 border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-primary-500 outline-none placeholder-gray-400"
                  placeholder="name@company.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 w-full bg-white text-gray-900 border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-primary-500 outline-none placeholder-gray-400"
                  placeholder="••••••••"
                />
              </div>
            </div>

            {!isLogin && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">I want to:</label>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    type="button"
                    onClick={() => setRole(UserRole.STUDENT)}
                    className={`px-4 py-2 rounded-lg border text-sm font-medium transition-colors ${
                      role === UserRole.STUDENT 
                        ? 'bg-primary-50 border-primary-500 text-primary-700' 
                        : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    Learn
                  </button>
                  <button
                    type="button"
                    onClick={() => setRole(UserRole.INSTRUCTOR)}
                    className={`px-4 py-2 rounded-lg border text-sm font-medium transition-colors ${
                      role === UserRole.INSTRUCTOR 
                        ? 'bg-primary-50 border-primary-500 text-primary-700' 
                        : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    Teach
                  </button>
                </div>
              </div>
            )}

            <Button type="submit" className="w-full mt-6" size="lg" isLoading={isLoading}>
              {isLogin ? 'Sign In' : 'Create Account'} <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </form>

          <div className="mt-8 text-center">
            <p className="text-sm text-gray-600">
              {isLogin ? "Don't have an account? " : "Already have an account? "}
              <button 
                onClick={() => setIsLogin(!isLogin)} 
                className="text-primary-600 font-bold hover:underline"
              >
                {isLogin ? 'Sign up' : 'Log in'}
              </button>
            </p>
          </div>
          
          {/* Demo Credentials Hint */}
          <div className="mt-8 pt-6 border-t border-gray-100 text-xs text-gray-500">
            <p className="font-semibold mb-2">Demo Credentials:</p>
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-gray-100 p-2 rounded cursor-pointer hover:bg-gray-200" onClick={() => { setEmail('student@example.com'); setIsLogin(true); }}>
                <span className="block font-medium">Student</span>
                <span className="block text-gray-400">student@example.com</span>
              </div>
              <div className="bg-gray-100 p-2 rounded cursor-pointer hover:bg-gray-200" onClick={() => { setEmail('instructor@example.com'); setIsLogin(true); }}>
                <span className="block font-medium">Instructor</span>
                <span className="block text-gray-400">instructor@example.com</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};