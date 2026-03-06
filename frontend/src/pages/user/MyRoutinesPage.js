import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/api';

export default function MyRoutinesPage() {
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/my-routines')
      .then(res => setAssignments(res.data))
      .catch(() => setError('Error al cargar rutinas'))
      .finally(() => setLoading(false));
  }, []);

  const isOverdue = due_date => due_date && new Date(due_date) < new Date();

  if (loading) return <div className="mobile-loading">Cargando rutinas...</div>;

  return (
    <div className="mobile-page">
      <div className="mobile-header">
        <h1>Mis Rutinas</h1>
      </div>

      {error && <p className="error-msg">{error}</p>}

      {assignments.length === 0 ? (
        <div className="mobile-empty">
          <p>No tenes rutinas asignadas todavia.</p>
        </div>
      ) : (
        <div className="routine-cards-mobile">
          {assignments.map(a => (
            <div key={a.id} className={`routine-card-mobile ${isOverdue(a.due_date) ? 'overdue' : ''}`}>
              <div className="routine-card-mobile-body">
                <h2>{a.routine_title}</h2>
                {a.routine_notes && <p className="mobile-notes">{a.routine_notes}</p>}

                <div className="routine-card-meta">
                  <span>{a.exercises?.length || 0} ejercicios</span>
                  {a.due_date && (
                    <span className={isOverdue(a.due_date) ? 'text-danger' : ''}>
                      Vence {new Date(a.due_date).toLocaleDateString()}
                      {isOverdue(a.due_date) && ' · Vencido'}
                    </span>
                  )}
                </div>

                {a.exercises?.length > 0 && (
                  <div className="exercise-preview">
                    {a.exercises.slice(0, 3).map(ex => (
                      <span key={ex.id} className="exercise-chip">
                        {ex.exercise_name}
                        {ex.sets && ex.reps ? ` · ${ex.sets}×${ex.reps}` : ''}
                      </span>
                    ))}
                    {a.exercises.length > 3 && (
                      <span className="exercise-chip chip-more">+{a.exercises.length - 3}</span>
                    )}
                  </div>
                )}
              </div>

              <button
                className="btn-start"
                onClick={() => navigate(`/workout/${a.id}`)}
                disabled={!a.exercises?.length}
              >
                {a.exercises?.length ? 'Iniciar' : 'Sin ejercicios'}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
