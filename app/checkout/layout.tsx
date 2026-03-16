import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Checkout | Blaze Sports Intel',
  description: 'Complete your BSI Pro subscription checkout.',
  robots: { index: false, follow: false },
};

export default function CheckoutLayout({ children }: { children: React.ReactNode }) {
  return children;
}
