// 数据库类型定义
export interface UserProfile {
  id: string;
  email: string;
  nickname?: string;
  full_name?: string;
  avatar_url?: string;
  locale: string;
  membership_tier: 'free' | 'credits' | 'subscription';
  credits: number;
  free_generations_remaining: number;
  subscription_end_date?: string;
  is_admin: boolean;
  created_at: string;
  updated_at: string;
}

export interface GenerationTask {
  id: string; // 直接使用 AI API 返回的 ID（不再使用 UUID）
  user_id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  media_type: 'image' | 'video';
  ai_model: string;
  
  // 提示词相关
  original_prompt?: string; // 用户原始输入
  optimized_prompt?: string; // 系统优化后的提示词
  prompt_optimized: boolean; // 是否经过优化
  
  // 输入图片（支持多图）
  input_image_urls?: string[]; // 输入图片 URL 数组
  
  // 其他参数
  generation_params?: Record<string, any>;
  
  // 展示相关（用于示例展示）
  display_location?: 'homepage' | 'ai-image' | 'ai-video' | null;
  display_order?: number;
  
  // 错误信息
  error_message?: string;
  
  // 成本和时间
  cost_credits: number;
  generation_time_ms?: number;
  prompt_optimization_time_ms?: number;
  
  // 时间戳
  created_at: string;
  completed_at?: string;
}

// 生成任务国际化
export interface GenerationTaskI18n {
  id: string;
  task_id: string;
  locale: 'zh' | 'en' | 'ja' | 'ko' | 'fr' | 'de' | 'es';
  title: string;
  description?: string;
  created_at: string;
  updated_at: string;
}

// 媒体文件表（独立存储每个生成的文件）
export interface MediaFile {
  id: string;
  task_id: string;
  user_id: string;
  
  // 媒体信息
  media_type: 'image' | 'video';
  url: string;
  thumbnail_url?: string;
  
  // 元数据
  width?: number;
  height?: number;
  duration?: number; // 视频时长（秒）
  format?: string; // 文件格式（png, jpg, mp4, webm）
  file_size?: number; // 文件大小（字节）
  
  // 存储信息
  original_url?: string; // AI 服务商的原始 URL
  backup_url?: string; // Supabase 备份 URL
  storage_status: 'original_only' | 'backing_up' | 'backed_up' | 'backup_failed';
  
  // 索引位置（一个任务可能生成多个文件）
  result_index: number;
  
  created_at: string;
}

// 用于插入的类型
export type MediaFileInsert = Omit<MediaFile, 'id' | 'created_at'>;

// 用于更新的类型
export type MediaFileUpdate = Partial<Omit<MediaFile, 'id' | 'task_id' | 'user_id' | 'created_at'>>;

// 向后兼容：GeneratedMedia 和 GeneratedPhoto 别名
export type GeneratedMedia = MediaFile;
export type GeneratedPhoto = MediaFile;

// Folder 接口已删除（不再需要文件夹功能）

export interface Transaction {
  id: string;
  user_id: string;
  type: 'credit_purchase' | 'subscription' | 'refund';
  amount_cents: number;
  credits_amount?: number;
  currency: string;
  stripe_payment_id?: string;
  stripe_subscription_id?: string;
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  metadata: Record<string, any>;
  created_at: string;
}

export interface CreditHistory {
  id: string;
  user_id: string;
  amount: number; // 正数=增加，负数=扣除
  type: 'purchase' | 'usage' | 'refund' | 'bonus';
  balance_after: number;
  task_id?: string;
  description?: string;
  created_at: string;
}

// API 响应类型
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// AI 模型配置类型
export interface AIModelConfig {
  id: string;
  name: string;
  provider: 'stability' | 'openai' | 'google' | 'kie';
  displayName: string;
  description: string;
  costPerGeneration: number;
  isActive: boolean;
  config: Record<string, any>;
}

// 风格预设类型
export interface StylePreset {
  id: string;
  name: string;
  category: string;
  description: string;
  prompt: string;
  negativePrompt?: string;
  thumbnail?: string;
}

// 画廊功能已删除（改用示例表）
// 保留类型定义以便向后兼容
export interface GalleryMedia extends MediaFile {
  user_name?: string;
  user_avatar?: string;
}

// 向后兼容：GalleryPhoto 别名
export type GalleryPhoto = GalleryMedia;

// 工作流模板类型
export interface WorkflowTemplate {
  id: string;
  style_key: string;
  name_i18n_key: string;
  description_i18n_key?: string;
  icon?: string;
  category: string;
  form_schema: {
    fields: Array<{
      name: string;
      labelKey: string;
      type: 'text' | 'select' | 'textarea';
      required: boolean;
      placeholderKey?: string;
      options?: Array<{
        labelKey: string;
        value: string;
      }>;
    }>;
  };
  prompt_template: string;
  negative_prompt_template?: string;
  llm_system_prompt: string;
  llm_model: string;
  recommended_aspect_ratio: string;
  recommended_ai_model: string;
  priority: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// 图片生成类型
export type ImageGenerationMode = 'image-to-image' | 'text-to-image';

export interface ImageExample {
  id: string;
  imageUrl: string;
  prompt: string;
  model: string;
  aspectRatio?: string;
  originalImageUrl?: string;
  numberOfImages?: number;
}

export interface ImageGenerationRequest {
  mode: ImageGenerationMode;
  aiModel: string;
  prompt: string;
  imageUrl?: string; // 图生图时必需
  aspectRatio?: string;
  numberOfImages?: number;
  isPromptOptimized?: boolean;
}

export interface ImagePromptTemplate {
  id: string;
  name: string;        // fallback only, actual name from translation
  description: string; // fallback only, actual description from translation
  systemPrompt: string;
}


