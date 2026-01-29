import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Login } from './pages/Login';
import { Signup } from './pages/Signup';
import { ForgotPassword } from './pages/ForgotPassword';
import { Dashboard } from './pages/Dashboard';
import { WorkItems } from './pages/WorkItems';
import { WorkItemDetail } from './pages/WorkItemDetail';
import { CreateWorkItem } from './pages/CreateWorkItem';
import { Users } from './pages/Users';
import { Projects } from './pages/Projects';

function AppRoutes() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  return (
    <Routes>
      <Route 
        path="/login" 
        element={
          user ? (
            <Navigate to="/dashboard" replace />
          ) : (
            <Login key="login" />
          )
        } 
      />
      <Route 
        path="/signup" 
        element={
          user ? (
            <Navigate to="/dashboard" replace />
          ) : (
            <Signup />
          )
        } 
      />
      <Route 
        path="/forgot-password" 
        element={
          user ? (
            <Navigate to="/dashboard" replace />
          ) : (
            <ForgotPassword />
          )
        } 
      />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/work-items"
        element={
          <ProtectedRoute>
            <WorkItems />
          </ProtectedRoute>
        }
      />
      <Route
        path="/work-items/new"
        element={
          <ProtectedRoute>
            <CreateWorkItem />
          </ProtectedRoute>
        }
      />
      <Route
        path="/work-items/:id"
        element={
          <ProtectedRoute>
            <WorkItemDetail />
          </ProtectedRoute>
        }
      />
      <Route
        path="/projects"
        element={
          <ProtectedRoute>
            <Projects />
          </ProtectedRoute>
        }
      />
      <Route
        path="/users"
        element={
          <ProtectedRoute requiredRole={['admin']}>
            <Users />
          </ProtectedRoute>
        }
      />
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <AppRoutes />
        <Toaster position="top-right" />
      </AuthProvider>
    </Router>
  );
}

export default App;
