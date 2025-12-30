import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'V.P. Player',
  description: 'Netflix-style video player with Supabase integration',
  icons: {
    icon: '/logoIcon.png',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}


