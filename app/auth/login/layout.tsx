import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Sign In | Blaze Sports Intel',
  description: 'Sign in to your Blaze Sports Intel account.',
};

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
