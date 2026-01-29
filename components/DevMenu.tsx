import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCourse } from '../context/CourseContext';
import { UserRole } from '../types';
import { Code2, X, ChevronDown, ChevronUp } from 'lucide-react';

export const DevMenu: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { addCourse } = useCourse();
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  // Only show in development
  if (import.meta.env.PROD) return null;
  if (!window.location.hostname.includes('localhost') && !window.location.hostname.includes('127.0.0.1')) {
    return null;
  }

  const quickNav = [
    { label: 'Home', path: '/' },
    { label: 'Dashboard', path: '/dashboard' },
    { label: 'Instructor Studio', path: '/instructor' },
    { label: 'Courses', path: '/courses' },
    { label: 'Login', path: '/login' },
  ];

  const handleQuickCreateCourse = async () => {
    const course = {
      id: '',
      instructorId: user?.id || 'test-instructor',
      title: `Test Course ${Date.now()}`,
      description: 'A test course created from dev menu',
      thumbnailUrl: 'https://picsum.photos/800/600?random=' + Date.now(),
      instructorName: user?.name || 'Test Instructor',
      price: 99.99,
      category: 'Development',
      level: 'Beginner' as any,
      sections: [],
      totalStudents: 0,
      rating: 4.5
    };

    const created = await addCourse(course);
    if (created) {
      alert(`Course created: ${created.title} (ID: ${created.id})`);
    }
  };

  const handleSwitchRole = async (role: UserRole) => {
    if (!user) {
      alert('Please log in first');
      return;
    }

    // You'll need to add this to your auth service
    const { supabase } = await import('../lib/supabase');
    const { error } = await supabase
      .from('users')
      .update({ role })
      .eq('id', user.id);

    if (error) {
      alert('Failed to switch role: ' + error.message);
    } else {
      alert(`Role switched to ${role}. Please refresh the page.`);
      window.location.reload();
    }
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white p-3 rounded-full shadow-lg hover:shadow-xl transition-all z-50"
        title="Dev Menu"
      >
        <Code2 className="h-5 w-5" />
      </button>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 bg-gray-900 text-white rounded-lg shadow-2xl z-50 w-80 border border-purple-500/50">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 p-3 rounded-t-lg flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Code2 className="h-4 w-4" />
          <span className="font-bold text-sm">DEV MENU</span>
        </div>
        <div className="flex gap-1">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="hover:bg-white/20 p-1 rounded transition-colors"
          >
            {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
          </button>
          <button
            onClick={() => setIsOpen(false)}
            className="hover:bg-white/20 p-1 rounded transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {isExpanded && (
        <div className="p-4 space-y-4 max-h-[600px] overflow-y-auto">
          {/* Current User Info */}
          <div className="bg-gray-800 p-3 rounded text-xs">
            <div className="text-gray-400 mb-1">Current User:</div>
            {user ? (
              <div>
                <div className="font-bold">{user.name}</div>
                <div className="text-gray-400">{user.email}</div>
                <div className="text-purple-400">{user.role}</div>
              </div>
            ) : (
              <div className="text-gray-400">Not logged in</div>
            )}
          </div>

          {/* Quick Navigation */}
          <div>
            <div className="text-xs font-bold text-gray-400 mb-2">QUICK NAV</div>
            <div className="grid grid-cols-2 gap-2">
              {quickNav.map(item => (
                <button
                  key={item.path}
                  onClick={() => navigate(item.path)}
                  className="bg-gray-800 hover:bg-gray-700 p-2 rounded text-xs transition-colors"
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {/* Role Switcher */}
          {user && (
            <div>
              <div className="text-xs font-bold text-gray-400 mb-2">SWITCH ROLE</div>
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => handleSwitchRole(UserRole.STUDENT)}
                  className="bg-blue-600 hover:bg-blue-700 p-2 rounded text-xs transition-colors"
                >
                  Student
                </button>
                <button
                  onClick={() => handleSwitchRole(UserRole.INSTRUCTOR)}
                  className="bg-green-600 hover:bg-green-700 p-2 rounded text-xs transition-colors"
                >
                  Instructor
                </button>
                <button
                  onClick={() => handleSwitchRole(UserRole.ADMIN)}
                  className="bg-red-600 hover:bg-red-700 p-2 rounded text-xs transition-colors"
                >
                  Admin
                </button>
              </div>
            </div>
          )}

          {/* Quick Actions */}
          <div>
            <div className="text-xs font-bold text-gray-400 mb-2">QUICK ACTIONS</div>
            <div className="space-y-2">
              <button
                onClick={handleQuickCreateCourse}
                className="w-full bg-purple-600 hover:bg-purple-700 p-2 rounded text-xs transition-colors"
              >
                Create Test Course
              </button>
              <button
                onClick={() => navigate('/login')}
                className="w-full bg-gray-700 hover:bg-gray-600 p-2 rounded text-xs transition-colors"
              >
                Go to Login
              </button>
              <button
                onClick={() => window.location.reload()}
                className="w-full bg-gray-700 hover:bg-gray-600 p-2 rounded text-xs transition-colors"
              >
                Reload Page
              </button>
            </div>
          </div>

          {/* Supabase Links */}
          <div>
            <div className="text-xs font-bold text-gray-400 mb-2">SUPABASE</div>
            <div className="space-y-2">
              <a
                href="https://supabase.com/dashboard/project/cvsmqxbmemexcbyobgog"
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full bg-green-600 hover:bg-green-700 p-2 rounded text-xs transition-colors text-center"
              >
                Open Dashboard
              </a>
              <a
                href="https://supabase.com/dashboard/project/cvsmqxbmemexcbyobgog/editor"
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full bg-green-600 hover:bg-green-700 p-2 rounded text-xs transition-colors text-center"
              >
                Open Table Editor
              </a>
              <a
                href="https://supabase.com/dashboard/project/cvsmqxbmemexcbyobgog/sql/new"
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full bg-green-600 hover:bg-green-700 p-2 rounded text-xs transition-colors text-center"
              >
                Open SQL Editor
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
