import React from 'react';

// SVG-based Islamic pattern border component
const IslamicBorder = ({ color = "#0099cc", accentColor = "#ffda44", pageNumber }) => {
  return (
    <div className="islamic-border-container">
      {/* Top decorative element with page number */}
      <div className="page-number-container">
        <svg width="100%" height="40" viewBox="0 0 300 40" xmlns="http://www.w3.org/2000/svg">
          <path d="M150,5 L290,5 Q295,5 295,10 L295,35 Q295,40 290,40 L10,40 Q5,40 5,35 L5,10 Q5,5 10,5 L150,5 Z" 
            fill="none" 
            stroke={color} 
            strokeWidth="2" />
          <circle cx="150" cy="20" r="18" fill={accentColor} stroke="#fff" strokeWidth="2" />
          <text x="150" y="25" textAnchor="middle" fontSize="14" fontWeight="bold" fill="#333">{pageNumber}</text>
        </svg>
      </div>
      
      {/* Main border */}
      <svg className="border-pattern" width="100%" height="100%" viewBox="0 0 400 600" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
        {/* Border frame */}
        <rect x="10" y="10" width="380" height="580" fill="none" stroke={color} strokeWidth="3" rx="3" />
        
        {/* Corner ornaments */}
        <g className="corner top-right">
          <path d="M370,10 Q380,10 380,20 L380,50 C360,40 350,20 370,10 Z" fill={color} />
          <path d="M370,15 Q375,15 375,20 L375,40 C362,35 355,20 370,15 Z" fill="white" fillOpacity="0.3" />
        </g>
        
        <g className="corner top-left">
          <path d="M30,10 Q20,10 20,20 L20,50 C40,40 50,20 30,10 Z" fill={color} />
          <path d="M30,15 Q25,15 25,20 L25,40 C38,35 45,20 30,15 Z" fill="white" fillOpacity="0.3" />
        </g>
        
        <g className="corner bottom-right">
          <path d="M370,590 Q380,590 380,580 L380,550 C360,560 350,580 370,590 Z" fill={color} />
          <path d="M370,585 Q375,585 375,580 L375,560 C362,565 355,580 370,585 Z" fill="white" fillOpacity="0.3" />
        </g>
        
        <g className="corner bottom-left">
          <path d="M30,590 Q20,590 20,580 L20,550 C40,560 50,580 30,590 Z" fill={color} />
          <path d="M30,585 Q25,585 25,580 L25,560 C38,565 45,580 30,585 Z" fill="white" fillOpacity="0.3" />
        </g>
        
        {/* Decorative patterns */}
        <g className="pattern-top">
          {[...Array(19)].map((_, i) => (
            <path 
              key={`top-pattern-${i}`} 
              d="M0,0 L8,5 L0,10 Z" 
              fill={color} 
              transform={`translate(${30 + i*18}, 10) rotate(90)`} 
            />
          ))}
        </g>
        
        <g className="pattern-bottom">
          {[...Array(19)].map((_, i) => (
            <path 
              key={`bottom-pattern-${i}`} 
              d="M0,0 L8,5 L0,10 Z" 
              fill={color} 
              transform={`translate(${30 + i*18}, 590) rotate(-90)`} 
            />
          ))}
        </g>
        
        <g className="pattern-left">
          {[...Array(29)].map((_, i) => (
            <path 
              key={`left-pattern-${i}`} 
              d="M0,0 L8,5 L0,10 Z" 
              fill={color} 
              transform={`translate(10, ${30 + i*19}) rotate(0)`} 
            />
          ))}
        </g>
        
        <g className="pattern-right">
          {[...Array(29)].map((_, i) => (
            <path 
              key={`right-pattern-${i}`} 
              d="M0,0 L8,5 L0,10 Z" 
              fill={color} 
              transform={`translate(390, ${30 + i*19}) rotate(180)`} 
            />
          ))}
        </g>
      </svg>
    </div>
  );
};

export default IslamicBorder; 