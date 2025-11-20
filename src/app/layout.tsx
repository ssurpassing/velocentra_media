import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '@/shared/contexts/AuthContext';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.aitownlab.com';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: 'Ai Town Lab - AI 专业头像生成器',
    template: '%s - Ai Town Lab',
  },
  description: 'AI 驱动的专业头像生成器，快速将自拍转换为高质量职业头像',
  keywords: ['AI头像', '专业头像', '头像生成器', 'AI照片', '职业形象照', 'LinkedIn头像'],
  authors: [{ name: 'Ai Town Lab' }],
  creator: 'Ai Town Lab',
  publisher: 'Ai Town Lab',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    type: 'website',
    locale: 'zh_CN',
    url: SITE_URL,
    siteName: 'Ai Town Lab',
    title: 'Ai Town Lab - AI 专业头像生成器',
    description: 'AI 驱动的专业头像生成器，快速将自拍转换为高质量职业头像',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'Ai Town Lab',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Ai Town Lab - AI 专业头像生成器',
    description: 'AI 驱动的专业头像生成器，快速将自拍转换为高质量职业头像',
    images: ['/twitter-image.jpg'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    // google: 'your-google-verification-code',
    // yandex: 'your-yandex-verification-code',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthProvider>
      {children}
    </AuthProvider>
  );
}


