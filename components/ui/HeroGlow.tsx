/**
 * HeroGlow — ambient burnt-orange radial gradient overlay.
 *
 * Drop inside any `relative overflow-hidden` container. Pure presentational,
 * no hooks, no client directive needed.
 */

interface HeroGlowProps {
  /** Opacity of the burnt-orange center (0-1). @default 0.06 */
  intensity?: number;
  /** Ellipse dimensions, e.g. '80% 50%'. @default '70% 50%' */
  shape?: string;
  /** Gradient center, e.g. '50% 20%'. @default '50% 20%' */
  position?: string;
  /** How far the gradient fades, e.g. '70%'. @default '70%' */
  spread?: string;
  /** Additional class names on the overlay div. */
  className?: string;
}

export function HeroGlow({
  intensity = 0.06,
  shape = '70% 50%',
  position = '50% 20%',
  spread = '70%',
  className = '',
}: HeroGlowProps) {
  return (
    <div
      className={`absolute inset-0 pointer-events-none ${className}`.trim()}
      style={{
        background: `radial-gradient(ellipse ${shape} at ${position}, rgba(191,87,0,${intensity}) 0%, transparent ${spread})`,
      }}
    />
  );
}
