import type { Metadata } from 'next';
import { MonteCarloClient } from './MonteCarloClient';

export const metadata: Metadata = {
  title: 'Monte Carlo Simulation',
  description:
    'How BSI uses Monte Carlo simulation to project season outcomes — methodology, inputs, assumptions, and limitations.',
  alternates: { canonical: '/models/monte-carlo' },
};

export default function MonteCarloPage() {
  return <MonteCarloClient />;
}
