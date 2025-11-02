import React from 'react';

export type StatusIntent = 'default' | 'success' | 'warning' | 'danger';

export interface PanelMetric {
  label: string;
  value: string;
  intent?: StatusIntent;
  hint?: string;
}

export interface PanelSection {
  title: string;
  metrics: PanelMetric[];
}

export interface DeveloperModePanelProps {
  heading: string;
  description: string;
  sections: PanelSection[];
  footerNote?: string;
}

const intentColor: Record<StatusIntent, string> = {
  default: 'rgba(148, 163, 184, 0.7)',
  success: 'rgba(34, 197, 94, 0.85)',
  warning: 'rgba(234, 179, 8, 0.9)',
  danger: 'rgba(248, 113, 113, 0.9)',
};

const cardStyle: React.CSSProperties = {
  background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.96), rgba(17, 24, 39, 0.88))',
  border: '1px solid rgba(148, 163, 184, 0.2)',
  borderRadius: '18px',
  boxShadow: '0 24px 45px rgba(15, 23, 42, 0.45)',
  padding: '1.75rem',
  width: 'min(960px, 100%)',
  margin: '0 auto',
};

const headingStyle: React.CSSProperties = {
  fontFamily: '"Source Serif Pro", Georgia, serif',
  fontSize: '2.25rem',
  marginBottom: '0.75rem',
};

const sectionGridStyle: React.CSSProperties = {
  display: 'grid',
  gap: '1.5rem',
};

const sectionStyle: React.CSSProperties = {
  background: 'rgba(30, 41, 59, 0.55)',
  borderRadius: '14px',
  padding: '1.25rem',
  border: '1px solid rgba(71, 85, 105, 0.5)',
};

const sectionTitleStyle: React.CSSProperties = {
  fontSize: '1.1rem',
  letterSpacing: '0.04em',
  textTransform: 'uppercase',
  color: '#cbd5f5',
  marginBottom: '0.75rem',
};

const metricsListStyle: React.CSSProperties = {
  display: 'grid',
  gap: '0.6rem',
};

export const DeveloperModePanel: React.FC<DeveloperModePanelProps> = ({
  heading,
  description,
  sections,
  footerNote,
}) => {
  return (
    <div style={cardStyle}>
      <header>
        <h1 style={headingStyle}>{heading}</h1>
        <p
          style={{
            fontSize: '1rem',
            lineHeight: 1.6,
            color: 'rgba(226, 232, 240, 0.82)',
            marginBottom: '1.75rem',
          }}
        >
          {description}
        </p>
      </header>

      <div style={sectionGridStyle}>
        {sections.map((section) => (
          <section key={section.title} style={sectionStyle}>
            <h2 style={sectionTitleStyle}>{section.title}</h2>
            <div style={metricsListStyle}>
              {section.metrics.map((metric) => {
                const intent = metric.intent ?? 'default';
                return (
                  <div
                    key={`${section.title}-${metric.label}`}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'baseline',
                      gap: '0.75rem',
                    }}
                  >
                    <span style={{ color: 'rgba(148, 163, 184, 0.95)', fontSize: '0.95rem' }}>
                      {metric.label}
                    </span>
                    <span
                      style={{
                        fontWeight: 600,
                        fontSize: '1.05rem',
                        color: intentColor[intent],
                        textAlign: 'right',
                        flexShrink: 0,
                      }}
                    >
                      {metric.value}
                    </span>
                  </div>
                );
              })}
            </div>
          </section>
        ))}
      </div>

      {footerNote ? (
        <footer
          style={{
            marginTop: '2rem',
            paddingTop: '1.25rem',
            borderTop: '1px solid rgba(148, 163, 184, 0.25)',
            color: 'rgba(148, 163, 184, 0.85)',
            fontSize: '0.9rem',
          }}
        >
          {footerNote}
        </footer>
      ) : null}
    </div>
  );
};

DeveloperModePanel.displayName = 'DeveloperModePanel';
