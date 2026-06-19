/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';

interface AgemarLogoProps {
  className?: string;
  showCelebration?: boolean;
  size?: 'sm' | 'md' | 'lg';
  internal?: boolean;
}

export default function AgemarLogo({
  className = '',
  showCelebration = true,
  size = 'md',
  internal = false,
}: AgemarLogoProps) {
  // Brand colors
  const primaryGreen = '#007A38';
  const accentYellow = '#FBC400';

  // Dimension helpers
  const scale = size === 'sm' ? 0.6 : size === 'lg' ? 1.4 : 1;

  // Image loading safety checks
  const [imgFailed, setImgFailed] = React.useState(false);
  const imgSrc = internal ? '/imagens/Logo-interna.png' : '/imagens/Logo.png';

  const handleImgError = () => {
    setImgFailed(true);
  };

  return (
    <div className={`flex items-center select-none ${className}`} style={{ gap: `${16 * scale}px` }}>
      {/* Brand Left - Logo and Text */}
      <div className="flex flex-col items-center">
        {!imgFailed && imgSrc ? (
          <div className="flex flex-col items-center justify-center">
            <img
              src={imgSrc}
              alt="Logo Agemar"
              onError={handleImgError}
              className="object-contain"
              style={{
                height: `${70 * scale}px`,
                maxWidth: `${240 * scale}px`,
              }}
              referrerPolicy="no-referrer"
            />
          </div>
        ) : (
          <>
            {/* Yellow square with braided symbol */}
            <div
              className="relative flex items-center justify-center bg-amber-400 rounded-xl shadow-sm overflow-hidden"
              style={{
                width: `${75 * scale}px`,
                height: `${75 * scale}px`,
                backgroundColor: accentYellow,
              }}
            >
              {/* Braided icon approximation using robust geometric SVGs */}
              <svg
                viewBox="0 0 100 100"
                className="w-4/5 h-4/5"
                fill="none"
                stroke={primaryGreen}
                strokeWidth="10"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                {/* Horizontal weaves */}
                <path d="M 25 35 L 75 35" strokeWidth="12" />
                <path d="M 25 50 L 75 50" strokeWidth="12" />
                <path d="M 25 65 L 75 65" strokeWidth="12" />
                {/* Vertical weaves */}
                <path d="M 35 25 L 35 75" strokeWidth="12" />
                <path d="M 50 25 L 50 75" strokeWidth="12" />
                <path d="M 65 25 L 65 75" strokeWidth="12" />
                {/* Overlay grid connectors for braided interlaced appearance */}
                <circle cx="50" cy="50" r="14" fill={accentYellow} stroke="none" />
                <path d="M 38 50 L 62 50" strokeWidth="14" />
                <path d="M 50 38 L 50 62" strokeWidth="14" />
                {/* Middle cross detail */}
                <path d="M 45 45 L 55 55" stroke={accentYellow} strokeWidth="4" />
                <path d="M 55 45 L 45 55" stroke={accentYellow} strokeWidth="4" />
              </svg>
            </div>

            {/* Text bottom */}
            <div className="text-center mt-2 flex flex-col items-center">
              <span
                className="font-black tracking-wider leading-none text-emerald-950 font-sans"
                style={{
                  fontSize: `${18 * scale}px`,
                  color: primaryGreen,
                }}
              >
                AGEMAR
              </span>
              <span
                className="font-semibold tracking-[0.12em] uppercase leading-none text-emerald-800 font-sans mt-1"
                style={{
                  fontSize: `${6.5 * scale}px`,
                  color: primaryGreen,
                }}
              >
                INFRAESTRUTURA E LOGÍSTICA
              </span>
            </div>
          </>
        )}
      </div>

      {/* Middle Separator and Celebration Badge ("42 Anos") — só mostra se a imagem falhou */}
      {showCelebration && imgFailed && (
        <>
          {/* Vertical Separator */}
          <div
            className="h-20 bg-gray-300 self-center"
            style={{
              width: `${2 * scale}px`,
              height: `${85 * scale}px`,
            }}
          />

          {/* 42 Years Graphic */}
          <div className="flex flex-col items-center justify-center relative">
            <div className="flex items-end font-sans">
              <span
                className="font-black leading-none select-none tracking-tighter"
                style={{
                  fontSize: `${72 * scale}px`,
                  color: primaryGreen,
                  fontFamily: 'system-ui, sans-serif',
                }}
              >
                42
              </span>
            </div>

            {/* Wavy lines running through / below the text */}
            <div
              className="w-full relative flex flex-col items-center mt-[-10px]"
              style={{ width: `${80 * scale}px` }}
            >
              <svg
                viewBox="0 0 100 20"
                className="w-full fill-none stroke-current"
                style={{ color: primaryGreen }}
                strokeWidth="4"
              >
                <path d="M 0 12 Q 25 2, 50 12 T 100 12" strokeLinecap="round" />
                <path d="M 0 17 Q 25 7, 50 17 T 100 17" strokeWidth="2.5" strokeLinecap="round" />
              </svg>

              <span
                className="font-extrabold uppercase tracking-widest text-[#007A38] font-sans"
                style={{
                  fontSize: `${13 * scale}px`,
                  color: primaryGreen,
                  marginTop: `${2 * scale}px`,
                }}
              >
                ANOS
              </span>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
