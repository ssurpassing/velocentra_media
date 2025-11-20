// AI 服务接口
export interface AIGenerationParams {
  imageUrl: string;
  imageUrls?: string[]; // 多图融合支持
  prompt: string;
  negativePrompt?: string;
  model: string;
  style?: string;
  numberOfImages?: number;
  aspectRatio?: string;
}

export interface AIGenerationResult {
  success: boolean;
  imageUrl?: string;
  imageBuffer?: Buffer; // 添加 Buffer 供上传使用
  error?: string;
  taskId?: string; // KIE 回调模式使用
}


// kie.ai Nano Banana 生成
export async function generateWithNanoBanana(
  params: AIGenerationParams
): Promise<AIGenerationResult> {
  try {
    const { getKieImageClient } = await import('../ai-clients');
    const client = getKieImageClient();

    // 配置回调URL - 让KIE在完成时主动通知
    const ngrokUrl = process.env.NEXT_PUBLIC_NGROK_URL?.replace(/\/$/, ''); // 移除末尾的斜杠
    const callbackUrl = ngrokUrl 
      ? `${ngrokUrl}/api/callback/kie`
      : undefined;

    // 使用多图 URLs 或单图 URL
    const imageUrls = params.imageUrls && params.imageUrls.length > 0 
      ? params.imageUrls 
      : params.imageUrl ? [params.imageUrl] : undefined;
    
    const response = await client.generateNanoBanana(params.prompt, {
      outputFormat: 'png',
      imageSize: params.aspectRatio || '1:1',
      imageUrls: imageUrls, // 传入图片 URLs（支持多图）
      callbackUrl, // 传入回调URL
    });

    // 如果使用回调模式，response只有taskId，没有data
    // 这是正常的，KIE会异步处理并通过回调通知
    if (callbackUrl && response.taskId) {
      // 返回taskId作为临时URL，前端会轮询任务状态
      return {
        success: true,
        imageUrl: '', // 回调模式下暂时没有URL
        taskId: response.taskId,
      };
    }

    // 同步模式：检查是否有结果
    if (!response.success || !response.data?.url) {
      const errorMsg = response.error || 'Nano Banana generation failed';
      console.error('Nano Banana generation failed:', errorMsg);
      throw new Error(errorMsg);
    }

    return {
      success: true,
      imageUrl: response.data.url,
    };
  } catch (error: any) {
    console.error('Nano Banana generation error:', error);
    return {
      success: false,
      error: error.message || 'Failed to generate with Nano Banana',
    };
  }
}

// kie.ai GPT-4o Image 生成
export async function generateWithGPT4oImage(
  params: AIGenerationParams
): Promise<AIGenerationResult> {
  try {
    const { getKieImageClient } = await import('../ai-clients');
    const client = getKieImageClient();

    // 配置回调URL
    const ngrokUrl = process.env.NEXT_PUBLIC_NGROK_URL?.replace(/\/$/, ''); // 移除末尾的斜杠
    const callbackUrl = ngrokUrl 
      ? `${ngrokUrl}/api/callback/kie`
      : undefined;
    
    console.log('使用 GPT-4o Image 生成图片...', {
      hasImage: !!params.imageUrl,
      imageUrl: params.imageUrl,
      callbackUrl,
    });
    
    // GPT-4o Image 支持图片输入（图生图）
    const filesUrl = params.imageUrl ? [params.imageUrl] : undefined;
    
    const response = await client.generateGPT4oImage(params.prompt, {
      filesUrl,
      size: params.aspectRatio || '1:1',
      nVariants: params.numberOfImages || 1,
      callbackUrl, // 传入回调URL
    });

    // 如果使用回调模式，response只有taskId，没有data
    // 这是正常的，KIE会异步处理并通过回调通知
    if (callbackUrl && response.taskId) {
      // 返回taskId作为临时URL，前端会轮询任务状态
      return {
        success: true,
        imageUrl: '', // 回调模式下暂时没有URL
        taskId: response.taskId,
      };
    }

    // 同步模式：检查是否有结果
    if (!response.success || !response.data?.url) {
      const errorMsg = response.error || 'GPT-4o Image generation failed';
      console.error('GPT-4o Image generation failed:', errorMsg);
      throw new Error(errorMsg);
    }

    return {
      success: true,
      imageUrl: response.data.url,
    };
  } catch (error: any) {
    console.error('GPT-4o Image generation error:', error);
    return {
      success: false,
      error: error.message || 'Failed to generate with GPT-4o Image',
    };
  }
}

// 统一生成接口
export async function generateAvatar(
  params: AIGenerationParams
): Promise<AIGenerationResult> {
  const { model } = params;

  switch (model) {
    case 'kie-nano-banana':
    case 'kie-nano-banana-edit':
      // Nano Banana 和 Nano Banana Edit 都使用同一个客户端
      return generateWithNanoBanana(params);
    case 'kie-gpt4o-image':
      return generateWithGPT4oImage(params);
    default:
      return {
        success: false,
        error: `Unknown model: ${model}`,
      };
  }
}


