import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../api/api';

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
  const [videoUrl, setVideoUrl] = useState(null); // URL del modal de video

  const restTimerRef = useRef(null);
  const elapsedTimerRef = useRef(null);
  const startTimeRef = useRef(null);

  useEffect(() => {
    api.get('/my-routines')
      .then(res => {
        const found = res.data.find(a => a.id === Number(id));
        if (!found) { setError('Rutina no encontrada'); return; }
        setRoutineTitle(found.routine_title);
        const exs = found.exercises || [];
        setExercises(exs);
        setDoneSets(new Array(exs.length).fill(0));
        startTimeRef.current = Date.now();
        elapsedTimerRef.current = setInterval(() => {
          setElapsed(Math.floor((Date.now() - startTimeRef.current) / 1000));
        }, 1000);
      })
      .catch(() => setError('Error al cargar rutina'))
      .finally(() => setLoading(false));

    return () => {
      clearInterval(elapsedTimerRef.current);
      clearTimeout(restTimerRef.current);
    };
  }, [id]);

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
    if (allDone) {
      clearInterval(elapsedTimerRef.current);
      setIsDone(true);
    }
  }, [exercises, doneSets, restState]);

  const skipRest = () => {
    clearTimeout(restTimerRef.current);
    setRestState(null);
  };

  const completedCount = exercises.filter((ex, i) => (doneSets[i] || 0) >= (ex.sets || 1)).length;
  const progress = exercises.length > 0 ? Math.round((completedCount / exercises.length) * 100) : 0;

  if (loading) return <div className="workout-loading">Cargando...</div>;
  if (error) return <div className="workout-loading">{error}</div>;
  if (exercises.length === 0) return (
    <div className="workout-loading">
      <p>Esta rutina no tiene ejercicios.</p>
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
        <button className="btn-primary btn-full" onClick={() => navigate('/my-routines')}>
          Volver a mis rutinas
        </button>
      </div>
    );
  }

  return (
    <div className="workout-screen">
      <div className="workout-topbar">
        <button className="workout-back" onClick={() => navigate('/my-routines')}>✕</button>
        <span className="workout-title">{routineTitle}</span>
        <span className="workout-elapsed">{formatTime(elapsed)}</span>
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
