import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '@/context/AuthContext';
import LayoutWrapper from '@/components/LayoutWrapper';

export const metadata: Metadata = {
  title: 'HiFeed - Sustainable Cattle Farming | Dashboard',
  description: 'HiFeed Supply Chain & Operations Management Dashboard - Transforming cattle farming with sustainable complete feed technology.',
  icons: {
    icon: '/favicon.ico',
    apple: '/hifeed_logo.png',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id">
      <body>
        <AuthProvider>
          <LayoutWrapper>
            {children}
          </LayoutWrapper>
        </AuthProvider>
      </body>
    </html>
  );
}

