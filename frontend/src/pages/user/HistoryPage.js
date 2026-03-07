import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/api';

function formatTime(secs) {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
}

export default function HistoryPage() {
    const [historyItems, setHistoryItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        api.get('/history')
            .then(res => {
                setHistoryItems(res.data);
            })
            .catch(() => setError('Error al cargar el historial'))
            .finally(() => setLoading(false));
    }, []);

    // Agrupar por mes y año
    const groupedByMonth = historyItems.reduce((acc, item) => {
        const d = new Date(item.completed_at);
        // Ej: "marzo 2026"
        const monthYear = d.toLocaleString('es-ES', { month: 'long', year: 'numeric' });
        if (!acc[monthYear]) acc[monthYear] = [];
        acc[monthYear].push(item);
        return acc;
    }, {});

    if (loading) return <div className="mobile-loading">Cargando...</div>;
    if (error) return <div className="error-msg" style={{ margin: 20 }}>{error}</div>;

    return (
        <div className="mobile-page">
            <div className="mobile-brand-header">
                <div className="brand-main">MI HISTORIAL</div>
                <div className="brand-date">Tus entrenamientos completados</div>
            </div>

            {Object.keys(groupedByMonth).length === 0 ? (
                <div className="mobile-empty">
                    <p>Aún no has completado ninguna rutina.</p>
                    <button
                        className="btn-primary"
                        style={{ marginTop: 20 }}
                        onClick={() => navigate('/my-routines')}
                    >
                        Ir a mis rutinas
                    </button>
                </div>
            ) : (
                <div style={{ marginTop: 20 }}>
                    {Object.entries(groupedByMonth).map(([monthYear, items]) => (
                        <div key={monthYear} style={{ marginBottom: 30 }}>
                            <div className="mobile-section-label" style={{ fontWeight: 'bold' }}>{monthYear}</div>
                            <div className="routine-cards-mobile">
                                {items.map(item => {
                                    const d = new Date(item.completed_at);
                                    const dateStr = d.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
                                    const exercises = item.routine_snapshot || [];
                                    const totalSetsCompleted = exercises.reduce((acc, ex) => acc + (ex.completed_sets || 0), 0);
                                    // Sum up all elapsed time for the snapshot, using the elapsed time from either the first exercise or max depending on how it was saved. We saved it per exercise, so just take the first one since it's the total elapsed time.
                                    const totalTime = exercises.length > 0 ? (exercises[0].time_elapsed_seconds || 0) : 0;

                                    return (
                                        <div key={item.id} className="routine-card-mobile" style={{ cursor: 'default' }}>
                                            <div className="routine-card-mobile-body">
                                                <div className="routine-card-icon" style={{ background: '#f5f3ff', color: '#7c3aed' }}>
                                                    ✓
                                                </div>
                                                <div className="routine-card-content">
                                                    <h2 style={{ fontSize: '16px' }}>Rutina Completada</h2>
                                                    <div className="routine-card-meta" style={{ marginTop: 6 }}>
                                                        <span className="meta-chip" style={{ background: '#eef2ff', color: '#4f46e5' }}>
                                                            📅 {dateStr}
                                                        </span>
                                                        <span className="meta-chip">
                                                            ⏱️ {formatTime(totalTime)}
                                                        </span>
                                                        <span className="meta-chip">
                                                            🔄 {totalSetsCompleted} series
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
