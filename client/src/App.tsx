import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Header from './components/Header';
import LoginForm from './components/LoginForm';
import Dashboard from './components/Dashboard';
import TaskForm from './components/TaskForm';
import TaskDetail from './components/TaskDetail';
import NotificationTest from './components/NotificationTest';
import './App.css';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" />;
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <Header />
          <main className="main-content">
            <Routes>
              <Route path="/login" element={<LoginForm />} />
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/tasks/new"
                element={
                  <ProtectedRoute>
                    <TaskForm />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/tasks/:taskId/edit"
                element={
                  <ProtectedRoute>
                    <TaskForm />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/tasks/:taskId"
                element={
                  <ProtectedRoute>
                    <TaskDetail />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/notifications/test"
                element={
                  <ProtectedRoute>
                    <NotificationTest />
                  </ProtectedRoute>
                }
              />
              <Route path="/" element={<Navigate to="/dashboard" />} />
            </Routes>
          </main>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
