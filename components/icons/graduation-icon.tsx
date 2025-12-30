import type { SVGProps } from "react";

export function GraduationIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 32 28"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-hidden="true"
      {...props}
    >
      <path
        d="M1.5 9 16 2l14.5 7L16 16 1.5 9Z"
        stroke="#1E1E1E"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path
        d="M25 12v7.5c-3 2-6.333 3-9 3s-6-1-9-3V12"
        stroke="#1E1E1E"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M28 10.5v9" stroke="#1E1E1E" strokeWidth="2" strokeLinecap="round" />
      <circle cx="28" cy="21" r="2" fill="#1E1E1E" />
    </svg>
  );
}
