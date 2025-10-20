import type { ReactNode } from 'react';
import { designTokens } from '../../../../config/design-tokens';
import { CardGrid } from '../(components)/CardGrid';
import { InfoCard } from '../(components)/InfoCard';
import { PageHeader } from '../(components)/PageHeader';
import { PageShell } from '../(components)/PageShell';

const { colors, spacing, radii, typography } = designTokens;

const colorEntries = Object.entries(colors);
const spacingEntries = Object.entries(spacing);
const radiusEntries = Object.entries(radii);

export default function DesignTokensPage() {
  return (
    <PageShell>
      <section className="flex flex-col gap-section-gap">
        <PageHeader
          kicker="Design System"
          title="Tailwind Token Preview"
          description="Reference swatches for the Blaze Sports Intel Tailwind theme. These tokens power the dark-mode surfaces and keep baseball-first screens consistent across the product."
        />
        <TokenSection
          description="Primary surfaces and accents used across the Diamond Insights experience."
          title="Color Palette"
        >
          <CardGrid className="xl:grid-cols-3">
            {colorEntries.map(([name, value]) => (
              <InfoCard
                key={name}
                title={toTitle(name)}
                description={<TokenDescription name={name} value={value} />}
                className="gap-6"
              >
                <div
                  aria-hidden
                  className="h-16 w-full rounded-di-card border border-di-border/40"
                  style={{ backgroundColor: value }}
                />
              </InfoCard>
            ))}
          </CardGrid>
        </TokenSection>
        <TokenSection
          description="Consistent spacing primitives built on rem units for mobile-first rhythm."
          title="Spacing Scale"
        >
          <CardGrid>
            {spacingEntries.map(([name, value]) => (
              <InfoCard
                key={name}
                title={toTitle(name)}
                description={<TokenDescription name={name} value={value} />}
                className="gap-6"
              >
                <div className="flex h-3 w-full items-center gap-2">
                  <div className="h-1 rounded-di-pill bg-di-accent" style={{ width: value }} />
                  <span className="text-xs text-di-text-muted">{value}</span>
                </div>
              </InfoCard>
            ))}
          </CardGrid>
        </TokenSection>
        <TokenSection
          description="Rounded geometry keeps cards approachable while preserving focus modes."
          title="Radii"
        >
          <CardGrid>
            {radiusEntries.map(([name, value]) => (
              <InfoCard
                key={name}
                title={toTitle(name)}
                description={<TokenDescription name={name} value={value} />}
                className="items-center gap-6"
              >
                <div
                  aria-hidden
                  className="h-16 w-full border border-di-border/40 bg-di-surface"
                  style={{ borderRadius: value }}
                />
              </InfoCard>
            ))}
          </CardGrid>
        </TokenSection>
        <TokenSection
          description="Type ramps pair Inter for data clarity with Source Serif Pro headlines."
          title="Typography"
        >
          <CardGrid>
            <InfoCard
              title="Sans"
              description={`Font stack: ${typography.fonts.body.join(', ')}`}
              className="gap-6"
            >
              <p className="font-sans text-lg">Standard over vibes.</p>
            </InfoCard>
            <InfoCard
              title="Heading"
              description={`Font stack: ${typography.fonts.heading.join(', ')}`}
              className="gap-6"
            >
              <p className="font-heading text-2xl">Clarity beats noise.</p>
            </InfoCard>
            <InfoCard
              title="Letter Spacing"
              description={<TokenDescription name="kicker" value={typography.letterSpacing.kicker} />}
              className="gap-6"
            >
              <p className="text-xs uppercase tracking-kicker text-di-accent">Diamond Insights Kicker</p>
            </InfoCard>
          </CardGrid>
        </TokenSection>
      </section>
    </PageShell>
  );
}

type TokenSectionProps = {
  children: ReactNode;
  description: string;
  title: string;
};

function TokenSection({ children, description, title }: TokenSectionProps) {
  return (
    <section className="flex flex-col gap-6">
      <div className="space-y-3">
        <h2 className="font-heading text-2xl">{title}</h2>
        <p className="text-sm leading-relaxed text-di-text-muted">{description}</p>
      </div>
      {children}
    </section>
  );
}

type TokenDescriptionProps = {
  name: string;
  value: string;
};

function TokenDescription({ name, value }: TokenDescriptionProps) {
  return (
    <p className="text-sm leading-relaxed text-di-text-muted">
      <span className="font-semibold text-di-text">{name}</span>
      <span className="text-di-text-muted"> · {value}</span>
    </p>
  );
}

function toTitle(token: string): string {
  return token
    .replace(/([A-Z])/g, ' $1')
    .replace(/-/g, ' ')
    .replace(/^\w/, (char) => char.toUpperCase())
    .trim();
}
