import React from "react";

type PanelProps = {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  className?: string;
  bodyClassName?: string;
};

export function Panel({ title, subtitle, children, className, bodyClassName }: PanelProps) {
  return (
    <div
      style={{
        backgroundColor: '#F0EAD6',
        border: '4px solid #2d3436',
        borderRadius: '0.75rem',
        boxShadow: '8px 8px 0px rgba(0,0,0,0.3)',
        width: '100%',
        overflow: 'hidden',
      }}
      className={className ?? ""}
    >
      {/* Header with military theme styling */}
      <div
        style={{
          padding: '2rem 2rem 1rem 2rem',
          backgroundColor: '#4a5f3a',
          borderBottom: '4px solid #2d3436',
          position: 'relative',
        }}
      >
        {/* Camouflage pattern overlay */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            opacity: 0.1,
            backgroundImage: 'radial-gradient(circle at 20% 50%, transparent 20%, #2d3436 21%, #2d3436 34%, transparent 35%), radial-gradient(circle at 60% 30%, transparent 20%, #2d3436 21%, #2d3436 34%, transparent 35%)',
            backgroundSize: '80px 80px',
          }}
        />
        <div style={{ position: 'relative', zIndex: 10, textAlign: 'center' }}>
          <h2
            style={{
              fontSize: '1.875rem',
              letterSpacing: '0.05em',
              color: '#F0EAD6',
              textShadow: '3px 3px 0px rgba(0,0,0,0.3)',
              margin: 0,
            }}
          >
            {title}
          </h2>
          {subtitle && (
            <p
              style={{
                marginTop: '0.5rem',
                fontSize: '1.125rem',
                color: 'rgba(240, 234, 214, 0.9)',
                margin: '0.5rem 0 0 0',
              }}
            >
              {subtitle}
            </p>
          )}
        </div>
      </div>

      <div
        style={{ padding: '1.5rem 2rem 2rem 2rem' }}
        className={bodyClassName ?? ""}
      >
        {children}
      </div>
    </div>
  );
}
