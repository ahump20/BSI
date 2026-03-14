'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

export interface Drill {
  name: string;
  target: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  description: string;
  reps: string;
  equipment?: string;
}

interface DrillCardProps {
  drill: Drill;
  index: number;
}

const DIFFICULTY_STYLES = {
  beginner: { label: 'Beginner', color: 'text-emerald-400 bg-emerald-500/10' },
  intermediate: { label: 'Intermediate', color: 'text-amber-400 bg-amber-500/10' },
  advanced: { label: 'Advanced', color: 'text-red-400 bg-red-500/10' },
};

export function DrillCard({ drill, index }: DrillCardProps) {
  const diff = DIFFICULTY_STYLES[drill.difficulty];

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className="rounded-sm bg-surface-dugout border border-border-subtle p-4 hover:border-burnt-orange/20 transition-colors"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="w-6 h-6 rounded-sm bg-burnt-orange/15 flex items-center justify-center text-xs font-bold text-burnt-orange font-mono">
            {index + 1}
          </span>
          <h4 className="text-sm font-semibold text-bsi-bone">{drill.name}</h4>
        </div>
        <span className={`text-[9px] font-mono uppercase tracking-wider px-1.5 py-0.5 rounded-sm ${diff.color}`}>
          {diff.label}
        </span>
      </div>

      <p className="text-xs text-bsi-dust leading-relaxed mb-3">{drill.description}</p>

      <div className="flex items-center gap-4 text-[10px] text-text-muted">
        <span className="flex items-center gap-1">
          <svg viewBox="0 0 16 16" className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="1.5">
            <circle cx="8" cy="8" r="6" />
            <path d="M8 5v3l2 2" />
          </svg>
          {drill.reps}
        </span>
        <span className="heritage-stamp text-[9px]">{drill.target}</span>
        {drill.equipment && (
          <span className="text-text-muted">{drill.equipment}</span>
        )}
      </div>
    </motion.div>
  );
}

/** Get recommended drills based on weak metrics */
export function getRecommendedDrills(
  weakMetrics: string[],
): Drill[] {
  const DRILL_LIBRARY: Record<string, Drill[]> = {
    hipShoulderSeparation: [
      {
        name: 'Separation Stride Drill',
        target: 'Hip-Shoulder Separation',
        difficulty: 'intermediate',
        description: 'Stride forward while keeping hands and shoulders back. Focus on feeling the stretch between your front hip rotating open and your hands staying loaded.',
        reps: '3 sets of 10 dry swings',
        equipment: 'Bat or broomstick',
      },
      {
        name: 'Towel Behind Back Rotation',
        target: 'Hip-Shoulder Separation',
        difficulty: 'beginner',
        description: 'Hold a towel behind your back at hip height. Practice hip rotation while keeping the towel taut — forces your upper body to lag behind.',
        reps: '2 sets of 15 rotations',
        equipment: 'Towel',
      },
    ],
    hipRotationVelocity: [
      {
        name: 'Medicine Ball Rotational Throw',
        target: 'Hip Rotation Speed',
        difficulty: 'intermediate',
        description: 'Stand sideways to a wall. Rotate explosively from the hips and throw a medicine ball into the wall. Focus on hip-first rotation.',
        reps: '3 sets of 8 per side',
        equipment: '4-8 lb medicine ball',
      },
    ],
    contactPoint: [
      {
        name: 'Tee Work — Inside/Middle/Outside',
        target: 'Contact Point',
        difficulty: 'beginner',
        description: 'Set up three tee positions (inside, middle, outside). Hit 5 from each position, focusing on where the barrel meets the ball relative to your front hip.',
        reps: '15 swings (5 per position)',
        equipment: 'Tee, balls, bat',
      },
    ],
    extension: [
      {
        name: 'Top Hand Release Drill',
        target: 'Extension',
        difficulty: 'beginner',
        description: 'Swing normally but release your top hand after contact. This forces full extension through the ball with your bottom arm.',
        reps: '3 sets of 10 off tee',
        equipment: 'Tee, bat, balls',
      },
    ],
    strideLength: [
      {
        name: 'Chalk Line Stride Drill',
        target: 'Stride Length',
        difficulty: 'beginner',
        description: 'Mark your ideal stride length (60-70% of height) with chalk. Practice striding to the mark consistently without looking down.',
        reps: '20 dry strides',
        equipment: 'Chalk',
      },
    ],
    weightDistribution: [
      {
        name: 'Balance Board Load Drill',
        target: 'Weight Distribution',
        difficulty: 'intermediate',
        description: 'Stand on a balance board in your stance. Practice loading back while maintaining balance — builds proprioception for weight transfer.',
        reps: '2 sets of 12 loads',
        equipment: 'Balance board',
      },
    ],
    finishBalance: [
      {
        name: 'Freeze Finish Drill',
        target: 'Finish Balance',
        difficulty: 'beginner',
        description: 'After every swing, hold your finish position for 3 seconds. If you fall off balance, that swing had deceleration issues.',
        reps: '15 swings with 3-second holds',
        equipment: 'Bat',
      },
    ],
    barrelPath: [
      {
        name: 'High Tee / Low Tee Alternation',
        target: 'Barrel Path',
        difficulty: 'intermediate',
        description: 'Alternate between a high tee and low tee every swing. Forces barrel path adjustments while maintaining efficient swing mechanics.',
        reps: '20 swings alternating',
        equipment: 'Adjustable tee, balls, bat',
      },
    ],
  };

  const drills: Drill[] = [];
  for (const metric of weakMetrics) {
    const metricDrills = DRILL_LIBRARY[metric];
    if (metricDrills) {
      drills.push(...metricDrills);
    }
  }

  return drills.length > 0 ? drills : [
    {
      name: 'Dry Swing Mirror Work',
      target: 'General Mechanics',
      difficulty: 'beginner',
      description: 'Take 20 slow-motion dry swings in front of a mirror. Watch your load, stride, and rotation. Film yourself for comparison.',
      reps: '20 slow-motion swings',
      equipment: 'Bat, mirror',
    },
  ];
}

