import React from 'react';

interface CerberusIconProps extends React.SVGProps<SVGSVGElement> {
  className?: string;
  size?: number | string;
}

export function CerberusIcon({ className = 'size-5', size, ...props }: CerberusIconProps) {
  return (
    <svg
      viewBox='0 0 32 32'
      fill='currentColor'
      xmlns='http://www.w3.org/2000/svg'
      className={className}
      width={size}
      height={size}
      aria-hidden='true'
      {...props}
    >
      {/* Base mantle */}
      <path d='M7 26.5h18l-2.5-6H9.5L7 26.5z' />
      
      {/* Center Hound Head */}
      <path d='M16 3.5l-2.5 5 1.5 1.5v4.5l1 1.5 1-1.5v-4.5l1.5-1.5L16 3.5z' />
      <path d='M14 11.5l2 3 2-3h-4z' />
      <polygon points='14.5,3.5 13,8 15,8' />
      <polygon points='17.5,3.5 19,8 17,8' />
      <polygon points='15,15.5 17,15.5 16,19' />

      {/* Left Hound Head (Profile 40°) */}
      <path d='M10 7.5l-4.5 4 3.5 2 2-2.5-1-3.5z' />
      <path d='M5.5 11.5l-2.5 2.5 3.5 1.5 2-1.5-3-2.5z' />
      <polygon points='8.5,5.5 7,9 9,9.5' />
      <polygon points='9,16.5 11,20 14,18.5 12,14.5' />

      {/* Right Hound Head (Profile 40°) */}
      <path d='M22 7.5l4.5 4-3.5 2-2-2.5 1-3.5z' />
      <path d='M26.5 11.5l2.5 2.5-3.5 1.5-2-1.5 3-2.5z' />
      <polygon points='23.5,5.5 25,9 23,9.5' />
      <polygon points='23,16.5 21,20 18,18.5 20,14.5' />

      {/* Spiked Collar Studs */}
      <circle cx='11' cy='22.5' r='1' fill='var(--background, #fff)' />
      <circle cx='16' cy='22.5' r='1' fill='var(--background, #fff)' />
      <circle cx='21' cy='22.5' r='1' fill='var(--background, #fff)' />
    </svg>
  );
}
