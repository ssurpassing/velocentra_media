'use client';

import { useTranslations } from 'next-intl';
import { Link } from '@/navigation';

export function Footer() {
  const t = useTranslations('footer');
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t bg-background">
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {/* 产品 */}
            <div>
              <h3 className="font-semibold mb-4">{t('sections.product')}</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <Link href="/generate" className="hover:text-foreground transition-colors">
                    {t('links.generate')}
                  </Link>
                </li>
                <li>
                  <Link href="/pricing" className="hover:text-foreground transition-colors">
                    {t('links.pricing')}
                  </Link>
                </li>
                <li>
                  <Link href="#examples" className="hover:text-foreground transition-colors">
                    {t('links.examples')}
                  </Link>
                </li>
              </ul>
            </div>

            {/* 资源 */}
            <div>
              <h3 className="font-semibold mb-4">{t('sections.resources')}</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <Link href="#faq" className="hover:text-foreground transition-colors">
                    {t('links.faq')}
                  </Link>
                </li>
                <li>
                  <Link href="/docs" className="hover:text-foreground transition-colors">
                    {t('links.docs')}
                  </Link>
                </li>
                <li>
                  <Link href="/blog" className="hover:text-foreground transition-colors">
                    {t('links.blog')}
                  </Link>
                </li>
              </ul>
            </div>

            {/* 公司 */}
            <div>
              <h3 className="font-semibold mb-4">{t('sections.company')}</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <Link href="/about" className="hover:text-foreground transition-colors">
                    {t('links.about')}
                  </Link>
                </li>
                <li>
                  <Link href="/privacy" className="hover:text-foreground transition-colors">
                    {t('links.privacy')}
                  </Link>
                </li>
                <li>
                  <Link href="/terms" className="hover:text-foreground transition-colors">
                    {t('links.terms')}
                  </Link>
                </li>
              </ul>
            </div>

            {/* 联系 */}
            <div>
              <h3 className="font-semibold mb-4">{t('sections.contact')}</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <a href="mailto:support@aitownlab.com" className="hover:text-foreground transition-colors">
                    support@aitownlab.com
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <div className="mt-8 pt-8 border-t text-center text-sm text-muted-foreground">
            <p>{t('copyright', { year: currentYear })}</p>
            <p className="mt-2 text-xs">{t('operatedBy')}</p>
          </div>
        </div>
      </div>
    </footer>
  );
}


