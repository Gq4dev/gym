import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (!user) return null;

  return (
    <nav className="navbar">
      <span className="navbar-brand">GYM App</span>
      <div className="navbar-links">
        {user.role === 'admin' ? (
          <>
            <Link to="/admin/users">Usuarios</Link>
            <Link to="/admin/categories">Categorias</Link>
            <Link to="/admin/exercises">Ejercicios</Link>
            <Link to="/admin/routines">Rutinas</Link>
            <Link to="/admin/assignments">Asignaciones</Link>
          </>
        ) : (
          <Link to="/my-routines">Mis Rutinas</Link>
        )}
      </div>
      <div className="navbar-user">
        <span>{user.username} {user.role === 'admin' && <span className="badge badge-admin">admin</span>}</span>
        <button onClick={handleLogout}>Salir</button>
      </div>
    </nav>
  );
}
