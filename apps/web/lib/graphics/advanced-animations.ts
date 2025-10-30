/**
 * Advanced Animation Patterns
 *
 * Sophisticated animation utilities for complex interactions:
 * - Orchestrated multi-element animations
 * - Path animations and morphing
 * - Spring physics
 * - Parallax effects
 * - Gesture-based animations
 */

'use client';

/**
 * Spring Physics Animation
 * Natural, physics-based motion using spring dynamics
 */
export interface SpringConfig {
  stiffness?: number; // Higher = faster, snappier (default: 170)
  damping?: number; // Higher = less oscillation (default: 26)
  mass?: number; // Higher = more inertia (default: 1)
  velocity?: number; // Initial velocity (default: 0)
}

export interface SpringAnimation {
  update: (deltaTime: number) => number;
  getValue: () => number;
  getVelocity: () => number;
  setTarget: (target: number) => void;
  isResting: () => boolean;
}

export function createSpring(initialValue: number, target: number, config: SpringConfig = {}): SpringAnimation {
  const { stiffness = 170, damping = 26, mass = 1, velocity: initialVelocity = 0 } = config;

  let currentValue = initialValue;
  let currentVelocity = initialVelocity;
  let currentTarget = target;

  const restThreshold = 0.01;
  const velocityThreshold = 0.01;

  return {
    update(deltaTime: number): number {
      const dt = Math.min(deltaTime / 1000, 0.064); // Cap at ~15fps to prevent instability

      // Spring force calculation
      const springForce = -stiffness * (currentValue - currentTarget);
      const dampingForce = -damping * currentVelocity;
      const acceleration = (springForce + dampingForce) / mass;

      // Update velocity and position
      currentVelocity += acceleration * dt;
      currentValue += currentVelocity * dt;

      return currentValue;
    },

    getValue(): number {
      return currentValue;
    },

    getVelocity(): number {
      return currentVelocity;
    },

    setTarget(newTarget: number): void {
      currentTarget = newTarget;
    },

    isResting(): boolean {
      const isNearTarget = Math.abs(currentValue - currentTarget) < restThreshold;
      const isSlowVelocity = Math.abs(currentVelocity) < velocityThreshold;
      return isNearTarget && isSlowVelocity;
    },
  };
}

/**
 * Orchestrated Animation Sequencer
 * Chain and coordinate multiple animations
 */
export interface AnimationStep {
  element: HTMLElement | HTMLElement[];
  properties: Record<string, string | number>;
  duration: number;
  easing?: string;
  delay?: number;
}

export interface SequenceConfig {
  steps: AnimationStep[];
  onStepComplete?: (stepIndex: number) => void;
  onComplete?: () => void;
}

export function animateSequence(config: SequenceConfig): Promise<void> {
  const { steps, onStepComplete, onComplete } = config;

  return new Promise((resolve) => {
    let currentStep = 0;

    const runStep = async () => {
      if (currentStep >= steps.length) {
        onComplete?.();
        resolve();
        return;
      }

      const step = steps[currentStep];
      const elements = Array.isArray(step.element) ? step.element : [step.element];

      // Apply animation to all elements in this step
      const animations = elements.map((el) => {
        return el.animate(
          [
            // Get current computed values as starting point
            Object.keys(step.properties).reduce((acc, key) => {
              acc[key] = window.getComputedStyle(el)[key as any] || step.properties[key];
              return acc;
            }, {} as Record<string, any>),
            step.properties,
          ],
          {
            duration: step.duration,
            easing: step.easing || 'ease-out',
            delay: step.delay || 0,
            fill: 'forwards',
          }
        );
      });

      // Wait for all animations in this step to complete
      await Promise.all(animations.map((anim) => anim.finished));

      onStepComplete?.(currentStep);
      currentStep++;
      runStep();
    };

    runStep();
  });
}

/**
 * Parallel Animation Orchestrator
 * Run multiple animations simultaneously with coordination
 */
export interface ParallelAnimationConfig {
  animations: {
    element: HTMLElement;
    keyframes: Keyframe[];
    options: KeyframeAnimationOptions;
  }[];
  onComplete?: () => void;
}

