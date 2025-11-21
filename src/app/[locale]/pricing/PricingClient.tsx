'use client';

import { useState } from 'react';
import { Check } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Button } from '@/shared/components/ui/Button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/shared/components/ui/Card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/ui/Tabs';
import { PRICING_PLANS } from '@/shared/config/pricing';
import { http } from '@/infrastructure/http/client';
import { useAuth } from '@/shared/contexts/AuthContext';
import { useRouter } from '@/navigation';

export function PricingClient() {
  const { user } = useAuth();
  const router = useRouter();
  const t = useTranslations();
  const [loading, setLoading] = useState<string | null>(null);

  const handlePurchase = async (planId: string) => {
    if (!user) {
      router.push('/auth/login');
      return;
    }

    const plan = PRICING_PLANS.find((p) => p.id === planId);
    if (!plan) return;

    try {
      setLoading(planId);
      
      const response = await http.post('/payment/create-checkout', {
        planId: planId,
        type: plan.interval ? 'subscription' : 'payment',
      });

      if (response.success && response.data.url) {
        window.location.href = response.data.url;
      }
    } catch (error) {
      console.error('Purchase error:', error);
    } finally {
      setLoading(null);
    }
  };

  // 按类型分组方案
  const monthlyPlans = PRICING_PLANS.filter(p => p.interval === 'month');
  const yearlyPlans = PRICING_PLANS.filter(p => p.interval === 'year');
  const creditPlans = PRICING_PLANS.filter(p => !p.interval);

  const renderPlanCard = (plan: typeof PRICING_PLANS[0]) => (
    <Card key={plan.id} className={`relative ${plan.popular ? 'border-primary shadow-lg' : ''}`}>
      {plan.popular && (
        <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-primary text-primary-foreground text-sm font-medium rounded-full">
          {t('pricing.popular')}
        </div>
      )}
      <CardHeader>
        <CardTitle>{plan.name}</CardTitle>
        <CardDescription>{plan.description}</CardDescription>
        <div className="mt-4">
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-bold">${plan.price}</span>
            {plan.originalPrice && (
              <span className="text-lg text-muted-foreground line-through">
                ${plan.originalPrice}
              </span>
            )}
          </div>
          {plan.interval === 'year' && (
            <span className="text-sm text-muted-foreground">
              {t('pricing.billedAnnually')}
            </span>
          )}
          {plan.discount && (
            <div className="inline-block mt-2 px-2 py-1 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-100 text-xs font-semibold rounded">
              {t('pricing.save')} {plan.discount}
            </div>
          )}
        </div>
      {plan.credits && (
        <p className="text-sm text-muted-foreground mt-2">
          {plan.interval === 'year' 
            ? `${plan.credits * 12} ${t('common.credits')}${t('pricing.perYear')}`
            : `${plan.credits} ${t('common.credits')}${plan.interval ? t('pricing.perMonth') : ''}`
          }
        </p>
      )}
      </CardHeader>
      <CardContent>
        <ul className="space-y-3">
          {plan.features.map((feature, index) => (
            <li key={index} className="flex items-start">
              <Check className="h-5 w-5 text-primary mr-2 flex-shrink-0 mt-0.5" />
              <span className="text-sm">{feature}</span>
            </li>
          ))}
        </ul>
      </CardContent>
      <CardFooter>
        <Button
          className="w-full"
          variant={plan.popular ? 'default' : 'outline'}
          onClick={() => handlePurchase(plan.id)}
          loading={loading === plan.id}
          disabled={loading !== null}
        >
          {plan.interval ? t('pricing.subscribe') : t('pricing.buyNow')}
        </Button>
      </CardFooter>
    </Card>
  );

  return (
    <div className="container mx-auto px-4 py-20">
      <div className="text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-bold mb-4">{t('pricing.title')}</h1>
        <p className="text-xl text-muted-foreground">{t('pricing.subtitle')}</p>
      </div>

      <Tabs defaultValue="monthly" className="w-full max-w-7xl mx-auto">
        <TabsList className="grid w-full max-w-md mx-auto grid-cols-3 mb-8">
          <TabsTrigger value="monthly">{t('pricing.monthly')}</TabsTrigger>
          <TabsTrigger value="yearly">{t('pricing.yearly')}</TabsTrigger>
          <TabsTrigger value="credits">{t('pricing.credits')}</TabsTrigger>
        </TabsList>

        <TabsContent value="monthly" className="mt-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {monthlyPlans.map(renderPlanCard)}
          </div>
        </TabsContent>

        <TabsContent value="yearly" className="mt-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {yearlyPlans.map(renderPlanCard)}
          </div>
        </TabsContent>

        <TabsContent value="credits" className="mt-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {creditPlans.map(renderPlanCard)}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