/** AI-generated personalized drills for Pro users */
interface AIPersonalizedDrillsProps {
  swingId: string;
  systemPrompt: string;
  weakMetrics: { key: string; label: string; value: number; score: number }[];
  sport: string;
}

export function AIPersonalizedDrills({ swingId, systemPrompt, weakMetrics, sport }: AIPersonalizedDrillsProps) {
  const [drills, setDrills] = useState<Drill[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function fetchAIDrills() {
      try {
        const metricsDesc = weakMetrics
          .map((m) => `${m.label}: ${m.value} (score: ${m.score}/100)`)
          .join(', ');

        const res = await fetch('/api/swing/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            swingId,
            systemPrompt,
            messages: [{
              role: 'user',
              content: `Based on my weakest metrics (${metricsDesc}), prescribe exactly 3 personalized drills for ${sport}. For each drill, respond in this exact JSON format:
[{"name":"...","target":"...","difficulty":"beginner|intermediate|advanced","description":"...","reps":"...","equipment":"..."}]
Only output the JSON array, nothing else.`,
            }],
          }),
        });

        if (!res.ok) throw new Error('Failed');

        const data = (await res.json()) as { reply: string };

        // Parse the JSON from Claude's response
        const jsonMatch = data.reply.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]) as Drill[];
          if (!cancelled && Array.isArray(parsed)) {
            setDrills(parsed.slice(0, 3));
          }
        }
      } catch {
        if (!cancelled) setError(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchAIDrills();
    return () => { cancelled = true; };
  }, [swingId, systemPrompt, weakMetrics, sport]);

  if (error || (!loading && drills.length === 0)) return null;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 mb-2">
        <span className="heritage-stamp text-[10px]">AI-Personalized</span>
        {loading && (
          <motion.div
            className="w-3 h-3 border border-burnt-orange border-t-transparent rounded-full"
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          />
        )}
      </div>
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="rounded-sm bg-surface-dugout border border-border-subtle p-4 animate-pulse">
              <div className="h-4 bg-white/[0.06] rounded-sm w-40 mb-3" />
              <div className="h-3 bg-white/[0.04] rounded-sm w-full mb-2" />
              <div className="h-3 bg-white/[0.04] rounded-sm w-3/4" />
            </div>
          ))}
        </div>
      ) : (
        drills.map((drill, i) => (
          <DrillCard key={drill.name} drill={drill} index={i} />
        ))
      )}
    </div>
  );
}
