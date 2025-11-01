'use client';

import { useState, useEffect } from 'react';
import styles from './page.module.css';
import LEIMeter from '../../components/lei/LEIMeter';
import ClutchMomentCard from '../../components/lei/ClutchMomentCard';
import ClutchLeaderboard from '../../components/lei/ClutchLeaderboard';

/**
 * Leverage Equivalency Index (LEI) Showcase Page
 *
 * Features:
 * - Interactive LEI meter demonstrations
 * - 3D clutch moment cards
 * - Animated leaderboard with multiple view modes
 * - Real-time data from famous playoff moments
 */
export default function LEIShowcasePage() {
  const [leaderboardData, setLeaderboardData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch famous moments from API
    fetch('/api/lei/examples')
      .then((res) => res.json())
      .then((data) => {
        setLeaderboardData(data.plays || []);
        setLoading(false);
      })
      .catch((error) => {
        console.error('Error fetching LEI data:', error);
        setLoading(false);
      });
  }, []);

  // Demo LEI scores for the meters
  const demoScores = [
    { score: 65.0, label: 'Malcolm Butler INT (SB XLIX)', variant: 'legendary' as const },
    { score: 50.7, label: 'David Freese Triple (2011 WS)', variant: 'championship' as const },
    { score: 22.2, label: 'Aaron Boone HR (2003 ALCS)', variant: 'default' as const },
  ];

  return (
    <div className={styles.page}>
      {/* Hero Section */}
      <section className={styles.hero}>
        <div className={styles.heroBackground}>
          <div className={styles.heroGradient} />
          <div className={styles.heroParticles} />
        </div>

        <div className={styles.heroContent}>
          <h1 className={styles.heroTitle}>
            <span className={styles.heroTitleMain}>LEVERAGE EQUIVALENCY INDEX</span>
            <span className={styles.heroTitleSub}>Quantifying Clutch Across Sports</span>
          </h1>

          <p className={styles.heroDescription}>
            The LEI normalizes championship moments to a 0-100 scale, enabling fair
            comparison of clutch plays across different sports, eras, and game situations.
          </p>

          <div className={styles.heroStats}>
            <div className={styles.heroStat}>
              <div className={styles.heroStatValue}>0-100</div>
              <div className={styles.heroStatLabel}>Universal Scale</div>
            </div>
            <div className={styles.heroStat}>
              <div className={styles.heroStatValue}>3</div>
              <div className={styles.heroStatLabel}>Key Components</div>
            </div>
            <div className={styles.heroStat}>
              <div className={styles.heroStatValue}>∞</div>
              <div className={styles.heroStatLabel}>Epic Moments</div>
            </div>
          </div>
        </div>
      </section>

      {/* Formula Section */}
      <section className={styles.formula}>
        <h2 className={styles.sectionTitle}>The Formula</h2>
        <div className={styles.formulaCard}>
          <div className={styles.formulaEquation}>
            LEI = 100 × (Championship Weight × WPA × Scarcity) / 8.0
          </div>
          <div className={styles.formulaComponents}>
            <div className={styles.formulaComponent}>
              <div className={styles.formulaComponentIcon}>🏆</div>
              <div className={styles.formulaComponentLabel}>Championship Weight</div>
              <div className={styles.formulaComponentDesc}>1x-8x based on playoff round</div>
            </div>
            <div className={styles.formulaComponent}>
              <div className={styles.formulaComponentIcon}>📊</div>
              <div className={styles.formulaComponentLabel}>Win Probability Added</div>
              <div className={styles.formulaComponentDesc}>Game situation impact (0-1)</div>
            </div>
            <div className={styles.formulaComponent}>
              <div className={styles.formulaComponentIcon}>⏱️</div>
              <div className={styles.formulaComponentLabel}>Scarcity</div>
              <div className={styles.formulaComponentDesc}>Opportunities remaining (0-1)</div>
            </div>
          </div>
        </div>
      </section>

      {/* LEI Meters Showcase */}
      <section className={styles.metersSection}>
        <h2 className={styles.sectionTitle}>Legendary Clutch Moments</h2>
        <div className={styles.metersGrid}>
          {demoScores.map((demo, idx) => (
            <div key={idx} className={styles.meterWrapper}>
              <LEIMeter
                score={demo.score}
                label={demo.label}
                variant={demo.variant}
                animated={true}
                showParticles={true}
              />
            </div>
          ))}
        </div>
      </section>

      {/* Featured Cards Section */}
      {leaderboardData.length > 0 && (
        <section className={styles.cardsSection}>
          <h2 className={styles.sectionTitle}>Top Clutch Performances</h2>
          <div className={styles.featuredCards}>
            {leaderboardData.slice(0, 4).map((play, idx) => (
              <ClutchMomentCard
                key={play.play_id}
                play={play}
                rank={idx + 1}
                variant="holographic"
                interactive={true}
              />
            ))}
          </div>
        </section>
      )}

      {/* Leaderboard Section */}
      <section className={styles.leaderboardSection}>
        {loading ? (
          <div className={styles.loading}>
            <div className={styles.loadingSpinner} />
            <div className={styles.loadingText}>Loading clutch moments...</div>
          </div>
        ) : (
          <ClutchLeaderboard
            data={leaderboardData}
            title="ALL-TIME CLUTCH LEADERBOARD"
            animated={true}
            viewMode="table"
            sortBy="lei"
          />
        )}
      </section>

      {/* How It Works Section */}
      <section className={styles.howItWorks}>
        <h2 className={styles.sectionTitle}>How It Works</h2>
        <div className={styles.howItWorksGrid}>
          <div className={styles.howItWorksCard}>
            <div className={styles.howItWorksNumber}>1</div>
            <h3 className={styles.howItWorksTitle}>Calculate Win Probability</h3>
            <p className={styles.howItWorksDesc}>
              Measure the win probability before and after each play using historical
              models (Baseball-Reference for MLB, nflfastR for NFL).
            </p>
          </div>
          <div className={styles.howItWorksCard}>
            <div className={styles.howItWorksNumber}>2</div>
            <h3 className={styles.howItWorksTitle}>Apply Championship Weight</h3>
            <p className={styles.howItWorksDesc}>
              Multiply by playoff round importance: Wildcard (1x), Division (2x),
              Conference (4x), Championship (8x).
            </p>
          </div>
          <div className={styles.howItWorksCard}>
            <div className={styles.howItWorksNumber}>3</div>
            <h3 className={styles.howItWorksTitle}>Factor in Scarcity</h3>
            <p className={styles.howItWorksDesc}>
              Adjust for remaining opportunities: fewer outs/time = higher leverage.
              2-strike counts and final seconds get extra weight.
            </p>
          </div>
          <div className={styles.howItWorksCard}>
            <div className={styles.howItWorksNumber}>4</div>
            <h3 className={styles.howItWorksTitle}>Normalize to 100</h3>
            <p className={styles.howItWorksDesc}>
              Scale the result to 0-100 where 100 represents the theoretical maximum
              clutch moment (full WP reversal in final championship second).
            </p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className={styles.cta}>
        <div className={styles.ctaContent}>
          <h2 className={styles.ctaTitle}>Explore the Data</h2>
          <p className={styles.ctaDescription}>
            Dive deeper into clutch analytics and discover more legendary moments
          </p>
          <div className={styles.ctaButtons}>
            <a href="/api/lei" className={styles.ctaButton}>
              API Documentation
            </a>
            <a href="/api/lei/examples" className={styles.ctaButtonSecondary}>
              View Examples
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
