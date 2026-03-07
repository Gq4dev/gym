import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../api/api';
import Swal from 'sweetalert2';

function formatTime(secs) {
  const m = Math.floor(secs / 60).toString().padStart(2, '0');
  const s = (secs % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

function toEmbedUrl(url) {
  if (!url) return null;
  // youtu.be/ID
  const short = url.match(/youtu\.be\/([a-zA-Z0-9_-]+)/);
  if (short) return `https://www.youtube.com/embed/${short[1]}`;
  // youtube.com/watch?v=ID
  const watch = url.match(/[?&]v=([a-zA-Z0-9_-]+)/);
  if (watch) return `https://www.youtube.com/embed/${watch[1]}`;
  // already an embed or other URL — use as-is
  return url;
}



export default function WorkoutPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [exercises, setExercises] = useState([]);
  const [routineTitle, setRoutineTitle] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [doneSets, setDoneSets] = useState([]);
  const [restState, setRestState] = useState(null);
  const [elapsed, setElapsed] = useState(0);
  const [isDone, setIsDone] = useState(false);
  const [videoUrl, setVideoUrl] = useState(null);

  const restTimerRef = useRef(null);
  const elapsedTimerRef = useRef(null);
  const startTimeRef = useRef(null);
  const initialLoadDone = useRef(false);

  // Clave de guardado para esta rutina en particular
  const storageKey = `gym_routine_progress_${id}`;

  useEffect(() => {
    api.get('/my-routines')
      .then(res => {
        const found = res.data.find(a => a.id === Number(id));
        if (!found) { setError('Rutina no encontrada'); return; }

        setRoutineTitle(found.routine_title);
        const exs = found.exercises || [];
        setExercises(exs);

        // Recuperar progreso si existe
        let initialSets = new Array(exs.length).fill(0);
        let initialElapsed = 0;
        let initialIsDone = false;
        const savedProgress = localStorage.getItem(storageKey);

        if (savedProgress) {
          try {
            const parsed = JSON.parse(savedProgress);
            if (parsed.doneSets?.length === exs.length) {
              initialSets = parsed.doneSets;
              initialElapsed = parsed.elapsed || 0;
              initialIsDone = parsed.isDone || false;
            }
          } catch (e) {
            console.error('Error parseando progreso guardado', e);
          }
        }

        setDoneSets(initialSets);
        setElapsed(initialElapsed);
        setIsDone(initialIsDone);

        // Guardar referencia de tiempo para el reloj contando el recuperado
        if (!initialIsDone) {
          startTimeRef.current = Date.now() - (initialElapsed * 1000);
          elapsedTimerRef.current = setInterval(() => {
            setElapsed(Math.floor((Date.now() - startTimeRef.current) / 1000));
          }, 1000);
        }

        initialLoadDone.current = true;
      })
      .catch(() => setError('Error al cargar rutina'))
      .finally(() => setLoading(false));

    return () => {
      clearInterval(elapsedTimerRef.current);
      clearTimeout(restTimerRef.current);
    };
  }, [id, storageKey]);

  // Guardar estado cada vez que se modifique después del load inicial
  useEffect(() => {
    if (!initialLoadDone.current || exercises.length === 0) return;

    localStorage.setItem(storageKey, JSON.stringify({
      doneSets,
      elapsed,
      isDone
    }));
  }, [doneSets, elapsed, isDone, exercises.length, storageKey]);

  useEffect(() => {
    if (!restState || restState.timeLeft <= 0) return;
    restTimerRef.current = setTimeout(() => {
      setRestState(prev => prev ? { ...prev, timeLeft: prev.timeLeft - 1 } : null);
    }, 1000);
    return () => clearTimeout(restTimerRef.current);
  }, [restState]);

  const handleSetTap = useCallback((exIdx) => {
    if (restState?.exIdx === exIdx) return;
    const ex = exercises[exIdx];
    const totalSets = ex?.sets || 1;
    const current = doneSets[exIdx] || 0;
    if (current >= totalSets) return;

    const newDone = current + 1;
    const next = [...doneSets];
    next[exIdx] = newDone;
    setDoneSets(next);

    if (newDone < totalSets && (ex?.duration || 0) > 0) {
      setRestState({ exIdx, timeLeft: ex.duration });
    }

    const allDone = exercises.every((e, i) => next[i] >= (e.sets || 1));
    if (allDone && !isDone) {
      clearInterval(elapsedTimerRef.current);
      setIsDone(true);
      setRestState(null); // Quitar descansos pendientes

      // Save to history
      const exerciseDataSnapshot = exercises.map((e, i) => ({
        ...e,
        completed_sets: next[i],
        time_elapsed_seconds: elapsed
      }));

      api.post('/history', {
        routine_id: id,
        exercise_data: exerciseDataSnapshot
      }).catch(err => console.error('Error saving workout to history', err));

      Swal.fire({
        title: '¡Perfecto!',
        text: '¡Muy buen entrenamiento!',
        iconHtml: '💪', /* Cambiado a un emoji de bíceps */
        customClass: {
          icon: 'no-border-icon' /* Puedes añadir una clase si quieres quitar el borde estándar del iconHtml más adelante */
        },
        confirmButtonText: 'Genial',
        confirmButtonColor: '#7c3aed',
        background: '#fff',
        color: '#1a1a2e',
        timer: 3000,
        timerProgressBar: true
      });
    }
  }, [exercises, doneSets, restState, isDone, elapsed, id]);

  const skipRest = () => {
    clearTimeout(restTimerRef.current);
    setRestState(null);
  };

  const handleRestart = () => {
    if (window.confirm('¿Estás seguro de que quieres reiniciar toda la rutina? Perderás el progreso actual.')) {
      setDoneSets(new Array(exercises.length).fill(0));
      setElapsed(0);
      setIsDone(false);
      setRestState(null);
      localStorage.removeItem(storageKey);

      clearInterval(elapsedTimerRef.current);
      startTimeRef.current = Date.now();
      elapsedTimerRef.current = setInterval(() => {
        setElapsed(Math.floor((Date.now() - startTimeRef.current) / 1000));
      }, 1000);
    }
  };

  const completedCount = exercises.filter((ex, i) => (doneSets[i] || 0) >= (ex.sets || 1)).length;
  const progress = exercises.length > 0 ? Math.round((completedCount / exercises.length) * 100) : 0;

  if (loading) return <div className="workout-loading">CARGANDO...</div>;
  if (error) return <div className="workout-loading">{error}</div>;
  if (exercises.length === 0) return (
    <div className="workout-loading">
      <p style={{ fontFamily: 'Rajdhani, sans-serif', color: '#999', letterSpacing: 1 }}>Esta rutina no tiene ejercicios.</p>
      <button className="btn-primary" onClick={() => navigate('/my-routines')}>Volver</button>
    </div>
  );

  if (isDone) {
    return (
      <div className="workout-done">
        <div className="workout-done-icon">✓</div>
        <h2>Rutina completada</h2>
        <p>{routineTitle}</p>
        <p className="workout-done-time">{formatTime(elapsed)}</p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', width: '100%' }}>
          <button className="btn-primary btn-full" onClick={() => navigate('/my-routines')}>
            Volver a mis rutinas
          </button>
          <button
            onClick={handleRestart}
            style={{
              background: 'transparent', border: '1px solid #ddd8f0', color: '#7c3aed',
              padding: '12px', borderRadius: '12px', fontFamily: '"Bebas Neue", sans-serif',
              fontSize: '1.2rem', letterSpacing: '2px', cursor: 'pointer'
            }}
          >
            REINICIAR RUTINA
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="workout-screen">
      {/* Header estilo documento */}
      <div className="workout-header">
        <div className="workout-header-top">
          <button className="workout-back" onClick={() => navigate('/my-routines')}>← VOLVER</button>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {completedCount > 0 && (
              <button
                className="workout-back"
                onClick={handleRestart}
                style={{ color: '#dc3545', borderColor: '#f8d7da', background: '#fff' }}
              >
                ⟲ REINICIAR
              </button>
            )}
            <div className="workout-elapsed-pill">{formatTime(elapsed)}</div>
          </div>
        </div>
        <div className="workout-header-body">
          <div className="workout-header-info">
            <div className="workout-title">{routineTitle}</div>
            <div className="workout-header-meta">
              <span className="workout-header-chip">🏋️ {exercises.length} ejercicios</span>
            </div>
          </div>
          <div className="workout-header-emoji">🏋️</div>
        </div>
      </div>

      <div className="workout-progress-header">
        <div className="workout-progress-bar">
          <div className="workout-progress-fill" style={{ width: `${progress}%` }} />
        </div>
        <span className="workout-progress-pct">{progress}%</span>
      </div>

      <div className="workout-exercise-list">
        {exercises.map((ex, i) => {
          const totalSets = ex.sets || 1;
          const done_i = doneSets[i] || 0;
          const isComplete = done_i >= totalSets;
          const isResting = restState?.exIdx === i;
          const restLeft = isResting ? restState.timeLeft : 0;

          return (
            <div key={i} className={`wk-ex-card ${isComplete ? 'wk-ex-complete' : ''}`}>
              <div className="wk-ex-header">
                <div className="wk-ex-info">
                  <span className="wk-ex-name">{ex.exercise_name}</span>
                  {ex.category_name && <span className="wk-ex-cat">{ex.category_name}</span>}
                </div>
                <div className="wk-ex-actions">
                  {ex.video_url && (
                    <button
                      className="wk-video-btn"
                      title="Ver video"
                      onClick={() => setVideoUrl(ex.video_url)}
                    >
                      ▶
                    </button>
                  )}
                  {isComplete && <span className="wk-ex-check">✓</span>}
                </div>
              </div>

              {ex.reps && (
                <p className="wk-ex-reps">{ex.reps} reps por serie</p>
              )}

              <div className="rep-circles">
                {Array.from({ length: totalSets }, (_, si) => {
                  let state = 'pending';
                  if (si < done_i) state = 'done';
                  else if (si === done_i && !isResting) state = 'next';
                  return (
                    <button
                      key={si}
                      className={`rep-circle rep-${state}`}
                      onClick={state === 'next' ? () => handleSetTap(i) : undefined}
                      disabled={state !== 'next'}
                    >
                      {state === 'done' ? '✓' : si + 1}
                    </button>
                  );
                })}
              </div>

              {isResting && (
                <div className="wk-rest-inline">
                  <span className="wk-rest-label">Descanso</span>
                  <span className="wk-rest-time">{restLeft > 0 ? `${restLeft}s` : '¡Listo!'}</span>
                  <button className="wk-rest-skip" onClick={skipRest}>
                    {restLeft > 0 ? 'Saltar' : 'Continuar'}
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {videoUrl && (
        <div className="video-modal-overlay" onClick={() => setVideoUrl(null)}>
          <div className="video-modal" onClick={e => e.stopPropagation()}>
            <button className="video-modal-close" onClick={() => setVideoUrl(null)}>✕</button>
            <div className="video-modal-player">
              <iframe
                src={toEmbedUrl(videoUrl)}
                title="Video ejercicio"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
