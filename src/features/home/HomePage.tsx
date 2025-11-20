import { ModernHeroSection } from './components/ModernHeroSection';
import { TrustIndicators } from './components/TrustIndicators';
import { BeforeAfterShowcase } from './components/BeforeAfterShowcase';
import { MultiFunctionShowcase } from './components/MultiFunctionShowcase';
import { VideoShowcase } from './components/VideoShowcase';
import { CreativeGallery } from './components/CreativeGallery';
import { PricingSection } from './components/PricingSection';
import { FAQSection } from './components/FAQSection';

interface InnovationExample {
  id: string;
  title: string;
  description: string;
  mediaType: 'video' | 'image';
  videoUrl?: string;
  imageUrl?: string;
  thumbnailUrl?: string;
  prompt: string;
  targetPage: 'ai-image' | 'ai-video';
  tutorialUrl?: string;
  tutorialText?: string;
  aspectRatioParam?: string;
  styleParam?: string;
  referenceImageUrl?: string;
  seoKeywords?: string[];
}

interface HomePageProps {
  innovationExamples: InnovationExample[];
}

export function HomePage({ innovationExamples }: HomePageProps) {
  return (
    <main>
      {/* 🎯 第一屏：主视觉 */}
      <ModernHeroSection />
      
      {/* 📊 第二屏：核心优势 */}
      <TrustIndicators />
      
      {/* 🎨 第三屏：多功能展示（图片+视频） */}
      <MultiFunctionShowcase />
      
      {/* 🎬 第四屏：视频专区 */}
      <VideoShowcase />
      
      {/* 📸 第五屏：前后对比 */}
      <BeforeAfterShowcase />
      
      {/* 🖼️ 第六屏：创意作品画廊（替代创新实验室） */}
      <CreativeGallery />
      
      {/* 💰 第七屏：定价方案 */}
      <PricingSection />
      
      {/* ❓ 第九屏：常见问题 */}
      <FAQSection />
    </main>
  );
}