export function animateParallel(config: ParallelAnimationConfig): Promise<void> {
  const { animations, onComplete } = config;

  const animationPromises = animations.map(({ element, keyframes, options }) => {
    const animation = element.animate(keyframes, options);
    return animation.finished;
  });

  return Promise.all(animationPromises).then(() => {
    onComplete?.();
  });
}

/**
 * SVG Path Morphing
 * Smoothly transition between two SVG paths
 */
export function morphPath(
  pathElement: SVGPathElement,
  targetPath: string,
  duration: number = 600,
  easing: string = 'ease-in-out'
): Animation {
  const currentPath = pathElement.getAttribute('d') || '';

  return pathElement.animate(
    [
      { d: currentPath },
      { d: targetPath },
    ],
    {
      duration,
      easing,
      fill: 'forwards',
    }
  );
}

/**
 * Follow Path Animation
 * Make an element follow along an SVG path
 */
export interface FollowPathConfig {
  element: HTMLElement;
  path: SVGPathElement;
  duration: number;
  easing?: string;
  rotate?: boolean; // Auto-rotate to follow path direction
  onProgress?: (progress: number) => void;
}

export function animateAlongPath(config: FollowPathConfig): Animation {
  const { element, path, duration, easing = 'ease-in-out', rotate = true, onProgress } = config;

  const pathLength = path.getTotalLength();
  const keyframes: Keyframe[] = [];
  const steps = 60; // 60 keyframe steps for smooth motion

  for (let i = 0; i <= steps; i++) {
    const progress = i / steps;
    const distance = progress * pathLength;
    const point = path.getPointAtLength(distance);

    const keyframe: Keyframe = {
      offset: progress,
      transform: `translate(${point.x}px, ${point.y}px)`,
    };

    // Add rotation to follow path direction
    if (rotate && i < steps) {
      const nextPoint = path.getPointAtLength(distance + pathLength / steps);
      const angle = Math.atan2(nextPoint.y - point.y, nextPoint.x - point.x) * (180 / Math.PI);
      keyframe.transform += ` rotate(${angle}deg)`;
    }

    keyframes.push(keyframe);
  }

  const animation = element.animate(keyframes, {
    duration,
    easing,
    fill: 'forwards',
  });

  if (onProgress) {
    animation.onfinish = () => onProgress(1);
    // Update progress during animation
    const startTime = performance.now();
    const updateProgress = () => {
      const elapsed = performance.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      onProgress(progress);
      if (progress < 1) {
        requestAnimationFrame(updateProgress);
      }
    };
    requestAnimationFrame(updateProgress);
  }

  return animation;
}

/**
 * Parallax Scroll Effect
 * Elements move at different speeds based on scroll position
 */
export interface ParallaxConfig {
  speed?: number; // Multiplier for scroll speed (0.5 = half speed, 2 = double speed)
  direction?: 'vertical' | 'horizontal' | 'both';
  smooth?: boolean; // Use lerp for smooth scrolling
}

export function createParallax(element: HTMLElement, config: ParallaxConfig = {}): () => void {
  const { speed = 0.5, direction = 'vertical', smooth = true } = config;

  let targetY = 0;
  let targetX = 0;
  let currentY = 0;
  let currentX = 0;
  let rafId: number;

  const lerp = (start: number, end: number, factor: number) => {
    return start + (end - start) * factor;
  };

  const updateParallax = () => {
    const rect = element.getBoundingClientRect();
    const elementMiddle = rect.top + rect.height / 2;
    const viewportMiddle = window.innerHeight / 2;
    const distance = elementMiddle - viewportMiddle;

    if (direction === 'vertical' || direction === 'both') {
      targetY = distance * (1 - speed);
    }

    if (direction === 'horizontal' || direction === 'both') {
      targetX = distance * (1 - speed);
    }

    if (smooth) {
      currentY = lerp(currentY, targetY, 0.1);
      currentX = lerp(currentX, targetX, 0.1);
    } else {
      currentY = targetY;
      currentX = targetX;
    }

    element.style.transform = `translate3d(${currentX}px, ${currentY}px, 0)`;

    rafId = requestAnimationFrame(updateParallax);
  };

  // Start animation loop
  updateParallax();

  // Return cleanup function
  return () => {
    cancelAnimationFrame(rafId);
    element.style.transform = '';
  };
}

/**
 * Gesture-Based Drag Animation
 * Smooth dragging with momentum and spring-back
 */
