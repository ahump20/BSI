import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Sign Up | Blaze Sports Intel',
  description: 'Create your Blaze Sports Intel account. Get access to college baseball analytics and more.',
};

export default function SignupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
