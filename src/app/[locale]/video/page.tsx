/**
 * 视频生成页面
 */

import { VideoGenerator } from '@/features/video';
import { getTranslations } from 'next-intl/server';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'seo.aiVideo' });

  return {
    title: t('title'),
    description: t('description'),
    keywords: t('keywords').split(','),
  };
}

export default function VideoPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            AI 视频生成器
          </h1>
          <p className="text-gray-600">
            使用 Veo 3.1 强大的 AI 技术生成专业级视频
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <VideoGenerator />
      </div>

      {/* Features Section */}
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-lg p-6 shadow-sm">
            <div className="text-3xl mb-3">🎬</div>
            <h3 className="font-semibold mb-2">文本转视频</h3>
            <p className="text-sm text-gray-600">
              只需输入文字描述，AI 即可自动生成高质量视频内容
            </p>
          </div>
          
          <div className="bg-white rounded-lg p-6 shadow-sm">
            <div className="text-3xl mb-3">🖼️</div>
            <h3 className="font-semibold mb-2">图片转视频</h3>
            <p className="text-sm text-gray-600">
              上传图片，让 AI 为图片添加动态效果，生成流畅的视频
            </p>
          </div>
          
          <div className="bg-white rounded-lg p-6 shadow-sm">
            <div className="text-3xl mb-3">⚡</div>
            <h3 className="font-semibold mb-2">快速生成</h3>
            <p className="text-sm text-gray-600">
              2-5 分钟即可完成视频生成，支持多种宽高比和质量选项
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

