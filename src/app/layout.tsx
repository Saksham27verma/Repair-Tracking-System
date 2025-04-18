import { Inter } from 'next/font/google';
import "./globals.css";
import Providers from './components/Providers';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'Repair Tracking System',
  description: 'Track your repair orders efficiently',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
} 