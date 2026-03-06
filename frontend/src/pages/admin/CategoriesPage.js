import React, { useEffect, useState } from 'react';
import api from '../../api/api';

export default function CategoriesPage() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [name, setName] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState('');

  const fetchCategories = async () => {
    try {
      const res = await api.get('/categories');
      setCategories(res.data);
    } catch {
      setError('Error al cargar categorias');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchCategories(); }, []);

  const handleCreate = async e => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post('/categories', { name });
      setName('');
      setShowForm(false);
      fetchCategories();
    } catch (err) {
      setError(err.response?.data?.message || 'Error al crear categoria');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdate = async id => {
    try {
      await api.put(`/categories/${id}`, { name: editName });
      setEditingId(null);
      fetchCategories();
    } catch {
      setError('Error al actualizar');
    }
  };

  const handleDelete = async id => {
    if (!window.confirm('Eliminar categoria?')) return;
    try {
      await api.delete(`/categories/${id}`);
      fetchCategories();
    } catch {
      setError('Error al eliminar categoria');
    }
  };

  return (
    <div className="page">
      <div className="page-header">
        <h2>Categorias</h2>
        <button className="btn-primary" onClick={() => setShowForm(v => !v)}>
          {showForm ? 'Cancelar' : '+ Nueva Categoria'}
        </button>
      </div>

      {error && <p className="error-msg">{error}</p>}

      {showForm && (
        <form className="inline-form" onSubmit={handleCreate}>
          <input
            placeholder="Nombre de categoria"
            value={name}
            onChange={e => setName(e.target.value)}
            required
          />
          <button type="submit" className="btn-primary" disabled={saving}>
            {saving ? 'Guardando...' : 'Crear'}
          </button>
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
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {categories.map(c => (
              <tr key={c.id}>
                <td>{c.id}</td>
                <td>
                  {editingId === c.id ? (
                    <input
                      value={editName}
                      onChange={e => setEditName(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleUpdate(c.id)}
                      autoFocus
                    />
                  ) : (
                    c.name
                  )}
                </td>
                <td className="actions">
                  {editingId === c.id ? (
                    <>
                      <button className="btn-primary btn-sm" onClick={() => handleUpdate(c.id)}>Guardar</button>
                      <button className="btn-sm" onClick={() => setEditingId(null)}>Cancelar</button>
                    </>
                  ) : (
                    <>
                      <button className="btn-sm" onClick={() => { setEditingId(c.id); setEditName(c.name); }}>Editar</button>
                      <button className="btn-danger btn-sm" onClick={() => handleDelete(c.id)}>Eliminar</button>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
