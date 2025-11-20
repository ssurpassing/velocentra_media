import { getRequestConfig } from 'next-intl/server';
import { locales, defaultLocale } from './config';

export default getRequestConfig(async ({ locale, requestLocale }) => {
  // Use requestLocale (from URL segment) if available, otherwise fall back to locale parameter
  const requestedLocale = locale || (await requestLocale);
  
  // Validate that the incoming locale is valid and supported
  const validLocale = requestedLocale && locales.includes(requestedLocale as any) 
    ? requestedLocale 
    : defaultLocale;

  return {
    locale: validLocale,
    messages: (await import(`../../locales/${validLocale}/common.json`)).default,
  };
});


