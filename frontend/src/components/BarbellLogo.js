import React from 'react';

/**
 * Barbell logo — usa el PNG del logo (fondo transparente).
 * El PNG debe estar en /public/barbell.png
 * Props: size (number, altura en px, default 44)
 */
export default function BarbellLogo({ size = 44 }) {
  return (
    <img
      src="/barbell.svg"
      alt="Logo mancuerna"
      style={{ height: size, width: 'auto', display: 'block' }}
    />
  );
}
