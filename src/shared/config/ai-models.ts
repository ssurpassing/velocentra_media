import { AIModelConfig } from '@/shared/types';

// AI 模型配置
// 注意：displayName 和 description 现在从翻译文件读取
// 使用 models.image.{modelId}.name 和 models.image.{modelId}.description
export const AI_MODELS: AIModelConfig[] = [
  {
    id: 'kie-nano-banana',
    name: 'kie-nano-banana',
    provider: 'kie',
    displayName: 'Nano Banana', // fallback
    description: '', // 从翻译文件读取: models.image.kie-nano-banana.description
    costPerGeneration: 50,
    isActive: true,
    config: {
      model: 'nano-banana',
      supportsImageInput: false,
      supportsTextOnly: true,
    },
  },
  {
    id: 'kie-nano-banana-edit',
    name: 'kie-nano-banana-edit',
    provider: 'kie',
    displayName: 'Nano Banana Edit', // fallback
    description: '', // 从翻译文件读取: models.image.kie-nano-banana-edit.description
    costPerGeneration: 50,
    isActive: true,
    config: {
      model: 'nano-banana-edit',
      supportsImageInput: true,
      supportsTextOnly: false,
    },
  },
  {
    id: 'kie-gpt4o-image',
    name: 'kie-gpt4o-image',
    provider: 'kie',
    displayName: 'GPT-4o Image', // fallback
    description: '', // 从翻译文件读取: models.image.kie-gpt4o-image.description
    costPerGeneration: 80,
    isActive: true,
    config: {
      model: 'gpt-4o-image',
      supportsImageInput: true,
      supportsTextOnly: true,
    },
  },
];

// 获取所有激活的模型（仅支持图生图）
export function getActiveModels(): AIModelConfig[] {
  return AI_MODELS.filter((model) => model.isActive);
}

// 负面提示词基础模板（用于向后兼容）
export const BASE_NEGATIVE_PROMPT = 
  'low quality, blurry, distorted, deformed, ugly, bad anatomy, bad proportions, extra limbs, cloned face, disfigured, gross proportions, malformed, missing arms, missing legs, extra arms, extra legs, fused fingers, too many fingers, long neck';

// 基础提示词构建函数（向后兼容，用于fallback）
export function buildPrompt(style: string, customPrompt?: string): string {
  const basePrompt = 'professional business portrait photo, corporate headshot, facing camera directly, confident expression, modern professional background, high-resolution quality, sharp focus on face';
  
  if (customPrompt) {
    return `${customPrompt}, ${basePrompt}`;
  }
  
  return basePrompt;
}

// 基础负面提示词构建函数（向后兼容，用于fallback）
export function buildNegativePrompt(style: string): string {
  return `casual clothes, messy hair, unprofessional, sunglasses, hat, blurry background, harsh lighting, shadows on face, ${BASE_NEGATIVE_PROMPT}`;
}


