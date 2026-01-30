import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Home } from './pages/Home';
import { CourseDetail } from './pages/CourseDetail';
import { LessonViewer } from './pages/LessonViewer';
import { Dashboard } from './pages/Dashboard';
import { InstructorDashboard } from './pages/InstructorDashboard';
import { CourseEditor } from './pages/CourseEditor';
import { CourseBuilder } from './components/course-builder/CourseBuilder';
import { Certificate } from './pages/Certificate';
import { Login } from './pages/Login';
import { Checkout } from './pages/Checkout';
import { PaymentCallback } from './pages/PaymentCallback';
import { CourseProvider } from './context/CourseContext';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { DevMenu } from './components/DevMenu';
import { UserRole } from './types';

const App: React.FC = () => {
  return (
    <AuthProvider>
      <CourseProvider>
        <HashRouter>
          <Routes>
            {/* Public Routes */}
            <Route path="/login" element={<Login />} />
            
            {/* Protected Routes */}
            <Route path="/" element={<ProtectedRoute />}>
              <Route element={<Layout />}>
                <Route index element={<Home />} />
                <Route path="course/:id" element={<CourseDetail />} />
                <Route path="checkout/:courseId" element={<Checkout />} />
                <Route path="payment/callback" element={<PaymentCallback />} />
                <Route path="dashboard" element={<Dashboard />} />
                <Route path="certificate/:courseId" element={<Certificate />} />
                
                {/* Instructor Only Routes */}
                <Route element={<ProtectedRoute allowedRoles={[UserRole.INSTRUCTOR, UserRole.ADMIN]} />}>
                  <Route path="instructor" element={<InstructorDashboard />} />
                </Route>
              </Route>
              
              {/* Full Screen Pages (Still Protected) */}
              <Route path="learn/:courseId/lesson/:lessonId" element={<LessonViewer />} />
              
              {/* Instructor Editor - New Course Builder */}
              <Route element={<ProtectedRoute allowedRoles={[UserRole.INSTRUCTOR, UserRole.ADMIN]} />}>
                <Route path="instructor/edit/:courseId" element={<CourseBuilder />} />
                <Route path="instructor/edit-legacy/:id" element={<CourseEditor />} />
              </Route>
            </Route>
            
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
          <DevMenu />
        </HashRouter>
      </CourseProvider>
    </AuthProvider>
  );
};

export default App;