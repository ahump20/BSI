/**
 * TutorialOverlay - Step-based onboarding for new players
 *
 * Guides players through:
 * 1. Camera controls (pan, zoom, rotate)
 * 2. Building selection
 * 3. Building placement
 * 4. Agent interaction
 * 5. Event log understanding
 *
 * Shows on first visit, can be dismissed and reopened from settings.
 */

import React, { useState, useCallback } from 'react';

export interface TutorialStep {
  id: string;
  title: string;
  description: string;
  hint: string;
  highlightArea?: 'viewport' | 'buildings' | 'agents' | 'minimap' | 'eventlog';
  action?: string;
}

const TUTORIAL_STEPS: TutorialStep[] = [
  {
    id: 'welcome',
    title: 'Welcome to BlazeCraft!',
    description: 'This is an agent-driven city builder where Claude Code agents build and upgrade structures based on real coding activity.',
    hint: 'Press Next to continue the tour.',
    highlightArea: 'viewport',
  },
  {
    id: 'camera',
    title: 'Camera Controls',
    description: 'Use WASD or arrow keys to pan the camera. Scroll to zoom in/out. Press Q/E to rotate the view 90 degrees.',
    hint: 'Try panning and zooming around the island!',
    highlightArea: 'viewport',
    action: 'Try moving the camera',
  },
  {
    id: 'buildings',
    title: 'Building Selection',
    description: 'Click on a building card (1-6 keys) to enter placement mode. Each building type represents a different code domain.',
    hint: 'The Town Hall is your central hub. Workshop handles code, Market manages UI.',
    highlightArea: 'buildings',
    action: 'Press 1-6 to select a building',
  },
  {
    id: 'placement',
    title: 'Building Placement',
    description: 'In placement mode, click on valid green tiles to place buildings. Press ESC to cancel.',
    hint: 'Buildings upgrade automatically as agents complete tasks!',
    highlightArea: 'viewport',
  },
  {
    id: 'agents',
    title: 'Agent Workers',
    description: 'Agents appear as colored circles and move between buildings. Click an agent to see their details.',
    hint: 'Green agents are working, yellow are idle.',
    highlightArea: 'agents',
  },
  {
    id: 'minimap',
    title: 'Minimap Navigation',
    description: 'Click anywhere on the minimap to quickly navigate. The orange rectangle shows your current view.',
    hint: 'Use the minimap for quick overview of your city!',
    highlightArea: 'minimap',
  },
  {
    id: 'events',
    title: 'Event Log',
    description: 'The right panel shows real-time events: agent actions, building upgrades, and system messages.',
    hint: 'Watch for task completions - they trigger building upgrades!',
    highlightArea: 'eventlog',
  },
  {
    id: 'complete',
    title: 'Ready to Build!',
    description: 'You now know the basics. Press ? anytime to see keyboard shortcuts, F3 for performance stats.',
    hint: 'Enjoy building your agent city!',
  },
];

interface TutorialOverlayProps {
  visible: boolean;
  onClose: () => void;
  onComplete: () => void;
}

