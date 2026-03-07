import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import LoginPage from './pages/LoginPage';
import UsersPage from './pages/admin/UsersPage';
import CategoriesPage from './pages/admin/CategoriesPage';
import ExercisesPage from './pages/admin/ExercisesPage';
import RoutinesPage from './pages/admin/RoutinesPage';
import AssignmentsPage from './pages/admin/AssignmentsPage';
import MyRoutinesPage from './pages/user/MyRoutinesPage';
import WorkoutPage from './pages/user/WorkoutPage';
import HistoryPage from './pages/user/HistoryPage';
import './App.css';

function PrivateRoute({ children, adminOnly = false }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (adminOnly && user.role !== 'admin') return <Navigate to="/my-routines" replace />;
  return children;
}

function AppRoutes() {
  const { user } = useAuth();

  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/workout/:id" element={
        <PrivateRoute><WorkoutPage /></PrivateRoute>
      } />
      <Route path="/history" element={
        <PrivateRoute><HistoryPage /></PrivateRoute>
      } />

      <Route path="*" element={
        <>
          <Navbar />
          <div className="main-content">
            <Routes>
              <Route path="/admin/users" element={
                <PrivateRoute adminOnly><UsersPage /></PrivateRoute>
              } />
              <Route path="/admin/categories" element={
                <PrivateRoute adminOnly><CategoriesPage /></PrivateRoute>
              } />
              <Route path="/admin/exercises" element={
                <PrivateRoute adminOnly><ExercisesPage /></PrivateRoute>
              } />
              <Route path="/admin/routines" element={
                <PrivateRoute adminOnly><RoutinesPage /></PrivateRoute>
              } />
              <Route path="/admin/assignments" element={
                <PrivateRoute adminOnly><AssignmentsPage /></PrivateRoute>
              } />
              <Route path="/my-routines" element={
                <PrivateRoute><MyRoutinesPage /></PrivateRoute>
              } />
              <Route path="/" element={
                user
                  ? <Navigate to={user.role === 'admin' ? '/admin/users' : '/my-routines'} replace />
                  : <Navigate to="/login" replace />
              } />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </div>
        </>
      } />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <AppRoutes />
      </Router>
    </AuthProvider>
  );
}
