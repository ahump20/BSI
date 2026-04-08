import Section from './Section';
import ScrollReveal from './ScrollReveal';
import { CONTACT_CHANNELS, RESUME_PATH, type ContactChannelIcon } from '../content/site';

const iconPaths: Record<ContactChannelIcon, string> = {
  email:
    'M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z',
  linkedin: 'M16 8a6 6 0 016 6v7h-4v-7a2 2 0 00-4 0v7h-4v-7a6 6 0 016-6zM2 9h4v12H2zM4 6a2 2 0 100-4 2 2 0 000 4z',
  bsi: 'M13 10V3L4 14h7v7l9-11h-7z',
  github:
    'M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.009-.866-.013-1.7-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.462-1.11-1.462-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.564 9.564 0 0112 6.844a9.59 9.59 0 012.504.337c1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.163 22 16.418 22 12c0-5.523-4.477-10-10-10z',
  x: 'M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z',
};

function ChannelIcon({ icon }: { icon: ContactChannelIcon }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={icon === 'github' || icon === 'x' ? 0 : 1.5}
      className="w-5 h-5"
      style={{ color: 'var(--color-accent)' }}
    >
      <path
        d={iconPaths[icon]}
        fill={icon === 'github' || icon === 'x' ? 'currentColor' : 'none'}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function ContactSection() {
  return (
    <Section id="contact" label="Connect" title="Direct Channels" glow className="contact-bg">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {CONTACT_CHANNELS.map((channel, i) => (
          <ScrollReveal key={channel.label} delay={i * 0.06}>
            <a
              href={channel.href}
              target={channel.href.startsWith('mailto') ? undefined : '_blank'}
              rel={channel.href.startsWith('mailto') ? undefined : 'noopener noreferrer'}
              className="group flex items-center gap-4 p-4 rounded-sm transition-all duration-300"
              style={{
                border: '1px solid rgba(245,240,235,0.04)',
                background: 'rgba(26,26,26,0.3)',
              }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLElement).style.borderColor = 'rgba(191,87,0,0.3)';
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLElement).style.borderColor = 'rgba(245,240,235,0.04)';
              }}
            >
              <ChannelIcon icon={channel.icon} />
              <div>
                <p
                  className="font-mono text-[10px] tracking-[0.1em] uppercase"
                  style={{ color: 'var(--color-text-muted)' }}
                >
                  {channel.label}
                </p>
                <p
                  className="font-serif text-[14px] mt-0.5 group-hover:text-[var(--color-accent)] transition-colors"
                  style={{ color: 'var(--color-text)' }}
                >
                  {channel.value}
                </p>
              </div>
            </a>
          </ScrollReveal>
        ))}
      </div>

      {/* Resume download */}
      <ScrollReveal delay={0.3}>
        <div className="mt-10 text-center">
          <a href={RESUME_PATH} className="btn-primary" download>
            Download Resume (PDF)
          </a>
        </div>
      </ScrollReveal>
    </Section>
  );
}
