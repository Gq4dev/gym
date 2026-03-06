import React from 'react';

/**
 * Barbell logo SVG — estilo outline, fiel al logo de Cecilia Braunbeck.
 * Props: size (number, default 72), color (string, default '#7c3aed')
 */
export default function BarbellLogo({ size = 72, color = '#7c3aed' }) {
  const h = size;
  const w = size * 1.9;
  return (
    <svg
      width={w}
      height={h}
      viewBox="0 0 95 50"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* ── Left outer plate ── */}
      <rect x="1"  y="1"  width="13" height="48" rx="6.5"
        stroke={color} strokeWidth="2.5" fill="none"/>
      {/* ── Left inner plate ── */}
      <rect x="15" y="9"  width="7"  height="32" rx="3.5"
        stroke={color} strokeWidth="2" fill="none"/>
      {/* ── Left collar ── */}
      <rect x="23" y="16" width="5"  height="18" rx="2.5"
        fill={color}/>

      {/* ── Bar ── */}
      <rect x="28" y="22" width="39" height="6" rx="3"
        fill={color}/>

      {/* ── Right collar ── */}
      <rect x="67" y="16" width="5"  height="18" rx="2.5"
        fill={color}/>
      {/* ── Right inner plate ── */}
      <rect x="73" y="9"  width="7"  height="32" rx="3.5"
        stroke={color} strokeWidth="2" fill="none"/>
      {/* ── Right outer plate ── */}
      <rect x="81" y="1"  width="13" height="48" rx="6.5"
        stroke={color} strokeWidth="2.5" fill="none"/>
    </svg>
  );
}
