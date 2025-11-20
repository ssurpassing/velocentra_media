import { Metadata } from 'next';
import { locales, type Locale } from '@/i18n/config';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.aitownlab.com';
const SITE_NAME = 'Ai Town Lab';

// Locale mapping for OpenGraph and hreflang tags
const localeMapping: Record<Locale, string> = {
  zh: 'zh_CN',
  en: 'en_US',
  ja: 'ja_JP',
  ko: 'ko_KR',
  fr: 'fr_FR',
  de: 'de_DE',
  es: 'es_ES',
};

interface SEOProps {
  title: string;
  description: string;
  path?: string;
  locale?: Locale;
  image?: string;
  keywords?: string[];
}

export function generateMetadata({
  title,
  description,
  path = '',
  locale = 'zh',
  image = '/og-image.jpg',
  keywords = [],
}: SEOProps): Metadata {
  const url = `${SITE_URL}/${locale}${path}`;
  const fullTitle = `${title} - ${SITE_NAME}`;

  // Generate alternates for all supported languages
  const languages: Record<string, string> = {};
  locales.forEach((loc) => {
    const hreflangCode = localeMapping[loc].replace('_', '-');
    languages[hreflangCode] = `${SITE_URL}/${loc}${path}`;
  });

  return {
    title: fullTitle,
    description,
    keywords: keywords.length > 0 ? keywords.join(', ') : undefined,
    openGraph: {
      title: fullTitle,
      description,
      url,
      siteName: SITE_NAME,
      images: [
        {
          url: `${SITE_URL}${image}`,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
      locale: localeMapping[locale],
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: fullTitle,
      description,
      images: [`${SITE_URL}${image}`],
    },
    alternates: {
      canonical: url,
      languages,
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
  };
}

export function generateOrganizationSchema(locale: Locale = 'zh') {
  const descriptions: Record<Locale, string> = {
    zh: 'AI 驱动的专业图像和视频生成平台，提供快速、高质量的AI创作服务',
    en: 'AI-powered professional image and video generation platform for high-quality creative content',
    ja: 'AIを活用したプロフェッショナル画像・動画生成プラットフォーム',
    ko: 'AI 기반 전문 이미지 및 비디오 생성 플랫폼',
    fr: 'Plateforme de génération d\'images et de vidéos professionnelles alimentée par l\'IA',
    de: 'KI-gestützte professionelle Bild- und Videogenerierungsplattform',
    es: 'Plataforma de generación de imágenes y videos profesionales con IA',
  };

  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: SITE_NAME,
    legalName: 'Velocentra CO',
    alternateName: '维洛森',
    url: `${SITE_URL}/${locale}`,
    logo: `${SITE_URL}/logo.png`,
    description: descriptions[locale] || descriptions['zh'],
    sameAs: [
      // 添加社交媒体链接
    ],
  };
}

export function generateWebSiteSchema(locale: Locale = 'zh') {
  const mappedLocale = localeMapping[locale] || localeMapping['zh'];
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: SITE_NAME,
    url: `${SITE_URL}/${locale}`,
    inLanguage: mappedLocale.replace('_', '-'),
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${SITE_URL}/${locale}/search?q={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  };
}

export function generateBreadcrumbSchema(
  items: Array<{ name: string; url: string }>,
  locale: Locale = 'zh'
) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: `${SITE_URL}/${locale}${item.url}`,
    })),
  };
}

export function generateSoftwareApplicationSchema(locale: Locale = 'zh') {
  const names: Record<Locale, string> = {
    zh: 'AI Town Lab - AI 图像与视频生成平台',
    en: 'AI Town Lab - AI Image & Video Generation Platform',
    ja: 'AI Town Lab - AI画像・動画生成プラットフォーム',
    ko: 'AI Town Lab - AI 이미지 및 비디오 생성 플랫폼',
    fr: 'AI Town Lab - Plateforme de Génération d\'Images et Vidéos IA',
    de: 'AI Town Lab - KI-Bild- und Videogenerierungsplattform',
    es: 'AI Town Lab - Plataforma de Generación de Imágenes y Videos con IA',
  };

  const descriptions: Record<Locale, string> = {
    zh: '使用先进AI技术快速生成高质量图像和视频内容，支持多种创作场景',
    en: 'Generate high-quality images and videos with advanced AI technology for various creative scenarios',
    ja: '先進的なAI技術で高品質な画像と動画を迅速に生成',
    ko: '고급 AI 기술로 고품질 이미지 및 비디오를 빠르게 생성',
    fr: 'Générez des images et vidéos de haute qualité avec une technologie IA avancée',
    de: 'Generieren Sie hochwertige Bilder und Videos mit fortschrittlicher KI-Technologie',
    es: 'Genere imágenes y videos de alta calidad con tecnología de IA avanzada',
  };

  return {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: names[locale] || names['zh'],
    applicationCategory: 'MultimediaApplication',
    description: descriptions[locale] || descriptions['zh'],
    operatingSystem: 'Web',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'CNY',
    },
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: '4.8',
      ratingCount: '1000',
    },
  };
}

