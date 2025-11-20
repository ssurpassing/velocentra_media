'use client';

import { useTranslations } from 'next-intl';
import * as Accordion from '@radix-ui/react-accordion';
import { ChevronDown } from 'lucide-react';

const FAQ_ITEMS = ['q1', 'q2', 'q3', 'q4', 'q5', 'q6', 'q7', 'q8'];

export function FAQSection() {
  const t = useTranslations();

  return (
    <section id="faq" className="py-20">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-[1600px] mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-5xl font-bold mb-4">
              {t('faq.title')}
            </h2>
            <p className="text-xl text-muted-foreground">
              {t('faq.subtitle')}
            </p>
          </div>

          <div>
            <Accordion.Root type="single" collapsible className="space-y-4">
              {FAQ_ITEMS.map((item, index) => (
                <Accordion.Item
                  key={item}
                  value={`item-${index}`}
                  className="border rounded-lg px-6 py-4 bg-card"
                >
                  <Accordion.Header>
                    <Accordion.Trigger className="flex w-full items-center justify-between text-left font-medium hover:text-primary transition-colors">
                      <span>{t(`faq.${item}`)}</span>
                      <ChevronDown className="h-5 w-5 transition-transform duration-200 [[data-state=open]>&]:rotate-180" />
                    </Accordion.Trigger>
                  </Accordion.Header>
                  <Accordion.Content className="pt-4 text-muted-foreground">
                    {t(`faq.a${item.slice(1)}`)}
                  </Accordion.Content>
                </Accordion.Item>
              ))}
            </Accordion.Root>
          </div>
        </div>
      </div>
    </section>
  );
}