export interface DragConfig {
  onDrag?: (x: number, y: number) => void;
  onRelease?: (velocityX: number, velocityY: number) => void;
  bounds?: { minX?: number; maxX?: number; minY?: number; maxY?: number };
  momentum?: boolean;
  springBack?: boolean;
  axis?: 'x' | 'y' | 'both';
}

export function makeDraggable(element: HTMLElement, config: DragConfig = {}): () => void {
  const {
    onDrag,
    onRelease,
    bounds,
    momentum = true,
    springBack = true,
    axis = 'both',
  } = config;

  let isDragging = false;
  let startX = 0;
  let startY = 0;
  let currentX = 0;
  let currentY = 0;
  let velocityX = 0;
  let velocityY = 0;
  let lastX = 0;
  let lastY = 0;
  let lastTime = 0;

  const applyBounds = (x: number, y: number) => {
    let boundedX = x;
    let boundedY = y;

    if (bounds) {
      if (bounds.minX !== undefined) boundedX = Math.max(bounds.minX, boundedX);
      if (bounds.maxX !== undefined) boundedX = Math.min(bounds.maxX, boundedX);
      if (bounds.minY !== undefined) boundedY = Math.max(bounds.minY, boundedY);
      if (bounds.maxY !== undefined) boundedY = Math.min(bounds.maxY, boundedY);
    }

    return { x: boundedX, y: boundedY };
  };

  const handlePointerDown = (e: PointerEvent) => {
    isDragging = true;
    startX = e.clientX - currentX;
    startY = e.clientY - currentY;
    lastX = e.clientX;
    lastY = e.clientY;
    lastTime = Date.now();
    element.setPointerCapture(e.pointerId);
    element.style.cursor = 'grabbing';
  };

  const handlePointerMove = (e: PointerEvent) => {
    if (!isDragging) return;

    const now = Date.now();
    const dt = now - lastTime;

    if (dt > 0) {
      velocityX = (e.clientX - lastX) / dt;
      velocityY = (e.clientY - lastY) / dt;
    }

    const rawX = e.clientX - startX;
    const rawY = e.clientY - startY;

    const bounded = applyBounds(
      axis === 'y' ? currentX : rawX,
      axis === 'x' ? currentY : rawY
    );

    currentX = bounded.x;
    currentY = bounded.y;

    element.style.transform = `translate3d(${currentX}px, ${currentY}px, 0)`;

    onDrag?.(currentX, currentY);

    lastX = e.clientX;
    lastY = e.clientY;
    lastTime = now;
  };

  const handlePointerUp = (e: PointerEvent) => {
    if (!isDragging) return;

    isDragging = false;
    element.releasePointerCapture(e.pointerId);
    element.style.cursor = 'grab';

    onRelease?.(velocityX, velocityY);

    // Apply momentum
    if (momentum && (Math.abs(velocityX) > 0.1 || Math.abs(velocityY) > 0.1)) {
      const decay = 0.95;
      const threshold = 0.1;

      const applyMomentum = () => {
        velocityX *= decay;
        velocityY *= decay;

        currentX += velocityX * 16; // Assume 60fps (16ms per frame)
        currentY += velocityY * 16;

        const bounded = applyBounds(currentX, currentY);
        currentX = bounded.x;
        currentY = bounded.y;

        element.style.transform = `translate3d(${currentX}px, ${currentY}px, 0)`;

        if (Math.abs(velocityX) > threshold || Math.abs(velocityY) > threshold) {
          requestAnimationFrame(applyMomentum);
        } else if (springBack) {
          // Spring back to nearest valid position
          const spring = createSpring(currentX, 0, { stiffness: 100, damping: 20 });
          const springY = createSpring(currentY, 0, { stiffness: 100, damping: 20 });

          const springAnimation = () => {
            spring.update(16);
            springY.update(16);
            currentX = spring.getValue();
            currentY = springY.getValue();
            element.style.transform = `translate3d(${currentX}px, ${currentY}px, 0)`;

            if (!spring.isResting() || !springY.isResting()) {
              requestAnimationFrame(springAnimation);
            }
          };

          requestAnimationFrame(springAnimation);
        }
      };

      requestAnimationFrame(applyMomentum);
    }
  };

  // Attach listeners
  element.style.cursor = 'grab';
  element.style.touchAction = 'none'; // Prevent default touch behaviors
  element.addEventListener('pointerdown', handlePointerDown);
  element.addEventListener('pointermove', handlePointerMove);
  element.addEventListener('pointerup', handlePointerUp);
  element.addEventListener('pointercancel', handlePointerUp);

  // Return cleanup function
  return () => {
    element.style.cursor = '';
    element.style.touchAction = '';
    element.style.transform = '';
    element.removeEventListener('pointerdown', handlePointerDown);
    element.removeEventListener('pointermove', handlePointerMove);
    element.removeEventListener('pointerup', handlePointerUp);
    element.removeEventListener('pointercancel', handlePointerUp);
  };
}

