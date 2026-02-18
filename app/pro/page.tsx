'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Footer } from '@/components/layout-ds/Footer';

type BillingPeriod = 'monthly' | 'annual';

const STRIPE_URLS = {
  proMonthly:
    process.env.NEXT_PUBLIC_STRIPE_PRO_MONTHLY_URL || 'https://buy.stripe.com/pro-monthly',
  proAnnual: process.env.NEXT_PUBLIC_STRIPE_PRO_ANNUAL_URL || 'https://buy.stripe.com/pro-annual',
  apiMonthly: process.env.NEXT_PUBLIC_STRIPE_API_MONTHLY_URL || 'https://buy.stripe.com/api-monthly',
};

export default function ProPage() {
  const [billingPeriod, setBillingPeriod] = useState<BillingPeriod>('monthly');
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);

  const toggleFaq = (index: number) => {
    setOpenFaqIndex(openFaqIndex === index ? null : index);
  };

  const proPrice = billingPeriod === 'monthly' ? 12 : 99;
  const proPeriod = billingPeriod === 'monthly' ? 'mo' : 'yr';
  const proCheckoutUrl = billingPeriod === 'monthly' ? STRIPE_URLS.proMonthly : STRIPE_URLS.proAnnual;

  const faqs = [
    {
      question: 'What does my API key unlock?',
      answer:
        'Access to /api/premium/* endpoints: win probability, leverage scores, pitch-by-pitch data, and historical pitcher stats.',
    },
    {
      question: 'Can I cancel anytime?',
      answer:
        'Yes. Cancel from your Stripe billing portal. Your key remains active until the end of the billing period.',
    },
    {
      question: "I'm a scout or media partner - is there an enterprise option?",
      answer: 'Yes. Email Austin@BlazeSportsIntel.com for custom licensing.',
    },
  ];

  return (
    <>
      <main id="main-content" className="min-h-screen bg-[#0D0D0D]">
        {/* Header */}
        <div className="border-b border-white/[0.04] bg-[#0D0D0D]/95 backdrop-blur-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
            <Link
              href="/"
              className="font-oswald text-2xl font-bold uppercase tracking-wide text-[#BF5700] hover:text-[#FF6B35] transition-colors"
            >
              BSI
            </Link>
            <Link
              href="/"
              className="text-sm text-white/60 hover:text-white transition-colors font-mono"
            >
              ← Back to Home
            </Link>
          </div>
        </div>

        {/* Hero Section */}
        <section className="pt-20 pb-12 px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="font-oswald text-4xl md:text-6xl lg:text-7xl font-bold uppercase tracking-wide text-[#F5F0EB] mb-6">
              UNLOCK THE INTELLIGENCE
            </h1>
            <p className="font-cormorant text-xl md:text-2xl italic text-white/80 max-w-3xl mx-auto">
              Real-time college baseball data. Pitch-level. Win probability. Leverage scores. Built
              for fans who want the full picture.
            </p>
          </div>
        </section>

        {/* Billing Toggle */}
        <div className="pb-8 px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto flex items-center justify-center gap-4">
            <button
              onClick={() => setBillingPeriod('monthly')}
              className={`px-4 py-2 rounded-lg font-mono text-sm transition-all ${
                billingPeriod === 'monthly'
                  ? 'bg-[#BF5700] text-white'
                  : 'bg-transparent text-white/60 hover:text-white'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingPeriod('annual')}
              className={`px-4 py-2 rounded-lg font-mono text-sm transition-all ${
                billingPeriod === 'annual'
                  ? 'bg-[#BF5700] text-white'
                  : 'bg-transparent text-white/60 hover:text-white'
              }`}
            >
              Annual
            </button>
            {billingPeriod === 'annual' && (
              <span className="font-mono text-xs bg-[#BF5700] text-white px-2 py-1 rounded">
                Save 31%
              </span>
            )}
          </div>
        </div>

        {/* Pricing Cards */}
        <section className="pb-16 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* FREE */}
              <div
                className="bg-[rgba(26,26,26,0.6)] border border-[rgba(245,240,235,0.04)] rounded-lg p-6 transition-transform hover:-translate-y-1 duration-200"
              >
                <div className="mb-6">
                  <h3 className="font-oswald text-2xl font-bold uppercase text-white mb-2">
                    FREE
                  </h3>
                  <div className="flex items-baseline gap-1 mb-4">
                    <span className="font-oswald text-4xl font-bold text-white">$0</span>
                    <span className="text-white/60">/mo</span>
                  </div>
                </div>

                <ul className="space-y-3 mb-8 min-h-[280px]">
                  {[
                    'Game scores',
                    'Standings',
                    'Team stats',
                    'Editorial content',
                  ].map((feature) => (
                    <li key={feature} className="flex items-start gap-3">
                      <svg
                        className="w-5 h-5 text-[#10b981] flex-shrink-0 mt-0.5"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                      <span className="text-white/70 text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>

                <button
                  disabled
                  className="w-full px-4 py-3 rounded-lg font-semibold text-sm border border-white/20 text-white/60 cursor-not-allowed"
                >
                  Currently Free
                </button>
              </div>

              {/* PRO */}
              <div
                className="bg-[rgba(26,26,26,0.6)] border-t-[3px] border-t-[#BF5700] border-x border-x-[rgba(245,240,235,0.04)] border-b border-b-[rgba(245,240,235,0.04)] rounded-lg p-6 transition-transform hover:-translate-y-1 duration-200 relative"
              >
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#BF5700] text-white px-3 py-1 rounded text-xs font-mono uppercase">
                  Most Popular
                </div>

                <div className="mb-6">
                  <h3 className="font-oswald text-2xl font-bold uppercase text-white mb-2">PRO</h3>
                  <div className="flex items-baseline gap-1 mb-4">
                    <span className="font-oswald text-4xl font-bold text-[#BF5700]">
                      ${proPrice}
                    </span>
                    <span className="text-white/60">/{proPeriod}</span>
                  </div>
                  <p className="text-sm text-white/60">All Free features +</p>
                </div>

                <ul className="space-y-3 mb-8 min-h-[280px]">
                  {[
                    'Win probability',
                    'Leverage scores',
                    'Pitch-by-pitch log',
                    'Push notifications',
                    'Post-game data drops',
                  ].map((feature) => (
                    <li key={feature} className="flex items-start gap-3">
                      <svg
                        className="w-5 h-5 text-[#10b981] flex-shrink-0 mt-0.5"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                      <span className="text-white/70 text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>

                <a
                  href={proCheckoutUrl}
                  className="block w-full px-4 py-3 rounded-lg font-semibold text-sm bg-[#BF5700] hover:bg-[#BF5700]/80 text-white text-center transition-colors"
                >
                  Get Pro Access →
                </a>
              </div>

              {/* DATA API */}
              <div
                className="bg-[rgba(26,26,26,0.6)] border border-[rgba(245,240,235,0.04)] rounded-lg p-6 transition-transform hover:-translate-y-1 duration-200"
              >
                <div className="mb-6">
                  <h3 className="font-oswald text-2xl font-bold uppercase text-white mb-2">
                    DATA API
                  </h3>
                  <div className="flex items-baseline gap-1 mb-4">
                    <span className="font-oswald text-4xl font-bold text-white">$199</span>
                    <span className="text-white/60">/mo</span>
                  </div>
                  <p className="text-sm text-white/60">All Pro features +</p>
                </div>

                <ul className="space-y-3 mb-8 min-h-[280px]">
                  {[
                    'Raw API access',
                    'Pitcher tracking data',
                    'Historical database',
                    'Embeddable widget',
                    'B2B licensing',
                  ].map((feature) => (
                    <li key={feature} className="flex items-start gap-3">
                      <svg
                        className="w-5 h-5 text-[#10b981] flex-shrink-0 mt-0.5"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                      <span className="text-white/70 text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>

                <a
                  href={STRIPE_URLS.apiMonthly}
                  className="block w-full px-4 py-3 rounded-lg font-semibold text-sm border-2 border-[#BF5700] text-[#BF5700] hover:bg-[#BF5700] hover:text-white text-center transition-colors"
                >
                  Get API Access →
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* Trust Signals */}
        <section className="py-8 px-4 sm:px-6 lg:px-8 border-y border-white/[0.04]">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 text-center">
              {[
                'Live data from Highlightly Pro',
                'Secured by Stripe',
                'Cancel anytime',
                'Keys delivered instantly via email',
              ].map((signal) => (
                <div key={signal} className="flex flex-col items-center">
                  <span className="font-mono text-[0.65rem] text-[#BF5700]">//</span>
                  <span className="font-mono text-xs text-[#F5F0EB] mt-1">{signal}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="py-16 px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto">
            <h2 className="font-oswald text-3xl font-bold uppercase text-white mb-8 text-center">
              FREQUENTLY ASKED QUESTIONS
            </h2>
            <div className="space-y-4">
              {faqs.map((faq, index) => (
                <div
                  key={index}
                  className="bg-[rgba(26,26,26,0.6)] border border-[rgba(245,240,235,0.04)] rounded-lg overflow-hidden"
                >
                  <button
                    onClick={() => toggleFaq(index)}
                    className="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-white/5 transition-colors"
                  >
                    <span className="font-semibold text-white pr-4">{faq.question}</span>
                    <svg
                      className={`w-5 h-5 text-white/60 flex-shrink-0 transition-transform ${
                        openFaqIndex === index ? 'rotate-180' : ''
                      }`}
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <polyline points="6 9 12 15 18 9" />
                    </svg>
                  </button>
                  {openFaqIndex === index && (
                    <div className="px-6 pb-4">
                      <p className="text-white/70 text-sm leading-relaxed">{faq.answer}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Footer CTA */}
        <section className="py-12 px-4 sm:px-6 lg:px-8 bg-[rgba(26,26,26,0.6)] border-t border-white/[0.04]">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="font-oswald text-2xl md:text-3xl font-bold uppercase text-white mb-4">
              Questions?
            </h2>
            <p className="text-white/70 mb-6">Reach out anytime. I read every email.</p>
            <a
              href="mailto:Austin@BlazeSportsIntel.com"
              className="text-[#BF5700] hover:text-[#FF6B35] transition-colors font-semibold"
            >
              Austin@BlazeSportsIntel.com
            </a>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}
