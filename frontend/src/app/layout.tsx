import type { Metadata } from 'next';
import './globals.css';
import Navbar from '@/components/Navbar';

export const metadata: Metadata = {
  title: 'Smart Healthcare & Doctor Appointment Management System',
  description: 'Comprehensive clinical appointment scheduling, digital prescription, pharmacy inventory, and billing management system.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-slate-50 text-slate-800">
        <Navbar />
        <main className="flex-1">{children}</main>
      </body>
    </html>
  );
}
