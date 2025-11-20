import { HomePage } from '@/features/home/HomePage';
import { getInnovationLabExamples } from '@/lib/innovation-lab';
import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';

// 添加缓存和重新验证
export const revalidate = 3600; // 1小时重新验证一次
export const dynamic = 'force-static'; // 强制静态生成

function InnovationLabSkeleton() {
  return (
    <div className="flex items-center justify-center py-20">
      <div className="text-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
        <p className="text-muted-foreground">加载中...</p>
      </div>
    </div>
  );
}

async function InnovationLabData({ locale }: { locale: string }) {
  // 服务端获取创新实验室示例，带超时保护
  const timeoutPromise = new Promise((_, reject) => 
    setTimeout(() => reject(new Error('Timeout')), 5000)
  );
  
  try {
    const result = await Promise.race([
      getInnovationLabExamples(locale, 10, 'homepage'),
      timeoutPromise
    ]) as any;
    
    const examples = result.success ? result.data : [];
    return <HomePage innovationExamples={examples} />;
  } catch (error) {
    console.error('Failed to load innovation lab examples:', error);
    // 超时或失败时返回空数据
    return <HomePage innovationExamples={[]} />;
  }
}

export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  
  return (
    <Suspense fallback={<InnovationLabSkeleton />}>
      <InnovationLabData locale={locale} />
    </Suspense>
  );
}


