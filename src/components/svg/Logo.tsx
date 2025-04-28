
import React from 'react';

interface LogoProps {
  className?: string;
}

const Logo: React.FC<LogoProps> = ({ className = '' }) => {
  return (
    <svg 
      className={className} 
      width="32" 
      height="32" 
      viewBox="0 0 32 32" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
    >
      <path 
        d="M16 28C22.6274 28 28 22.6274 28 16C28 9.37258 22.6274 4 16 4C9.37258 4 4 9.37258 4 16C4 22.6274 9.37258 28 16 28Z" 
        fill="#84C4FF" 
        fillOpacity="0.2" 
      />
      <path 
        d="M16 22C19.866 22 23 18.866 23 15C23 11.134 19.866 8 16 8C12.134 8 9 11.134 9 15C9 18.866 12.134 22 16 22Z" 
        fill="#84C4FF" 
        fillOpacity="0.6" 
      />
      <path 
        d="M15.9132 3.01786C15.9704 3.00596 16.0296 3.00596 16.0868 3.01786L27.0868 5.51786C27.1749 5.53577 27.25 5.61093 27.2679 5.69907C27.7528 7.64475 28 9.6734 28 11.75C28 21.4158 23.0068 29.4478 16 31.5858C8.99316 29.4478 4 21.4158 4 11.75C4 9.6734 4.24717 7.64475 4.73205 5.69907C4.75002 5.61093 4.8251 5.53577 4.91323 5.51786L15.9132 3.01786Z" 
        stroke="#84C4FF" 
        strokeWidth="2" 
      />
      <path 
        d="M16 15C16 10.5 18 9 18 9C18 9 16 10 16 7C16 10 14 9 14 9C14 9 16 10.5 16 15Z" 
        fill="#84C4FF" 
      />
    </svg>
  );
};

export default Logo;
