import { Suspense } from 'react';
import { getTranslations } from 'next-intl/server';
import { DashboardClient } from './DashboardClient';

export async function generateMetadata({ params }: { params: { locale: string } }) {
  const t = await getTranslations({ locale: params.locale });
  return {
    title: t('dashboard.title'),
  };
}

export default function DashboardPage() {
  return (
    <Suspense fallback={<div className="container mx-auto px-4 py-20">Loading...</div>}>
      <DashboardClient />
    </Suspense>
  );
}
