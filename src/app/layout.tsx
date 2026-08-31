import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Tournament Registration Portal',
  description: 'Register your team and track your submission through review.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