/**
 * Magnetic Cursor Effect
 * Elements attract to cursor on hover
 */
export interface MagneticConfig {
  strength?: number; // How strong the magnetic pull (0-1, default: 0.3)
  radius?: number; // Radius of magnetic field in pixels (default: 100)
}

export function createMagnetic(element: HTMLElement, config: MagneticConfig = {}): () => void {
  const { strength = 0.3, radius = 100 } = config;

  let rafId: number;
  const originalPosition = { x: 0, y: 0 };

  const handleMouseMove = (e: MouseEvent) => {
    const rect = element.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    const distanceX = e.clientX - centerX;
    const distanceY = e.clientY - centerY;
    const distance = Math.sqrt(distanceX ** 2 + distanceY ** 2);

    if (distance < radius) {
      const pull = 1 - distance / radius;
      const moveX = distanceX * strength * pull;
      const moveY = distanceY * strength * pull;

      element.style.transform = `translate3d(${moveX}px, ${moveY}px, 0)`;
    } else {
      element.style.transform = `translate3d(0, 0, 0)`;
    }
  };

  const handleMouseLeave = () => {
    element.style.transform = `translate3d(0, 0, 0)`;
  };

  element.addEventListener('mousemove', handleMouseMove);
  element.addEventListener('mouseleave', handleMouseLeave);

  return () => {
    element.style.transform = '';
    element.removeEventListener('mousemove', handleMouseMove);
    element.removeEventListener('mouseleave', handleMouseLeave);
  };
}

/**
 * Number Counter Animation
 * Smoothly animate number changes with easing
 */
export function animateNumber(
  element: HTMLElement,
  from: number,
  to: number,
  duration: number = 1000,
  options: {
    easing?: (t: number) => number;
    format?: (n: number) => string;
    onUpdate?: (value: number) => void;
  } = {}
): Promise<void> {
  const { easing = (t) => t, format = (n) => n.toFixed(0), onUpdate } = options;

  return new Promise((resolve) => {
    const startTime = performance.now();
    const diff = to - from;

    const update = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easedProgress = easing(progress);
      const currentValue = from + diff * easedProgress;

      element.textContent = format(currentValue);
      onUpdate?.(currentValue);

      if (progress < 1) {
        requestAnimationFrame(update);
      } else {
        resolve();
      }
    };

    requestAnimationFrame(update);
  });
}

/**
 * Ripple Effect
 * Material Design-style ripple on click
 */
export function createRipple(element: HTMLElement, color: string = 'rgba(255, 255, 255, 0.6)'): () => void {
  const handleClick = (e: MouseEvent) => {
    const rect = element.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const ripple = document.createElement('span');
    ripple.style.position = 'absolute';
    ripple.style.left = `${x}px`;
    ripple.style.top = `${y}px`;
    ripple.style.width = '0';
    ripple.style.height = '0';
    ripple.style.borderRadius = '50%';
    ripple.style.background = color;
    ripple.style.transform = 'translate(-50%, -50%)';
    ripple.style.pointerEvents = 'none';

    element.style.position = 'relative';
    element.style.overflow = 'hidden';
    element.appendChild(ripple);

    const size = Math.max(rect.width, rect.height) * 2;

    const animation = ripple.animate(
      [
        { width: '0', height: '0', opacity: 1 },
        { width: `${size}px`, height: `${size}px`, opacity: 0 },
      ],
      {
        duration: 600,
        easing: 'ease-out',
      }
    );

    animation.onfinish = () => {
      ripple.remove();
    };
  };

  element.addEventListener('click', handleClick);

  return () => {
    element.removeEventListener('click', handleClick);
  };
}
