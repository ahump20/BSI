'use client';

import React from 'react';
import Link from 'next/link';
import { Card, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { ScrollReveal } from '@/components/cinematic';

interface SportInfoCardProps {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  bullets: Array<{ bold: string; text: string }>;
  actions?: Array<{ label: string; href: string; variant?: 'outline' | 'ghost' }>;
}

export function SportInfoCard({ icon, title, subtitle, bullets, actions }: SportInfoCardProps) {
  return (
    <ScrollReveal>
      <Card variant="default" padding="lg">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-sm bg-[var(--bsi-primary)]/15 flex items-center justify-center">
            {icon}
          </div>
          <div>
            <CardTitle size="md">{title}</CardTitle>
            <p className="text-[rgba(196,184,165,0.5)] text-xs mt-0.5">{subtitle}</p>
          </div>
        </div>
        <ul className="space-y-3 text-sm text-[var(--bsi-dust)]">
          {bullets.map((bullet) => (
            <li key={bullet.bold} className="flex gap-2">
              <span className="text-[var(--bsi-primary)] mt-1 shrink-0">&bull;</span>
              <span>
                <strong className="text-[var(--bsi-bone)]">{bullet.bold}</strong> {bullet.text}
              </span>
            </li>
          ))}
        </ul>
        {actions && actions.length > 0 && (
          <div className="flex flex-wrap gap-3 mt-5 pt-4 border-t border-[var(--border-vintage)]">
            {actions.map((action) => (
              <Link key={action.href} href={action.href}>
                <Button variant={action.variant || 'ghost'} size="sm">
                  {action.label}
                </Button>
              </Link>
            ))}
          </div>
        )}
      </Card>
    </ScrollReveal>
  );
}
