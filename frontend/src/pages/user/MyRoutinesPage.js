import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/api';
import BarbellLogo from '../../components/BarbellLogo';

const PALETTE = ['#7c3aed', '#a855f7', '#6d28d9', '#8b5cf6', '#4f46e5', '#00bcd4', '#f59e0b'];
const getColor = (id) => PALETTE[id % PALETTE.length];

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

  const today = new Date().toLocaleDateString('es-AR', {
    weekday: 'long', day: 'numeric', month: 'long'
  }).toUpperCase();

  if (loading) return <div className="mobile-loading">CARGANDO...</div>;

  return (
    <div style={{
      fontFamily: "'Bebas Neue', 'Impact', sans-serif",
      background: '#f8f7ff',
      minHeight: '100vh',
      color: '#1a1a2e',
      maxWidth: 480,
      margin: '0 auto',
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Rajdhani:wght@400;600;700&display=swap');
        .rou-card { background:#fff; border:1px solid #e8e4f0; border-radius:12px; box-shadow:0 1px 6px rgba(124,58,237,0.06); overflow:hidden; cursor:pointer; transition:box-shadow 0.2s; }
        .rou-card:hover { box-shadow:0 4px 16px rgba(124,58,237,0.14); }
        .rou-play-btn { width:36px; height:36px; border-radius:8px; display:flex; align-items:center; justify-content:center; font-size:16px; flex-shrink:0; color:#fff; border:none; cursor:pointer; padding-left:2px; }
      `}</style>

      {/* Brand header */}
      <div style={{ padding:'20px 20px 16px', background:'#fff', borderBottom:'1px solid #ede9fe', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <div>
          <div style={{ lineHeight:1 }}>
            <div style={{ fontSize:13, letterSpacing:5, color:'#a855f7', fontFamily:'Bebas Neue' }}>TU MÉTODO</div>
            <div style={{ fontSize:26, letterSpacing:4, color:'#7c3aed', fontFamily:'Bebas Neue' }}>PROGRESIVO</div>
          </div>
          <div style={{ fontFamily:'Rajdhani', fontSize:12, color:'#aaa', letterSpacing:1, marginTop:4 }}>{today}</div>
        </div>
        <BarbellLogo size={40} color="#7c3aed" />
      </div>

      {error && (
        <div style={{ padding:'12px 20px' }}>
          <p className="error-msg">{error}</p>
        </div>
      )}

      {assignments.length === 0 && !error ? (
        <div style={{ textAlign:'center', padding:'60px 20px', color:'#aaa', fontFamily:'Rajdhani', fontSize:'1rem', letterSpacing:1 }}>
          No tenes rutinas asignadas todavía.
        </div>
      ) : (
        <>
          <div style={{ fontFamily:'Rajdhani', fontSize:12, color:'#999', letterSpacing:2, margin:'20px 20px 12px' }}>
            INICIO RÁPIDO
          </div>
          <div style={{ display:'flex', flexDirection:'column', gap:10, padding:'0 20px 32px' }}>
            {assignments.map(a => {
              const color = getColor(a.id);
              const overdue = isOverdue(a.due_date);
              return (
                <div
                  key={a.id}
                  className="rou-card"
                  style={overdue ? { borderLeft:`4px solid #dc3545` } : {}}
                  onClick={() => navigate(`/workout/${a.id}`)}
                >
                  <div style={{ padding:'16px', display:'flex', alignItems:'center', gap:14 }}>

                    {/* Icon */}
                    <div style={{
                      width:44, height:44, borderRadius:10,
                      background: color + '22',
                      border: `2px solid ${color}`,
                      display:'flex', alignItems:'center', justifyContent:'center',
                      fontSize:22, flexShrink:0,
                    }}>
                      🏋️
                    </div>

                    {/* Content */}
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ fontSize:18, letterSpacing:1, fontFamily:'Bebas Neue', lineHeight:1.1, marginBottom:4 }}>
                        {a.routine_title}
                      </div>
                      <div style={{ fontFamily:'Rajdhani', fontSize:12, color:'#999', display:'flex', gap:6, alignItems:'center', flexWrap:'wrap', marginBottom: a.due_date || a.routine_notes ? 3 : 0 }}>
                        <span style={{ background: color + '22', color, padding:'2px 8px', borderRadius:10, fontSize:11 }}>
                          🏋️ {a.exercises?.length || 0} ejercicios
                        </span>
                      </div>
                      {(a.due_date || a.routine_notes) && (
                        <div style={{ fontFamily:'Rajdhani', fontSize:11, color:'#aaa', marginTop:2 }}>
                          {a.routine_notes
                            ? a.routine_notes
                            : overdue
                              ? `Vencido · ${new Date(a.due_date).toLocaleDateString()}`
                              : `Vence ${new Date(a.due_date).toLocaleDateString()}`}
                        </div>
                      )}
                    </div>

                    {/* Play button */}
                    <button
                      className="rou-play-btn"
                      style={{ background: a.exercises?.length ? color : '#ccc' }}
                      onClick={e => { e.stopPropagation(); navigate(`/workout/${a.id}`); }}
                      disabled={!a.exercises?.length}
                    >
                      ▶
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
