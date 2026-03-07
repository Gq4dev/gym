import React, { useEffect, useState } from 'react';
import api from '../../api/api';

const emptyForm = { name: '', description: '', category_id: '', video_url: '' };

export default function ExercisesPage() {
  const [exercises, setExercises] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const fetchAll = async () => {
    try {
      const [exRes, catRes] = await Promise.all([
        api.get('/exercises'),
        api.get('/categories'),
      ]);
      setExercises(exRes.data);
      setCategories(catRes.data);
    } catch {
      setError('Error al cargar datos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAll(); }, []);

  const handleSubmit = async e => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editingId) {
        await api.put(`/exercises/${editingId}`, form);
        setEditingId(null);
      } else {
        await api.post('/exercises', form);
      }
      setForm(emptyForm);
      setShowForm(false);
      fetchAll();
    } catch (err) {
      setError(err.response?.data?.message || 'Error al guardar ejercicio');
    } finally {
      setSaving(false);
    }
  };

  const startEdit = ex => {
    setEditingId(ex.id);
    setForm({ name: ex.name, description: ex.description || '', category_id: ex.category_id || '', video_url: ex.video_url || '' });
    setShowForm(true);
  };

  const cancelForm = () => {
    setForm(emptyForm);
    setEditingId(null);
    setShowForm(false);
  };

  const handleDelete = async id => {
    if (!window.confirm('Eliminar ejercicio?')) return;
    try {
      await api.delete(`/exercises/${id}`);
      fetchAll();
    } catch {
      setError('Error al eliminar');
    }
  };

  const getCategoryName = id => categories.find(c => c.id === id)?.name || '-';

  return (
    <div className="page">
      <div className="page-header">
        <h2>Ejercicios</h2>
        <button className="btn-primary" onClick={() => showForm ? cancelForm() : setShowForm(true)}>
          {showForm ? 'Cancelar' : '+ Nuevo Ejercicio'}
        </button>
      </div>

      {error && <p className="error-msg">{error}</p>}

      {showForm && (
        <form className="card-form" onSubmit={handleSubmit}>
          <h3>{editingId ? 'Editar Ejercicio' : 'Nuevo Ejercicio'}</h3>
          <div className="form-group">
            <label>Nombre</label>
            <input
              value={form.name}
              onChange={e => setForm({ ...form, name: e.target.value })}
              required
              autoFocus
            />
          </div>
          <div className="form-group">
            <label>Descripcion</label>
            <textarea
              value={form.description}
              onChange={e => setForm({ ...form, description: e.target.value })}
              rows={3}
            />
          </div>
          <div className="form-group">
            <label>Categoria</label>
            <select
              value={form.category_id}
              onChange={e => setForm({ ...form, category_id: e.target.value })}
            >
              <option value="">-- Sin categoria --</option>
              {categories.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label>Video URL (YouTube u otro)</label>
            <input
              value={form.video_url}
              onChange={e => setForm({ ...form, video_url: e.target.value })}
              placeholder="https://youtube.com/watch?v=..."
            />
          </div>
          <div className="form-actions">
            <button type="submit" className="btn-primary" disabled={saving}>
              {saving ? 'Guardando...' : editingId ? 'Actualizar' : 'Crear'}
            </button>
            <button type="button" className="btn-secondary" onClick={cancelForm}>Cancelar</button>
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
              <th>Nombre</th>
              <th>Categoria</th>
              <th>Descripcion</th>
              <th>Video</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {exercises.map(ex => (
              <tr key={ex.id}>
                <td>{ex.id}</td>
                <td>{ex.name}</td>
                <td>{getCategoryName(ex.category_id)}</td>
                <td className="text-muted">{ex.description || '-'}</td>
                <td>
                  {ex.video_url
                    ? <a href={ex.video_url} target="_blank" rel="noreferrer" className="text-muted">Ver</a>
                    : <span className="text-muted">-</span>}
                </td>
                <td className="actions">
                  <button className="btn-sm" onClick={() => startEdit(ex)}>Editar</button>
                  <button className="btn-danger btn-sm" onClick={() => handleDelete(ex.id)}>Eliminar</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
