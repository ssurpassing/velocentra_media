import { Suspense } from 'react';
import { CheckCircle } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { getTranslations } from 'next-intl/server';
import { Link } from '@/navigation';
import { Button } from '@/shared/components/ui/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/Card';

export async function generateMetadata({ params }: { params: { locale: string } }) {
  const t = await getTranslations({ locale: params.locale });
  return {
    title: t('payment.success.title'),
  };
}

function SuccessContent() {
  const t = useTranslations('payment.success');

  return (
    <div className="container mx-auto px-4 py-20">
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900">
              <CheckCircle className="h-10 w-10 text-green-600 dark:text-green-400" />
            </div>
            <CardTitle className="text-3xl">{t('title')}</CardTitle>
            <CardDescription className="text-lg mt-2">
              {t('description')}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="bg-muted p-4 rounded-lg">
              <h3 className="font-semibold mb-2">{t('whatNext')}</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>✓ {t('creditsAdded')}</li>
                <li>✓ {t('receiptSent')}</li>
                <li>✓ {t('readyToUse')}</li>
              </ul>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <Button asChild className="flex-1">
                <Link href="/dashboard">{t('goToDashboard')}</Link>
              </Button>
              <Button asChild variant="outline" className="flex-1">
                <Link href="/generate">{t('startCreating')}</Link>
              </Button>
            </div>

            <div className="text-center text-sm text-muted-foreground">
              {t('needHelp')}{' '}
              <Link href="/contact" className="text-primary hover:underline">
                {t('contactSupport')}
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function PaymentSuccessPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <SuccessContent />
    </Suspense>
  );
}
