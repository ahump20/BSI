import { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { usePrefersReducedMotion } from '../hooks/usePrefersReducedMotion';

export default function Hero() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const prefersReducedMotion = usePrefersReducedMotion();

  useEffect(() => {
    if (prefersReducedMotion) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    const particles: { x: number; y: number; vx: number; vy: number; r: number; a: number }[] = [];
    const count = 80;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    for (let i = 0; i < count; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3,
        r: Math.random() * 2 + 0.5,
        a: Math.random() * 0.5 + 0.1,
      });
    }

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0) p.x = canvas.width;
        if (p.x > canvas.width) p.x = 0;
        if (p.y < 0) p.y = canvas.height;
        if (p.y > canvas.height) p.y = 0;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(191, 87, 0, ${p.a})`;
        ctx.fill();
      }
      animId = requestAnimationFrame(draw);
    };
    draw();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resize);
    };
  }, [prefersReducedMotion]);

  return (
    <section id="hero" aria-labelledby="hero-heading" className="relative min-h-screen flex items-center justify-center overflow-hidden bg-midnight">
      {/* Canvas particles */}
      {!prefersReducedMotion && (
        <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none" />
      )}

      {/* Radial gradient overlays */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_30%_20%,rgba(191,87,0,0.08)_0%,transparent_60%)] pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_70%_80%,rgba(139,69,19,0.06)_0%,transparent_60%)] pointer-events-none" />

      <div className="relative z-10 text-center px-6 max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <p className="section-label mb-6">Sports Intelligence Architect</p>

          <h1
            id="hero-heading"
            className="font-sans font-bold text-[clamp(3rem,8vw,6rem)] uppercase leading-none tracking-wider text-bone mb-6"
          >
            Austin
            <br />
            <span className="text-burnt-orange">Humphrey</span>
          </h1>

          <p className="font-serif italic text-warm-gray text-lg md:text-xl max-w-2xl mx-auto mb-12 leading-relaxed">
            "The gap between interest in the game and access to meaningful analytics
            is the product — old-school scouting instinct fused with new-school sabermetrics."
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a href="#origin" className="btn-primary">
              The Origin
            </a>
            <a
              href="https://blazesportsintel.com"
              target="_blank"
              rel="noopener noreferrer"
              className="btn-outline"
            >
              Blaze Sports Intel
            </a>
            <a href="/Austin_Humphrey_Resume_Executive_v2.pdf" download className="btn-outline">
              Resume
            </a>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
