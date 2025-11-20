/**
 * 提示词优化 API
 * 根据不同风格优化用户输入的提示词（支持视频和图片）
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/infrastructure/database/server-client';
import { optimizeUserPrompt } from '@/shared/lib/prompt-builder';
import { getVideoTemplateById } from '@/shared/config/video-prompt-templates';
import { getImageTemplateById, getDefaultImageTemplate } from '@/shared/config/image-prompt-templates';

export const dynamic = 'force-dynamic';

// 职业头像模板
const PROFESSIONAL_SYSTEM_PROMPT = `You are a professional headshot prompt optimization assistant for AI image generation.

Task: Convert the user's input into a precise prompt for generating professional LinkedIn-style headshots.

Base Template (MUST include these elements):
- Professional corporate headshot portrait
- Business professional attire (suit, business casual, etc.)
- Professional studio lighting with soft key light and subtle rim light
- Clean professional background (gray, blue, or modern office)
- Direct eye contact, confident expression
- 85mm portrait lens at f/2.8, shallow depth of field
- Sharp focus on face and eyes
- Realistic skin texture, professional color grading
- High resolution 8K quality, photorealistic

User Requirements: {{USER_INPUT}}

Instructions:
1. If user input is in Chinese/Japanese/Korean, translate to English
2. Integrate user's specific requirements (职业、场景、风格等) into the base template
3. Keep the professional headshot core elements
4. Output ONLY the complete optimized English prompt, no explanations

Output: A professional, detailed English prompt.`;

// 圣诞风格模板
const CHRISTMAS_SYSTEM_PROMPT = `You are a Christmas-themed portrait prompt optimization assistant for AI image generation.

Task: Convert the user's input into a festive Christmas-themed portrait prompt.

Christmas Theme Elements (include appropriate ones):
- Festive Christmas atmosphere
- Holiday decorations (Christmas tree, lights, ornaments, wreaths)
- Warm cozy lighting (fairy lights, candles, fireplace glow)
- Christmas colors (red, green, gold, white)
- Winter elements (snow, snowflakes, winter clothing)
- Joyful, warm, celebratory mood
- Professional quality portrait photography

User Requirements: {{USER_INPUT}}

Instructions:
1. If user input is in Chinese/Japanese/Korean, translate to English
2. Blend user's requirements with Christmas theme elements naturally
3. Maintain portrait quality and professionalism
4. Add festive details without overwhelming the subject
5. Output ONLY the complete optimized English prompt, no explanations

Output: A festive, detailed English prompt.`;

// 通用优化模板（自定义风格）
const GENERAL_SYSTEM_PROMPT = `You are a prompt optimization assistant for AI image generation.

Task: Convert the user's input into a clear, precise prompt for AI image generation models.

Requirements:
- If input is in Chinese/Japanese/Korean, translate to English
- Keep the user's original intent and main subject EXACTLY
- Add ONLY essential visual details (lighting, angle, composition, style) if missing
- Enhance clarity and specificity
- Keep it concise but descriptive (80-150 words)
- Do NOT add extra elements not mentioned by user
- Output ONLY the optimized English prompt, no explanations

Output: A clean, detailed English prompt.`;

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();

    // 验证用户登录
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    // 解析请求数据
    const body = await request.json();
    const { userPrompt, styleKey } = body;

    if (!userPrompt || !userPrompt.trim()) {
      return NextResponse.json({ success: false, error: 'Prompt is required' }, { status: 400 });
    }

    // 根据风格选择系统提示词
    let systemPrompt: string;
    
    // 检查是否为视频模板
    if (styleKey && styleKey.startsWith('video-')) {
      const videoTemplate = getVideoTemplateById(styleKey);
      if (videoTemplate) {
        systemPrompt = videoTemplate.systemPrompt.replace('{{USER_INPUT}}', userPrompt);
      } else {
        // 视频模板不存在，使用通用视频模板
        const generalVideo = getVideoTemplateById('video-general');
        systemPrompt = generalVideo?.systemPrompt.replace('{{USER_INPUT}}', userPrompt) || GENERAL_SYSTEM_PROMPT;
      }
    } else if (styleKey && styleKey.startsWith('image-')) {
      // 图片模板
      const imageTemplate = getImageTemplateById(styleKey);
      if (imageTemplate) {
        systemPrompt = imageTemplate.systemPrompt.replace('{{USER_INPUT}}', userPrompt);
      } else {
        // 图片模板不存在，使用默认图片模板
        const defaultTemplate = getDefaultImageTemplate();
        systemPrompt = defaultTemplate.systemPrompt.replace('{{USER_INPUT}}', userPrompt);
      }
    } else {
      // 旧的图片生成模板（向后兼容）
      switch (styleKey) {
        case 'linkedin-pro-pipeline':
          // 职业头像：使用专业模板
          systemPrompt = PROFESSIONAL_SYSTEM_PROMPT.replace('{{USER_INPUT}}', userPrompt);
          break;
        case 'christmas':
          // 圣诞风格：使用圣诞模板
          systemPrompt = CHRISTMAS_SYSTEM_PROMPT.replace('{{USER_INPUT}}', userPrompt);
          break;
        case 'custom':
        default:
          // 自定义：使用通用优化
          systemPrompt = GENERAL_SYSTEM_PROMPT;
          break;
      }
    }

    console.log('🎨 提示词优化请求:', {
      styleKey,
      userPrompt: userPrompt.substring(0, 50) + '...',
    });

    // 调用优化函数
    const result = await optimizeUserPrompt(userPrompt, systemPrompt);

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error || 'Optimization failed' },
        { status: 500 }
      );
    }

    console.log('✅ 提示词优化成功:', {
      originalLength: userPrompt.length,
      optimizedLength: result.prompt.length,
    });

    return NextResponse.json({
      success: true,
      data: {
        originalPrompt: userPrompt,
        optimizedPrompt: result.prompt,
      },
    });
  } catch (error: any) {
    console.error('Optimize prompt error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

