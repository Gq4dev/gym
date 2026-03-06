import React, { useEffect, useState } from 'react';
import api from '../../api/api';

const emptyForm = { title: '', notes: '' };

export default function RoutinesPage() {
  const [routines, setRoutines] = useState([]);
  const [exercises, setExercises] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [expandedId, setExpandedId] = useState(null);
  const [exForm, setExForm] = useState({ exercise_id: '', sets: '', reps: '', duration: '' });
  const [addingExTo, setAddingExTo] = useState(null);

  const fetchAll = async () => {
    try {
      const [rRes, eRes] = await Promise.all([
        api.get('/routines'),
        api.get('/exercises'),
      ]);
      setRoutines(rRes.data);
      setExercises(eRes.data);
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
        await api.put(`/routines/${editingId}`, form);
        setEditingId(null);
      } else {
        await api.post('/routines', form);
      }
      setForm(emptyForm);
      setShowForm(false);
      fetchAll();
    } catch (err) {
      setError(err.response?.data?.message || 'Error al guardar rutina');
    } finally {
      setSaving(false);
    }
  };

  const cancelForm = () => {
    setForm(emptyForm);
    setEditingId(null);
    setShowForm(false);
  };

  const startEdit = r => {
    setEditingId(r.id);
    setForm({ title: r.title, notes: r.notes || '' });
    setShowForm(true);
  };

  const handleDelete = async id => {
    if (!window.confirm('Eliminar rutina?')) return;
    try {
      await api.delete(`/routines/${id}`);
      fetchAll();
    } catch {
      setError('Error al eliminar rutina');
    }
  };

  const handleAddExercise = async (routineId) => {
    try {
      await api.post(`/routines/${routineId}/exercises`, exForm);
      setExForm({ exercise_id: '', sets: '', reps: '', duration: '' });
      setAddingExTo(null);
      fetchAll();
    } catch {
      setError('Error al agregar ejercicio');
    }
  };

  const handleRemoveExercise = async (routineId, reId) => {
    try {
      await api.delete(`/routines/${routineId}/exercises/${reId}`);
      fetchAll();
    } catch {
      setError('Error al quitar ejercicio');
    }
  };

  return (
    <div className="page">
      <div className="page-header">
        <h2>Rutinas</h2>
        <button className="btn-primary" onClick={() => showForm ? cancelForm() : setShowForm(true)}>
          {showForm ? 'Cancelar' : '+ Nueva Rutina'}
        </button>
      </div>

      {error && <p className="error-msg">{error}</p>}

      {showForm && (
        <form className="card-form" onSubmit={handleSubmit}>
          <h3>{editingId ? 'Editar Rutina' : 'Nueva Rutina'}</h3>
          <div className="form-group">
            <label>Titulo</label>
            <input
              value={form.title}
              onChange={e => setForm({ ...form, title: e.target.value })}
              required
              autoFocus
            />
          </div>
          <div className="form-group">
            <label>Notas</label>
            <textarea
              value={form.notes}
              onChange={e => setForm({ ...form, notes: e.target.value })}
              rows={3}
            />
          </div>
          <div className="form-actions">
            <button type="submit" className="btn-primary" disabled={saving}>
              {saving ? 'Guardando...' : editingId ? 'Actualizar' : 'Crear'}
            </button>
            <button type="button" onClick={cancelForm}>Cancelar</button>
          </div>
        </form>
      )}

      {loading ? (
        <p>Cargando...</p>
      ) : (
        <div className="routine-list">
          {routines.map(r => (
            <div key={r.id} className="routine-card">
              <div className="routine-card-header">
                <div>
                  <strong>{r.title}</strong>
                  {r.notes && <p className="text-muted">{r.notes}</p>}
                </div>
                <div className="actions">
                  <button className="btn-sm" onClick={() => setExpandedId(expandedId === r.id ? null : r.id)}>
                    {expandedId === r.id ? 'Cerrar' : 'Ejercicios'}
                  </button>
                  <button className="btn-sm" onClick={() => startEdit(r)}>Editar</button>
                  <button className="btn-danger btn-sm" onClick={() => handleDelete(r.id)}>Eliminar</button>
                </div>
              </div>

              {expandedId === r.id && (
                <div className="routine-exercises">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Ejercicio</th>
                        <th>Series</th>
                        <th>Reps</th>
                        <th>Descanso (s)</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {(r.exercises || []).map(re => (
                        <tr key={re.id}>
                          <td>{exercises.find(e => e.id === re.exercise_id)?.name || re.exercise_id}</td>
                          <td>{re.sets || '-'}</td>
                          <td>{re.reps || '-'}</td>
                          <td>{re.duration || '-'}</td>
                          <td>
                            <button className="btn-danger btn-sm" onClick={() => handleRemoveExercise(r.id, re.id)}>
                              Quitar
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {addingExTo === r.id ? (
                    <div className="inline-form">
                      <select
                        value={exForm.exercise_id}
                        onChange={e => setExForm({ ...exForm, exercise_id: e.target.value })}
                      >
                        <option value="">-- Ejercicio --</option>
                        {exercises.map(e => (
                          <option key={e.id} value={e.id}>{e.name}</option>
                        ))}
                      </select>
                      <input
                        type="number"
                        placeholder="Series"
                        value={exForm.sets}
                        onChange={e => setExForm({ ...exForm, sets: e.target.value })}
                      />
                      <input
                        type="number"
                        placeholder="Reps"
                        value={exForm.reps}
                        onChange={e => setExForm({ ...exForm, reps: e.target.value })}
                      />
                      <input
                        type="number"
                        placeholder="Descanso (s)"
                        value={exForm.duration}
                        onChange={e => setExForm({ ...exForm, duration: e.target.value })}
                      />
                      <button className="btn-primary btn-sm" onClick={() => handleAddExercise(r.id)}>
                        Agregar
                      </button>
                      <button className="btn-sm" onClick={() => setAddingExTo(null)}>Cancelar</button>
                    </div>
                  ) : (
                    <button className="btn-sm" onClick={() => setAddingExTo(r.id)}>
                      + Agregar Ejercicio
                    </button>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
