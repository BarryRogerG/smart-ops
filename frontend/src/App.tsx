import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { WorkItems } from './pages/WorkItems';
import { WorkItemDetail } from './pages/WorkItemDetail';
import { CreateWorkItem } from './pages/CreateWorkItem';
import { Users } from './pages/Users';

function AppRoutes() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/dashboard" replace /> : <Login />} />
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
      </AuthProvider>
    </Router>
  );
}

export default App;
