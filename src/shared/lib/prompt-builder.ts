// Prompt Building and Optimization Utilities

import OpenAI from 'openai';

/**
 * 用表单数据填充提示词模板中的占位符
 * @param template - 包含 {{field_name}} 占位符的模板
 * @param formData - 表单数据对象
 * @returns 填充后的提示词
 */
export function fillPromptTemplate(
  template: string,
  formData: Record<string, any>
): string {
  let filledTemplate = template;
  
  for (const [key, value] of Object.entries(formData)) {
    if (value !== undefined && value !== null && value !== '') {
      const placeholder = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
      filledTemplate = filledTemplate.replace(placeholder, String(value));
    }
  }
  
  // 清理未填充的占位符（可选字段）
  filledTemplate = filledTemplate.replace(/\{\{[^}]+\}\}/g, '').trim();
  // 清理多余空格
  filledTemplate = filledTemplate.replace(/\s+/g, ' ').trim();
  
  return filledTemplate;
}

/**
 * 合并用户输入和模板提示词
 * @param userInput - 用户自定义输入的提示词
 * @param templatePrompt - 填充后的模板提示词
 * @returns 合并后的提示词
 */
export function buildFinalPrompt(
  userInput: string,
  templatePrompt: string
): string {
  // 如果用户有输入，放在前面，模板内容作为增强
  if (userInput && userInput.trim()) {
    return `${userInput.trim()}. Additional requirements: ${templatePrompt}`;
  }
  
  // 如果用户无输入，只用模板
  return templatePrompt;
}

/**
 * 使用GPT优化提示词
 * @param params - 优化参数
 * @returns 优化后的英文提示词
 */
export async function optimizePromptWithGPT(params: {
  prompt: string;
  systemPrompt: string;
  model?: string;
}): Promise<{
  success: boolean;
  optimizedPrompt?: string;
  error?: string;
}> {
  try {
    // 使用 OpenRouter 配置
    const apiKey = process.env.OPEN_ROUTER_KEY;
    const baseURL = process.env.OPEN_ROUTER_BASE_URL || 'https://platform.visionlabs.art';
    const defaultModel = 'gpt-4o-mini';
    
    if (!apiKey) {
      console.warn('No API key configured (OPEN_ROUTER_KEY), skipping optimization');
      return {
        success: true,
        optimizedPrompt: params.prompt, // Fallback to original
      };
    }

    const openai = new OpenAI({ 
      apiKey,
      baseURL: baseURL + '/v1',
    });
    
    const response = await openai.chat.completions.create({
      model: params.model || defaultModel,
      messages: [
        { role: 'system', content: params.systemPrompt },
        { role: 'user', content: params.prompt }
      ],
      temperature: 0.7,
      max_tokens: 500,
    });
    
    const optimizedPrompt = response.choices[0]?.message?.content;
    
    if (!optimizedPrompt) {
      throw new Error('No response from OpenAI');
    }
    
    return {
      success: true,
      optimizedPrompt: optimizedPrompt.trim(),
    };
  } catch (error: any) {
    // 改为 warn 级别，不显示完整错误堆栈
    console.warn('GPT optimization failed, using original prompt:', error?.message || String(error));
    
    // Fallback: 如果GPT失败，使用原始提示词
    return {
      success: true,  // 改为 true，因为我们有 fallback
      optimizedPrompt: params.prompt,
    };
  }
}

/**
 * 完整的工作流提示词处理流程
 * @param params - 处理参数
 * @returns 最终的优化提示词
 */
export async function processWorkflowPrompt(params: {
  userInput?: string;
  templatePrompt: string;
  formData: Record<string, any>;
  systemPrompt: string;
  negativePromptTemplate?: string;
  model?: string;
}): Promise<{
  success: boolean;
  prompt: string;
  negativePrompt: string;
  originalPrompt?: string;
  error?: string;
}> {
  try {
    // 1. 用表单数据填充模板
    const filledTemplate = fillPromptTemplate(params.templatePrompt, params.formData);
    
    // 2. 合并用户输入和模板
    const combinedPrompt = params.userInput 
      ? buildFinalPrompt(params.userInput, filledTemplate)
      : filledTemplate;
    
    // 3. 使用GPT优化提示词
    const optimizationResult = await optimizePromptWithGPT({
      prompt: combinedPrompt,
      systemPrompt: params.systemPrompt,
      model: params.model,
    });
    
    // 4. 处理负面提示词
    const negativePrompt = params.negativePromptTemplate 
      ? fillPromptTemplate(params.negativePromptTemplate, params.formData)
      : '';
    
    return {
      success: true,
      prompt: optimizationResult.optimizedPrompt || combinedPrompt,
      negativePrompt,
      originalPrompt: combinedPrompt,
      error: optimizationResult.error,
    };
  } catch (error: any) {
    console.error('Workflow prompt processing error:', error);
    
    // Fallback: 返回未优化的提示词
    const filledTemplate = fillPromptTemplate(params.templatePrompt, params.formData);
    const combinedPrompt = params.userInput 
      ? buildFinalPrompt(params.userInput, filledTemplate)
      : filledTemplate;
    
    return {
      success: false,
      prompt: combinedPrompt,
      negativePrompt: params.negativePromptTemplate || '',
      error: error.message || 'Prompt processing failed',
    };
  }
}

/**
 * 简单模式：优化用户自定义提示词
 * @param userPrompt - 用户输入的提示词
 * @param baseSystemPrompt - 基础优化指令（可选）
 * @returns 优化后的提示词
 */
export async function optimizeUserPrompt(
  userPrompt: string,
  baseSystemPrompt?: string
): Promise<{
  success: boolean;
  prompt: string;
  error?: string;
}> {
  const defaultSystemPrompt = `You are a prompt optimization assistant for AI image generation.

Task: Convert the user's input into a clear, precise prompt for AI image generation models.

Requirements:
- If input is in Chinese/Japanese/Korean, translate to English
- Keep the user's original intent and main subject EXACTLY
- Add ONLY essential visual details (lighting, angle, style) if missing
- Keep it concise (50-100 words maximum)
- Do NOT add extra elements not mentioned by user
- Output ONLY the optimized English prompt, no explanations

Output: A clean, direct English prompt.`;

  try {
    const result = await optimizePromptWithGPT({
      prompt: userPrompt,
      systemPrompt: baseSystemPrompt || defaultSystemPrompt,
    });
    
    return {
      success: result.success,
      prompt: result.optimizedPrompt || userPrompt,
      error: result.error,
    };
  } catch (error: any) {
    return {
      success: false,
      prompt: userPrompt,
      error: error.message,
    };
  }
}