const styles = {
  overlay: {
    position: 'fixed' as const,
    inset: 0,
    background: 'rgba(0, 0, 0, 0.75)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2000,
    animation: 'fadeIn 0.3s ease',
  },
  modal: {
    background: 'linear-gradient(145deg, #1A1A1A 0%, #0D0D0D 100%)',
    border: '2px solid #BF5700',
    borderRadius: '12px',
    padding: '2rem',
    maxWidth: '500px',
    width: '90%',
    boxShadow: '0 16px 64px rgba(191, 87, 0, 0.3), 0 8px 32px rgba(0, 0, 0, 0.5)',
    position: 'relative' as const,
  },
  stepIndicator: {
    display: 'flex',
    justifyContent: 'center',
    gap: '0.5rem',
    marginBottom: '1.5rem',
  },
  stepDot: {
    width: '10px',
    height: '10px',
    borderRadius: '50%',
    background: '#333',
    transition: 'all 0.3s ease',
  },
  stepDotActive: {
    background: '#BF5700',
    transform: 'scale(1.2)',
  },
  stepDotComplete: {
    background: '#2ECC71',
  },
  title: {
    fontSize: '1.4rem',
    fontWeight: 700,
    color: '#F5F5DC',
    marginBottom: '1rem',
    textAlign: 'center' as const,
  },
  description: {
    fontSize: '0.95rem',
    color: '#AAA',
    lineHeight: 1.6,
    marginBottom: '1rem',
    textAlign: 'center' as const,
  },
  hint: {
    fontSize: '0.8rem',
    color: '#BF5700',
    fontStyle: 'italic' as const,
    textAlign: 'center' as const,
    marginBottom: '1.5rem',
    padding: '0.75rem',
    background: 'rgba(191, 87, 0, 0.1)',
    borderRadius: '6px',
    border: '1px solid rgba(191, 87, 0, 0.3)',
  },
  action: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.5rem',
    padding: '0.5rem',
    background: 'rgba(46, 204, 113, 0.15)',
    borderRadius: '4px',
    marginBottom: '1.5rem',
    fontSize: '0.85rem',
    color: '#2ECC71',
  },
  buttons: {
    display: 'flex',
    justifyContent: 'space-between',
    gap: '1rem',
  },
  button: {
    flex: 1,
    padding: '0.75rem 1.5rem',
    border: 'none',
    borderRadius: '6px',
    fontSize: '0.9rem',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
  buttonPrimary: {
    background: 'linear-gradient(135deg, #BF5700, #FF6B35)',
    color: '#FFF',
  },
  buttonSecondary: {
    background: '#333',
    color: '#AAA',
    border: '1px solid #444',
  },
  closeButton: {
    position: 'absolute' as const,
    top: '1rem',
    right: '1rem',
    background: 'transparent',
    border: 'none',
    color: '#666',
    fontSize: '1.5rem',
    cursor: 'pointer',
    lineHeight: 1,
    padding: '0.25rem',
  },
  highlightBadge: {
    display: 'inline-block',
    padding: '0.25rem 0.5rem',
    background: 'rgba(191, 87, 0, 0.2)',
    borderRadius: '4px',
    fontSize: '0.7rem',
    color: '#BF5700',
    fontWeight: 600,
    textTransform: 'uppercase' as const,
    marginBottom: '0.5rem',
  },
};

export function TutorialOverlay({
  visible,
  onClose,
  onComplete,
}: TutorialOverlayProps): React.ReactElement | null {
  const [currentStep, setCurrentStep] = useState(0);

  const handleNext = useCallback(() => {
    if (currentStep < TUTORIAL_STEPS.length - 1) {
      setCurrentStep((prev) => prev + 1);
    } else {
      onComplete();
    }
  }, [currentStep, onComplete]);

  const handlePrev = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    }
  }, [currentStep]);

  const handleSkip = useCallback(() => {
    onClose();
  }, [onClose]);

  if (!visible) return null;

  const step = TUTORIAL_STEPS[currentStep];
  const isLastStep = currentStep === TUTORIAL_STEPS.length - 1;

  return (
    <div style={styles.overlay}>
      <div style={styles.modal}>
        <button style={styles.closeButton} onClick={handleSkip} title="Skip Tutorial">
          &times;
        </button>

        {/* Step indicator */}
        <div style={styles.stepIndicator}>
          {TUTORIAL_STEPS.map((_, idx) => (
            <div
              key={idx}
              style={{
                ...styles.stepDot,
                ...(idx === currentStep ? styles.stepDotActive : {}),
                ...(idx < currentStep ? styles.stepDotComplete : {}),
              }}
            />
          ))}
        </div>

        {/* Highlight badge */}
        {step.highlightArea && (
          <div style={{ textAlign: 'center' }}>
            <span style={styles.highlightBadge}>
              Focus: {step.highlightArea}
            </span>
          </div>
        )}

        <div style={styles.title}>{step.title}</div>
        <div style={styles.description}>{step.description}</div>
        <div style={styles.hint}>{step.hint}</div>

        {step.action && (
          <div style={styles.action}>
            <span>👆</span>
            {step.action}
          </div>
        )}

        <div style={styles.buttons}>
          {currentStep > 0 ? (
            <button
              style={{ ...styles.button, ...styles.buttonSecondary }}
              onClick={handlePrev}
            >
              Back
            </button>
          ) : (
            <button
              style={{ ...styles.button, ...styles.buttonSecondary }}
              onClick={handleSkip}
            >
              Skip
            </button>
          )}
          <button
            style={{ ...styles.button, ...styles.buttonPrimary }}
            onClick={handleNext}
          >
            {isLastStep ? 'Start Playing!' : 'Next'}
          </button>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}</style>
    </div>
  );
}
