import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../api/api';

export default function UserDashboardPage() {
    const { id } = useParams();
    const navigate = useNavigate();

    const [user, setUser] = useState(null);
    const [routines, setRoutines] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Routine Builder State
    const [showBuilder, setShowBuilder] = useState(false);
    const [saving, setSaving] = useState(false);
    const [availableExercises, setAvailableExercises] = useState([]);

    const [newRoutine, setNewRoutine] = useState({
        title: '',
        notes: '',
        exercises: [] // { exercise_id, sets, reps, duration }
    });

    // Assign Existing Routine State
    const [genericRoutines, setGenericRoutines] = useState([]);
    const [showAssign, setShowAssign] = useState(false);
    const [selectedRoutineId, setSelectedRoutineId] = useState('');
    const [assignDate, setAssignDate] = useState('');
    const [newRoutineDate, setNewRoutineDate] = useState('');
    const [assigning, setAssigning] = useState(false);

    const fetchDashboard = async () => {
        try {
            const res = await api.get(`/users/${id}/dashboard`);
            setUser(res.data.user);
            setRoutines(res.data.assigned_routines);
        } catch {
            setError('Error al cargar panel del usuario');
        } finally {
            setLoading(false);
        }
    };

    const fetchExercises = async () => {
        try {
            const res = await api.get('/exercises');
            setAvailableExercises(res.data);
        } catch {
            console.error('Error fetching exercises for builder');
        }
    };

    const fetchGenericRoutines = async () => {
        try {
            const res = await api.get('/routines');
            setGenericRoutines(res.data);
        } catch {
            console.error('Error fetching generic routines');
        }
    };

    useEffect(() => {
        fetchDashboard();
        fetchExercises();
        fetchGenericRoutines();
    }, [id]);

    const handleAssignExisting = async () => {
        if (!selectedRoutineId) return;
        setAssigning(true);
        try {
            await api.post('/assignments', {
                routine_id: selectedRoutineId,
                user_id: id,
                due_date: assignDate || null
            });
            setShowAssign(false);
            setSelectedRoutineId('');
            setAssignDate('');
            fetchDashboard();
        } catch (err) {
            alert(err.response?.data?.message || 'Error al asignar rutina');
        } finally {
            setAssigning(false);
        }
    };

    const addExerciseToBuilder = () => {
        setNewRoutine(prev => ({
            ...prev,
            exercises: [...prev.exercises, { exercise_id: '', sets: 1, reps: 0, duration: 0 }]
        }));
    };

    const removeExerciseFromBuilder = (index) => {
        setNewRoutine(prev => {
            const copy = [...prev.exercises];
            copy.splice(index, 1);
            return { ...prev, exercises: copy };
        });
    };

    const updateBuilderExercise = (index, field, value) => {
        setNewRoutine(prev => {
            const copy = [...prev.exercises];
            copy[index][field] = value === '' ? '' : Number(value);
            return { ...prev, exercises: copy };
        });
    };

    const handleSaveRoutine = async (e) => {
        e.preventDefault();
        setSaving(true);

        // Validations
        if (!newRoutine.title) {
            alert('El titulo de la rutina es requerido.');
            setSaving(false);
            return;
        }

        // Filter out invalid exercises (no ID selected)
        const validExercises = newRoutine.exercises.filter(ex => ex.exercise_id);

        try {
            await api.post(`/users/${id}/routines`, {
                title: newRoutine.title,
                notes: newRoutine.notes,
                due_date: newRoutineDate || null,
                exercises: validExercises
            });

            // Reset form and close
            setShowBuilder(false);
            setNewRoutine({ title: '', notes: '', exercises: [] });
            setNewRoutineDate('');

            // Refresh dashboard to show new routine
            fetchDashboard();
        } catch (err) {
            alert(err.response?.data?.message || 'Error al guardar rutina');
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="page"><p>Cargando panel...</p></div>;
    if (error) return <div className="page"><p className="error-msg">{error}</p></div>;
    if (!user) return <div className="page"><p>Usuario no encontrado</p></div>;

    // Calculo de meses como miembro
    const joinDate = new Date(user.created_at);
    const now = new Date();
    const monthsMember = (now.getFullYear() - joinDate.getFullYear()) * 12 + (now.getMonth() - joinDate.getMonth());
    const displayMonths = Math.max(0, monthsMember);

    // Agrupar rutinas por mes de asignacion o fecha sugerida
    const groupedRoutines = routines.reduce((acc, item) => {
        // Usa due_date preferentemente, o la fecha de asignacion/creacion original
        const d = new Date(item.due_date || item.assigned_at || item.routine.created_at);

        // Obtenemos solo mes y anio para agrupar ej: "marzo 2026" o "junio 2026"
        let monthYearStr = d.toLocaleString('es-ES', { month: 'long', year: 'numeric' });
        // Capitalizamos la primera letra del mes para que se vea mas premium
        monthYearStr = monthYearStr.charAt(0).toUpperCase() + monthYearStr.slice(1);

        if (!acc[monthYearStr]) acc[monthYearStr] = [];
        acc[monthYearStr].push(item);
        return acc;
    }, {});

    return (
        <div className="page" style={{ maxWidth: '1000px', margin: '0 auto', paddingBottom: '50px' }}>
            {/* HERADER PREMIUM */}
            <div className="dashboard-header-premium">
                <div>
                    <h2>PANEL DE {user.username.toUpperCase()}</h2>
                    <p className="dashboard-subtitle">
                        Miembro desde: {displayMonths === 0 ? 'menos de 1 mes' : `${displayMonths} meses`}
                    </p>
                </div>
                <div style={{ display: 'flex', gap: '15px' }}>
                    <button className="btn-volver-premium" onClick={() => navigate('/admin/users')}>
                        ← Volver
                    </button>
                    <button className="btn-secondary" onClick={() => { setShowAssign(!showAssign); setShowBuilder(false); }} style={{ background: '#fff' }}>
                        {showAssign ? '✕ Cancelar' : '+ Asignar Rutina'}
                    </button>
                    <button className="btn-white" onClick={() => { setShowBuilder(!showBuilder); setShowAssign(false); }}>
                        {showBuilder ? '✕ Cancelar' : '⚡ Nueva Personalizada'}
                    </button>
                </div>
            </div>

            {/* ASSIGN EXISTING ROUTINE */}
            {showAssign && (
                <div className="builder-card-premium" style={{ marginBottom: '30px' }}>
                    <h3 style={{ marginTop: 0, color: '#1e293b', fontSize: '1.4rem', marginBottom: '15px' }}>Asignar Rutina Genérica</h3>
                    <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                        <select
                            className="input-premium"
                            style={{ flex: 1, cursor: 'pointer' }}
                            value={selectedRoutineId}
                            onChange={(e) => setSelectedRoutineId(e.target.value)}
                        >
                            <option value="">-- Selecciona una rutina genérica --</option>
                            {genericRoutines.map(r => (
                                <option key={r.id} value={r.id}>{r.title} ({r.exercises?.length || 0} ej.)</option>
                            ))}
                        </select>
                        <input
                            type="date"
                            className="input-premium"
                            style={{ width: '180px' }}
                            value={assignDate}
                            onChange={(e) => setAssignDate(e.target.value)}
                            title="Fecha sugerida o inicio (Opcional)"
                        />
                        <button
                            className="btn-primary"
                            disabled={!selectedRoutineId || assigning}
                            onClick={handleAssignExisting}
                            style={{ padding: '12px 24px' }}
                        >
                            {assigning ? 'Asignando...' : 'Guardar y Asignar'}
                        </button>
                    </div>
                </div>
            )}

            {/* ROUTINE BUILDER */}
            {showBuilder && (
                <div className="builder-card-premium">
                    <h3 style={{ marginTop: 0, color: '#1e293b', fontSize: '1.8rem', marginBottom: '25px' }}>Construir Rutina para {user.username}</h3>
                    <form onSubmit={handleSaveRoutine}>
                        <div className="form-group" style={{ marginBottom: '20px' }}>
                            <label style={{ fontWeight: '600', color: '#475569', marginBottom: '8px', display: 'block' }}>Título de la rutina</label>
                            <input
                                type="text"
                                className="input-premium"
                                value={newRoutine.title}
                                onChange={e => setNewRoutine({ ...newRoutine, title: e.target.value })}
                                placeholder="Ej: Push Day Avanzado, Piernas Nivel 2..."
                            />
                        </div>
                        <div style={{ display: 'flex', gap: '20px', marginBottom: '30px' }}>
                            <div className="form-group" style={{ flex: 2 }}>
                                <label style={{ fontWeight: '600', color: '#475569', marginBottom: '8px', display: 'block' }}>Notas o Indicaciones (opcional)</label>
                                <textarea
                                    className="input-premium"
                                    value={newRoutine.notes}
                                    onChange={e => setNewRoutine({ ...newRoutine, notes: e.target.value })}
                                    rows={2}
                                    placeholder="Descansar 90 segundos entre ejercicios"
                                />
                            </div>
                            <div className="form-group" style={{ flex: 1 }}>
                                <label style={{ fontWeight: '600', color: '#475569', marginBottom: '8px', display: 'block' }}>Fecha sugerida (opcional)</label>
                                <input
                                    type="date"
                                    className="input-premium"
                                    value={newRoutineDate}
                                    onChange={e => setNewRoutineDate(e.target.value)}
                                />
                            </div>
                        </div>

                        <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                                <h4 style={{ fontSize: '1.4rem', color: '#334155', margin: 0 }}>Ejercicios ({newRoutine.exercises.length})</h4>
                                <button type="button" onClick={addExerciseToBuilder} className="btn-secondary btn-sm" style={{ fontWeight: 'bold' }}>
                                    + Agregar Ejercicio
                                </button>
                            </div>

                            {newRoutine.exercises.length === 0 && (
                                <div style={{ padding: '30px', textAlign: 'center', background: '#f1f5f9', borderRadius: '12px', color: '#64748b', border: '2px dashed #cbd5e1' }}>
                                    No has agregado ejercicios todavía. Presiona "+ Agregar Ejercicio".
                                </div>
                            )}

                            {newRoutine.exercises.length > 0 && (
                                <div style={{ display: 'flex', gap: '15px', marginBottom: '5px', padding: '0 15px', fontSize: '0.85rem', fontWeight: 'bold', color: '#64748b', textTransform: 'uppercase' }}>
                                    <div style={{ flex: 1 }}>Ejercicio</div>
                                    <div style={{ width: '90px' }}>Series</div>
                                    <div style={{ width: '90px' }}>Reps</div>
                                    <div style={{ width: '120px' }}>Tiempo (Segs)</div>
                                    <div style={{ width: '45px' }}></div>
                                </div>
                            )}

                            {newRoutine.exercises.map((ex, idx) => (
                                <div key={idx} className="exercise-builder-row">
                                    <div style={{ flex: 1 }}>
                                        <select
                                            className="input-premium"
                                            value={ex.exercise_id}
                                            onChange={e => updateBuilderExercise(idx, 'exercise_id', e.target.value)}
                                            style={{ cursor: 'pointer' }}
                                        >
                                            <option value="">-- Seleccionar Ejercicio --</option>
                                            {availableExercises.map(e => (
                                                <option key={e.id} value={e.id}>{e.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div style={{ width: '90px' }}>
                                        <input
                                            type="number"
                                            className="input-premium"
                                            min="1"
                                            value={ex.sets}
                                            onChange={e => updateBuilderExercise(idx, 'sets', e.target.value)}
                                            placeholder="Series"
                                            title="Cantidad de Series"
                                        />
                                    </div>
                                    <div style={{ width: '90px' }}>
                                        <input
                                            type="number"
                                            className="input-premium"
                                            min="0"
                                            value={ex.reps}
                                            onChange={e => updateBuilderExercise(idx, 'reps', e.target.value)}
                                            placeholder="Reps"
                                            title="Repeticiones por Serie"
                                        />
                                    </div>
                                    <div style={{ width: '120px' }}>
                                        <input
                                            type="number"
                                            className="input-premium"
                                            min="0" step="10"
                                            value={ex.duration}
                                            onChange={e => updateBuilderExercise(idx, 'duration', e.target.value)}
                                            placeholder="Segs (0)"
                                            title="Duración en Segundos"
                                        />
                                    </div>
                                    <button type="button" onClick={() => removeExerciseFromBuilder(idx)} className="btn-danger btn-sm" style={{ padding: '12px 15px', borderRadius: '8px' }}>✕</button>
                                </div>
                            ))}
                        </div>

                        <div style={{ marginTop: '35px', paddingTop: '25px', borderTop: '2px solid #f1f5f9', display: 'flex', justifyContent: 'flex-end' }}>
                            <button type="submit" className="btn-primary" disabled={saving || !newRoutine.title} style={{ padding: '15px 30px', fontSize: '1.1rem', borderRadius: '8px', boxShadow: '0 4px 15px rgba(124, 58, 237, 0.3)' }}>
                                {saving ? 'Guardando...' : '✓ Guardar y Asignar'}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* ASSIGNED ROUTINES */}
            {Object.keys(groupedRoutines).length === 0 ? (
                <div style={{ padding: '40px', textAlign: 'center', background: '#fff', borderRadius: '16px', color: '#64748b', border: '2px dashed #cbd5e1', fontSize: '1.2rem' }}>
                    <p>Este usuario aún no tiene rutinas asignadas.</p>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '40px' }}>
                    {Object.entries(groupedRoutines).map(([month, items]) => (
                        <div key={month}>
                            <h3 className="premium-month-label">{month}</h3>
                            <div style={{ background: '#fff', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 4px 15px rgba(0,0,0,0.05)' }}>
                                <table className="data-table" style={{ margin: 0 }}>
                                    <thead>
                                        <tr>
                                            <th>ID</th>
                                            <th>Título de la Rutina</th>
                                            <th>Ejercicios</th>
                                            <th>Notas</th>
                                            <th style={{ textAlign: 'right' }}>Acciones</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {items.map(item => (
                                            <tr key={item.id}>
                                                <td style={{ fontWeight: 'bold', color: '#64748b' }}>#{item.routine?.id}</td>
                                                <td style={{ fontWeight: '600', color: '#1e293b' }}>{item.routine?.title || 'Desconocida'}</td>
                                                <td><span className="badge badge-user">{item.routine?.exercises?.length || 0}</span></td>
                                                <td style={{ color: '#64748b', fontSize: '0.9rem' }}>
                                                    {item.routine?.notes ? (item.routine.notes.length > 30 ? item.routine.notes.substring(0, 30) + '...' : item.routine.notes) : '-'}
                                                </td>
                                                <td style={{ textAlign: 'right' }}>
                                                    <button className="btn-primary btn-sm" onClick={() => navigate('/admin/routines')}>
                                                        Ver Detalles
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
