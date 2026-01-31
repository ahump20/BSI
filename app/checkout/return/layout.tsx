import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Checkout | Blaze Sports Intel',
  description: 'Complete your subscription to Blaze Sports Intel.',
  robots: 'noindex',
};

export default function CheckoutReturnLayout({ children }: { children: React.ReactNode }) {
  return children;
}
