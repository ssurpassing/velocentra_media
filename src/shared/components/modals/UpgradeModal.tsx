'use client';

import { useTranslations } from 'next-intl';
import * as Dialog from '@radix-ui/react-dialog';
import { X, Crown, Sparkles, Check } from 'lucide-react';
import { Button } from '@/shared/components/ui/Button';
import { useRouter } from '@/navigation';

interface UpgradeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  feature?: string; // 需要升级才能使用的功能名称
}

export function UpgradeModal({ open, onOpenChange, feature }: UpgradeModalProps) {
  const t = useTranslations('upgradeModal');
  const router = useRouter();

  const handleUpgrade = () => {
    onOpenChange(false);
    router.push('/pricing');
  };

  const benefits = [
    'unlimitedGeneration',
    'priorityQueue',
    'higherQuality',
    'advancedFeatures',
    'noWatermark',
  ];

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 animate-in fade-in" />
        <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-lg animate-in fade-in zoom-in-95 slide-in-from-bottom-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl overflow-hidden">
            {/* 渐变背景头部 */}
            <div className="relative bg-gradient-to-br from-amber-500 via-orange-500 to-amber-600 p-8 text-white">
              {/* 装饰性背景图案 */}
              <div className="absolute inset-0 opacity-10">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white rounded-full blur-3xl transform translate-x-1/2 -translate-y-1/2" />
                <div className="absolute bottom-0 left-0 w-48 h-48 bg-white rounded-full blur-3xl transform -translate-x-1/2 translate-y-1/2" />
              </div>

              {/* 关闭按钮 */}
              <Dialog.Close className="absolute top-4 right-4 p-2 rounded-lg hover:bg-white/20 transition-colors">
                <X className="h-5 w-5" />
              </Dialog.Close>

              {/* 图标和标题 */}
              <div className="relative text-center">
                <div className="inline-flex items-center justify-center w-20 h-20 bg-white/20 backdrop-blur-sm rounded-2xl mb-4">
                  <Crown className="h-10 w-10 text-white" />
                </div>
                <Dialog.Title className="text-2xl font-bold mb-2">
                  {t('title')}
                </Dialog.Title>
                <Dialog.Description className="text-white/90 text-base">
                  {feature ? t('featureRequiresPro', { feature }) : t('description')}
                </Dialog.Description>
              </div>
            </div>

            {/* 内容区域 */}
            <div className="p-8">
              {/* 会员权益列表 */}
              <div className="space-y-3 mb-6">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">
                  {t('benefits')}
                </h3>
                {benefits.map((benefit) => (
                  <div key={benefit} className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-5 h-5 rounded-full bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center mt-0.5">
                      <Check className="h-3 w-3 text-white" />
                    </div>
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                      {t(benefit)}
                    </span>
                  </div>
                ))}
              </div>

              {/* 特别优惠提示 */}
              <div className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4 mb-6">
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                  <span className="text-sm font-semibold text-amber-900 dark:text-amber-100">
                    {t('specialOffer')}
                  </span>
                </div>
                <p className="text-xs text-amber-800 dark:text-amber-200">
                  {t('offerDescription')}
                </p>
              </div>

              {/* 按钮组 */}
              <div className="flex gap-3">
                <Button
                  onClick={() => onOpenChange(false)}
                  variant="outline"
                  className="flex-1"
                  size="lg"
                >
                  {t('maybeLater')}
                </Button>
                <Button
                  onClick={handleUpgrade}
                  className="flex-1 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shadow-lg shadow-amber-500/25"
                  size="lg"
                >
                  <Crown className="h-4 w-4 mr-2" />
                  {t('upgradeNow')}
                </Button>
              </div>
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
