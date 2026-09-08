import { Hanken_Grotesk, JetBrains_Mono } from 'next/font/google';
import type { Metadata } from 'next';
import "./globals.css";

const hanken = Hanken_Grotesk({
  subsets: ['latin'],
  variable: '--font-hanken',
  display: 'swap',
  weight: ['400', '600', '700'],
});

const jetbrains = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-jetbrains',
  display: 'swap',
  weight: ['500'],
});

export const metadata: Metadata = {
  title: 'Tournament Registration Portal',
  description: 'Register your team and track your submission through review.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`dark ${hanken.variable} ${jetbrains.variable}`}>
      <body className="text-on-surface font-sans antialiased min-h-screen selection:bg-primary-container/30 selection:text-primary">
        {children}
      </body>
    </html>
  );
}