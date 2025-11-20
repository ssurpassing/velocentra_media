import { redirect } from 'next/navigation';

interface GeneratePageProps {
  params: {
    locale: string;
  };
}

// 重定向到新的创意画廊页面
export default function GeneratePage({ params }: GeneratePageProps) {
  const { locale } = params;
  redirect(`/${locale}/create?type=image`);
}
