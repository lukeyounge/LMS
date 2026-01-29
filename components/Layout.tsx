import React, { useState, useEffect } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Book, Search, Bell, Menu, X, Presentation, LogOut, ChevronDown, Sparkles } from 'lucide-react';
import { useCourse } from '../context/CourseContext';
import { useAuth } from '../context/AuthContext';
import { UserRole } from '../types';

export const Layout: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { searchQuery, setSearchQuery } = useCourse();
  const { user, logout } = useAuth();
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const isActive = (path: string) => location.pathname === path;

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    if (location.pathname !== '/' && e.target.value) {
      navigate('/');
    }
  };

  const clearSearch = () => {
    setSearchQuery('');
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      {/* Navbar */}
      <header className={`sticky top-0 z-40 transition-all duration-300 border-b border-gray-100 ${
        scrolled ? 'bg-white/95 backdrop-blur-md shadow-sm' : 'bg-white'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-10">
            <Link to="/" className="flex items-center gap-2 group">
              <div className="w-10 h-10 bg-primary-900 rounded-lg flex items-center justify-center text-white group-hover:bg-primary-700 transition-colors">
                 <Book className="h-6 w-6" />
              </div>
              <span className="font-serif font-bold text-xl text-gray-900 tracking-tight">KajabiLite</span>
            </Link>
            
            <nav className="hidden md:flex items-center gap-8 text-sm font-semibold tracking-wide">
              <Link 
                to="/" 
                className={`transition-colors py-1 border-b-2 ${isActive('/') ? 'text-primary-600 border-primary-600' : 'text-gray-500 border-transparent hover:text-gray-900'}`}
              >
                Marketplace
              </Link>
              <Link 
                to="/dashboard" 
                className={`transition-colors py-1 border-b-2 ${isActive('/dashboard') ? 'text-primary-600 border-primary-600' : 'text-gray-500 border-transparent hover:text-gray-900'}`}
              >
                My Library
              </Link>
              {user.role === UserRole.INSTRUCTOR && (
                <Link 
                  to="/instructor" 
                  className={`transition-colors py-1 border-b-2 flex items-center gap-2 ${location.pathname.startsWith('/instructor') ? 'text-primary-600 border-primary-600' : 'text-gray-500 border-transparent hover:text-gray-900'}`}
                >
                  <Presentation className="h-4 w-4" /> Instructor
                </Link>
              )}
            </nav>
          </div>

          <div className="flex items-center gap-6">
            <div className="relative hidden lg:block group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 group-focus-within:text-primary-600 transition-colors" />
              <input 
                type="text"
                value={searchQuery}
                onChange={handleSearchChange}
                placeholder="Find a course..." 
                className="pl-10 pr-8 py-2.5 text-sm bg-gray-50 border-none rounded-lg w-64 text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-primary-100 focus:bg-white transition-all"
              />
              {searchQuery && (
                <button 
                  onClick={clearSearch}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>
            
            <button className="text-gray-400 hover:text-gray-800 transition-colors relative">
              <Bell className="h-5 w-5" />
              <span className="absolute top-0 right-0 h-2 w-2 bg-red-500 rounded-full border-2 border-white"></span>
            </button>
            
            <div className="relative">
              <button 
                onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                className="flex items-center gap-3 pl-4 border-l border-gray-100 focus:outline-none"
              >
                <div className="hidden md:flex flex-col items-end">
                  <span className="text-sm font-bold text-gray-900 leading-none">{user.name}</span>
                  <span className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold mt-1">{user.role}</span>
                </div>
                <img 
                  src={user.avatarUrl} 
                  alt={user.name} 
                  className="h-10 w-10 rounded-lg object-cover bg-gray-200 ring-2 ring-white shadow-sm"
                />
              </button>

              {isProfileMenuOpen && (
                <div className="absolute right-0 mt-4 w-56 bg-white rounded-xl shadow-xl border border-gray-100 py-2 z-50 animate-in fade-in zoom-in-95 duration-100">
                  <div className="px-4 py-3 border-b border-gray-50 md:hidden">
                    <p className="font-bold text-gray-900">{user.name}</p>
                    <p className="text-xs text-gray-500">{user.email}</p>
                  </div>
                  <div className="px-2">
                    <button 
                      onClick={handleLogout}
                      className="w-full text-left px-3 py-2 rounded-lg text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 transition-colors font-medium"
                    >
                      <LogOut className="h-4 w-4" /> Sign Out
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 py-12 mt-auto">
        <div className="max-w-7xl mx-auto px-4 text-center">
            <div className="flex items-center justify-center gap-2 mb-4 text-gray-900">
                 <div className="w-8 h-8 bg-gray-900 rounded-md flex items-center justify-center text-white">
                     <Book className="h-4 w-4" />
                 </div>
                 <span className="font-serif font-bold text-lg">KajabiLite</span>
            </div>
          <p className="text-sm text-gray-500">&copy; 2024 LMS Platform. Empowering creators everywhere.</p>
        </div>
      </footer>
    </div>
  );
};