-- ========================================
-- Migration: 添加首页示例 - 专业LinkedIn头像
-- Date: 2025-11-10
-- Description: 将专业LinkedIn头像设置为首页展示示例，包含多语言SEO内容
-- ========================================

-- Step 1: 更新 generation_task，设置为首页展示
UPDATE public.generation_tasks 
SET 
  display_location = 'homepage',
  display_order = 1
WHERE id = '2ea464d7d9de4c8d25b8b746255d3796';

-- Step 2: 插入多语言 SEO 内容

-- 中文 (zh)
INSERT INTO public.generation_tasks_i18n (task_id, locale, title, description)
VALUES (
  '2ea464d7d9de4c8d25b8b746255d3796',
  'zh',
  'AI专业头像生成 - LinkedIn商务形象照',
  '使用AI技术生成高质量的LinkedIn专业头像。自动优化面部光影、构图和背景，打造完美的职业形象照片。适合求职、社交媒体和商务场合使用。'
)
ON CONFLICT (task_id, locale) 
DO UPDATE SET 
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  updated_at = NOW();

-- 英文 (en)
INSERT INTO public.generation_tasks_i18n (task_id, locale, title, description)
VALUES (
  '2ea464d7d9de4c8d25b8b746255d3796',
  'en',
  'AI Professional Headshot Generator - LinkedIn Business Portrait',
  'Generate high-quality LinkedIn professional headshots using AI technology. Automatically optimize facial lighting, composition, and background to create the perfect professional portrait. Ideal for job hunting, social media, and business occasions.'
)
ON CONFLICT (task_id, locale) 
DO UPDATE SET 
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  updated_at = NOW();

-- 日文 (ja)
INSERT INTO public.generation_tasks_i18n (task_id, locale, title, description)
VALUES (
  '2ea464d7d9de4c8d25b8b746255d3796',
  'ja',
  'AIプロフェッショナル写真生成 - LinkedInビジネスポートレート',
  'AI技術を使用して高品質なLinkedInプロフェッショナル写真を生成します。顔の照明、構図、背景を自動的に最適化し、完璧なプロフェッショナルポートレートを作成します。就職活動、ソーシャルメディア、ビジネスシーンに最適です。'
)
ON CONFLICT (task_id, locale) 
DO UPDATE SET 
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  updated_at = NOW();

-- 韩文 (ko)
INSERT INTO public.generation_tasks_i18n (task_id, locale, title, description)
VALUES (
  '2ea464d7d9de4c8d25b8b746255d3796',
  'ko',
  'AI 전문 프로필 사진 생성 - LinkedIn 비즈니스 포트레이트',
  'AI 기술을 사용하여 고품질 LinkedIn 전문 프로필 사진을 생성합니다. 얼굴 조명, 구도 및 배경을 자동으로 최적화하여 완벽한 전문 포트레이트를 만듭니다. 취업, 소셜 미디어 및 비즈니스 상황에 이상적입니다.'
)
ON CONFLICT (task_id, locale) 
DO UPDATE SET 
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  updated_at = NOW();

-- 法文 (fr)
INSERT INTO public.generation_tasks_i18n (task_id, locale, title, description)
VALUES (
  '2ea464d7d9de4c8d25b8b746255d3796',
  'fr',
  'Générateur de Photo Professionnelle IA - Portrait LinkedIn Business',
  'Générez des photos professionnelles LinkedIn de haute qualité avec la technologie IA. Optimisez automatiquement l''éclairage du visage, la composition et l''arrière-plan pour créer le portrait professionnel parfait. Idéal pour la recherche d''emploi, les médias sociaux et les occasions professionnelles.'
)
ON CONFLICT (task_id, locale) 
DO UPDATE SET 
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  updated_at = NOW();

-- 德文 (de)
INSERT INTO public.generation_tasks_i18n (task_id, locale, title, description)
VALUES (
  '2ea464d7d9de4c8d25b8b746255d3796',
  'de',
  'KI-Professioneller Profilbild-Generator - LinkedIn Business Portrait',
  'Erstellen Sie hochwertige professionelle LinkedIn-Profilbilder mit KI-Technologie. Optimieren Sie automatisch Gesichtsbeleuchtung, Komposition und Hintergrund, um das perfekte professionelle Portrait zu erstellen. Ideal für Jobsuche, soziale Medien und geschäftliche Anlässe.'
)
ON CONFLICT (task_id, locale) 
DO UPDATE SET 
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  updated_at = NOW();

-- 西班牙文 (es)
INSERT INTO public.generation_tasks_i18n (task_id, locale, title, description)
VALUES (
  '2ea464d7d9de4c8d25b8b746255d3796',
  'es',
  'Generador de Foto Profesional IA - Retrato de Negocios LinkedIn',
  'Genere fotos profesionales de LinkedIn de alta calidad utilizando tecnología de IA. Optimice automáticamente la iluminación facial, la composición y el fondo para crear el retrato profesional perfecto. Ideal para búsqueda de empleo, redes sociales y ocasiones de negocios.'
)
ON CONFLICT (task_id, locale) 
DO UPDATE SET 
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  updated_at = NOW();

-- Step 3: 验证数据
DO $$ 
DECLARE
  task_display_location TEXT;
  i18n_count INTEGER;
BEGIN 
  -- 检查任务展示位置
  SELECT display_location INTO task_display_location 
  FROM public.generation_tasks 
  WHERE id = '2ea464d7d9de4c8d25b8b746255d3796';
  
  -- 检查翻译数量
  SELECT COUNT(*) INTO i18n_count 
  FROM public.generation_tasks_i18n 
  WHERE task_id = '2ea464d7d9de4c8d25b8b746255d3796';
  
  RAISE NOTICE '✅ LinkedIn专业头像示例已设置完成！';
  RAISE NOTICE '📍 展示位置: %', task_display_location;
  RAISE NOTICE '🌐 多语言翻译: % 种语言', i18n_count;
  RAISE NOTICE '🎯 SEO关键词: AI头像生成, LinkedIn头像, 专业形象照, AI换脸';
END $$;

