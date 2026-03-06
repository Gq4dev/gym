import React, { useEffect, useState } from 'react';
import api from '../../api/api';

const emptyForm = { routine_id: '', user_id: '', due_date: '' };

export default function AssignmentsPage() {
  const [assignments, setAssignments] = useState([]);
  const [routines, setRoutines] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);

  const fetchAll = async () => {
    try {
      const [aRes, rRes, uRes] = await Promise.all([
        api.get('/assignments'),
        api.get('/routines'),
        api.get('/users'),
      ]);
      setAssignments(aRes.data);
      setRoutines(rRes.data);
      setUsers(uRes.data);
    } catch {
      setError('Error al cargar datos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAll(); }, []);

  const handleCreate = async e => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post('/assignments', form);
      setForm(emptyForm);
      setShowForm(false);
      fetchAll();
    } catch (err) {
      setError(err.response?.data?.message || 'Error al crear asignacion');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async id => {
    if (!window.confirm('Eliminar asignacion?')) return;
    try {
      await api.delete(`/assignments/${id}`);
      fetchAll();
    } catch {
      setError('Error al eliminar asignacion');
    }
  };

  const getRoutineTitle = id => routines.find(r => r.id === Number(id))?.title || id;
  const getUsername = id => users.find(u => u.id === Number(id))?.username || id;

  return (
    <div className="page">
      <div className="page-header">
        <h2>Asignaciones</h2>
        <button className="btn-primary" onClick={() => setShowForm(v => !v)}>
          {showForm ? 'Cancelar' : '+ Nueva Asignacion'}
        </button>
      </div>

      {error && <p className="error-msg">{error}</p>}

      {showForm && (
        <form className="card-form" onSubmit={handleCreate}>
          <h3>Asignar Rutina</h3>
          <div className="form-group">
            <label>Rutina</label>
            <select
              value={form.routine_id}
              onChange={e => setForm({ ...form, routine_id: e.target.value })}
              required
            >
              <option value="">-- Seleccionar rutina --</option>
              {routines.map(r => (
                <option key={r.id} value={r.id}>{r.title}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label>Usuario</label>
            <select
              value={form.user_id}
              onChange={e => setForm({ ...form, user_id: e.target.value })}
              required
            >
              <option value="">-- Seleccionar usuario --</option>
              {users.filter(u => u.role === 'user').map(u => (
                <option key={u.id} value={u.id}>{u.username}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label>Fecha limite</label>
            <input
              type="date"
              value={form.due_date}
              onChange={e => setForm({ ...form, due_date: e.target.value })}
            />
          </div>
          <div className="form-actions">
            <button type="submit" className="btn-primary" disabled={saving}>
              {saving ? 'Guardando...' : 'Asignar'}
            </button>
            <button type="button" onClick={() => setShowForm(false)}>Cancelar</button>
          </div>
        </form>
      )}

      {loading ? (
        <p>Cargando...</p>
      ) : (
        <table className="data-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Rutina</th>
              <th>Usuario</th>
              <th>Asignado</th>
              <th>Vencimiento</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {assignments.map(a => (
              <tr key={a.id}>
                <td>{a.id}</td>
                <td>{getRoutineTitle(a.routine_id)}</td>
                <td>{getUsername(a.user_id)}</td>
                <td>{a.assigned_at ? new Date(a.assigned_at).toLocaleDateString() : '-'}</td>
                <td>{a.due_date ? new Date(a.due_date).toLocaleDateString() : '-'}</td>
                <td>
                  <button className="btn-danger btn-sm" onClick={() => handleDelete(a.id)}>
                    Eliminar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
