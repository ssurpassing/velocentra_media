import { createServerSupabaseClient } from '@/infrastructure/database/server-client';

const BUCKET_ORIGINALS = 'originals';
const BUCKET_GENERATED = 'avatars'; // 使用 avatars 桶存放生成的图片
const BUCKET_THUMBNAILS = 'thumbnails';

// 上传原始图片
export async function uploadOriginalImage(
  file: File,
  userId: string
): Promise<{ success: boolean; url?: string; path?: string; error?: string }> {
  try {
    const supabase = await createServerSupabaseClient();
    const fileExt = file.name.split('.').pop();
    const fileName = `${userId}/${Date.now()}.${fileExt}`;

    const { data, error } = await supabase.storage
      .from(BUCKET_ORIGINALS)
      .upload(fileName, file, {
        contentType: file.type || 'image/png', // 设置正确的 MIME 类型
        cacheControl: '3600',
        upsert: false,
      });

    if (error) {
      throw error;
    }

    // 使用公开 URL，让外部API（如KIE）可以访问
    // 注意：需要确保 Supabase Storage bucket 设置为 public
    const { data: { publicUrl } } = supabase.storage
      .from(BUCKET_ORIGINALS)
      .getPublicUrl(data.path);

    return {
      success: true,
      url: publicUrl,
      path: data.path,
    };
  } catch (error: any) {
    console.error('Upload original image error:', error);
    return {
      success: false,
      error: error.message || 'Failed to upload image',
    };
  }
}

// 上传生成的头像
export async function uploadGeneratedAvatar(
  imageBuffer: Buffer,
  userId: string,
  taskId: string
): Promise<{ success: boolean; url?: string; path?: string; error?: string }> {
  try {
    const supabase = await createServerSupabaseClient();
    const fileName = `${userId}/${taskId}/${Date.now()}.png`;

    const { data, error } = await supabase.storage
      .from(BUCKET_GENERATED)
      .upload(fileName, imageBuffer, {
        contentType: 'image/png',
        cacheControl: '3600',
        upsert: false,
      });

    if (error) {
      throw error;
    }

    const { data: { publicUrl } } = supabase.storage
      .from(BUCKET_GENERATED)
      .getPublicUrl(data.path);

    return {
      success: true,
      url: publicUrl,
      path: data.path,
    };
  } catch (error: any) {
    console.error('Upload generated avatar error:', error);
    return {
      success: false,
      error: error.message || 'Failed to upload generated avatar',
    };
  }
}

// 删除文件
export async function deleteFile(
  bucket: string,
  path: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createServerSupabaseClient();

    const { error } = await supabase.storage.from(bucket).remove([path]);

    if (error) {
      throw error;
    }

    return { success: true };
  } catch (error: any) {
    console.error('Delete file error:', error);
    return {
      success: false,
      error: error.message || 'Failed to delete file',
    };
  }
}

// 获取公共 URL
export async function getPublicUrl(bucket: string, path: string): Promise<string> {
  const supabase = await createServerSupabaseClient();
  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
}


