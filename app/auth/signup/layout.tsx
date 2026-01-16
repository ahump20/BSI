import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Sign Up | Blaze Sports Intel',
  description:
    'Create your Blaze Sports Intel account. Get access to professional sports analytics for MLB, NFL, and NCAA.',
};

export default function SignupLayout({ children }: { children: React.ReactNode }) {
  return children;
}
