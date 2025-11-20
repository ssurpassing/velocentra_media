/**
 * MediaFileService - 媒体文件管理服务
 * 负责 media_files 表的 CRUD 操作
 */

import { createAdminClient } from '@/infrastructure/database/server-client';
import type { MediaFile, MediaFileInsert, MediaFileUpdate } from '@/shared/types';

export class MediaFileService {
  /**
   * 创建媒体文件记录
   */
  static async createMediaFile(data: MediaFileInsert): Promise<MediaFile> {
    const supabase = createAdminClient();
    
    const { data: mediaFile, error } = await supabase
      .from('media_files')
      .insert(data)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create media file: ${error.message}`);
    }

    return mediaFile;
  }

  /**
   * 批量创建媒体文件记录
   */
  static async createMediaFiles(files: MediaFileInsert[]): Promise<MediaFile[]> {
    const supabase = createAdminClient();
    
    const { data: mediaFiles, error } = await supabase
      .from('media_files')
      .insert(files)
      .select();

    if (error) {
      throw new Error(`Failed to create media files: ${error.message}`);
    }

    return mediaFiles;
  }

  /**
   * 根据 ID 获取媒体文件
   */
  static async getMediaFileById(id: string): Promise<MediaFile | null> {
    const supabase = createAdminClient();
    
    const { data, error } = await supabase
      .from('media_files')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      throw new Error(`Failed to get media file: ${error.message}`);
    }

    return data;
  }

  /**
   * 根据任务 ID 获取所有媒体文件
   */
  static async getMediaFilesByTaskId(taskId: string): Promise<MediaFile[]> {
    const supabase = createAdminClient();
    
    const { data, error } = await supabase
      .from('media_files')
      .select('*')
      .eq('task_id', taskId)
      .order('result_index', { ascending: true });

    if (error) {
      throw new Error(`Failed to get media files: ${error.message}`);
    }

    return data || [];
  }

  /**
   * 根据用户 ID 获取媒体文件列表（分页）
   */
  static async getMediaFilesByUserId(
    userId: string,
    options: {
      mediaType?: 'image' | 'video';
      limit?: number;
      offset?: number;
    } = {}
  ): Promise<MediaFile[]> {
    const supabase = createAdminClient();
    const { mediaType, limit = 20, offset = 0 } = options;
    
    let query = supabase
      .from('media_files')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (mediaType) {
      query = query.eq('media_type', mediaType);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`Failed to get media files: ${error.message}`);
    }

    return data || [];
  }

  /**
   * 更新媒体文件
   */
  static async updateMediaFile(
    id: string,
    updates: MediaFileUpdate
  ): Promise<MediaFile> {
    const supabase = createAdminClient();
    
    const { data, error } = await supabase
      .from('media_files')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update media file: ${error.message}`);
    }

    return data;
  }

  /**
   * 更新存储状态（用于备份流程）
   */
  static async updateStorageStatus(
    id: string,
    status: 'original_only' | 'backing_up' | 'backed_up' | 'backup_failed',
    backupUrl?: string
  ): Promise<void> {
    const supabase = createAdminClient();
    
    const updates: any = { storage_status: status };
    if (backupUrl) {
      updates.backup_url = backupUrl;
      updates.url = backupUrl; // 切换到备份 URL
    }

    const { error } = await supabase
      .from('media_files')
      .update(updates)
      .eq('id', id);

    if (error) {
      throw new Error(`Failed to update storage status: ${error.message}`);
    }
  }

  /**
   * 删除媒体文件
   */
  static async deleteMediaFile(id: string): Promise<void> {
    const supabase = createAdminClient();
    
    const { error } = await supabase
      .from('media_files')
      .delete()
      .eq('id', id);

    if (error) {
      throw new Error(`Failed to delete media file: ${error.message}`);
    }
  }

  /**
   * 删除任务的所有媒体文件
   */
  static async deleteMediaFilesByTaskId(taskId: string): Promise<void> {
    const supabase = createAdminClient();
    
    const { error } = await supabase
      .from('media_files')
      .delete()
      .eq('task_id', taskId);

    if (error) {
      throw new Error(`Failed to delete media files: ${error.message}`);
    }
  }

  /**
   * 获取需要备份的媒体文件（状态为 original_only）
   */
  static async getMediaFilesNeedingBackup(limit: number = 10): Promise<MediaFile[]> {
    const supabase = createAdminClient();
    
    const { data, error } = await supabase
      .from('media_files')
      .select('*')
      .eq('storage_status', 'original_only')
      .order('created_at', { ascending: true })
      .limit(limit);

    if (error) {
      throw new Error(`Failed to get media files needing backup: ${error.message}`);
    }

    return data || [];
  }

  /**
   * 按条件搜索媒体文件
   */
  static async searchMediaFiles(
    userId: string,
    filters: {
      mediaType?: 'image' | 'video';
      minWidth?: number;
      maxWidth?: number;
      minHeight?: number;
      maxHeight?: number;
      minDuration?: number;
      maxDuration?: number;
      limit?: number;
      offset?: number;
    } = {}
  ): Promise<MediaFile[]> {
    const supabase = createAdminClient();
    const { 
      mediaType, 
      minWidth, 
      maxWidth, 
      minHeight, 
      maxHeight,
      minDuration,
      maxDuration,
      limit = 20, 
      offset = 0 
    } = filters;
    
    let query = supabase
      .from('media_files')
      .select('*')
      .eq('user_id', userId);

    if (mediaType) {
      query = query.eq('media_type', mediaType);
    }
    if (minWidth) {
      query = query.gte('width', minWidth);
    }
    if (maxWidth) {
      query = query.lte('width', maxWidth);
    }
    if (minHeight) {
      query = query.gte('height', minHeight);
    }
    if (maxHeight) {
      query = query.lte('height', maxHeight);
    }
    if (minDuration) {
      query = query.gte('duration', minDuration);
    }
    if (maxDuration) {
      query = query.lte('duration', maxDuration);
    }

    query = query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    const { data, error } = await query;

    if (error) {
      throw new Error(`Failed to search media files: ${error.message}`);
    }

    return data || [];
  }

  /**
   * 统计用户的媒体文件数量
   */
  static async countMediaFiles(
    userId: string,
    mediaType?: 'image' | 'video'
  ): Promise<number> {
    const supabase = createAdminClient();
    
    let query = supabase
      .from('media_files')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId);

    if (mediaType) {
      query = query.eq('media_type', mediaType);
    }

    const { count, error } = await query;

    if (error) {
      throw new Error(`Failed to count media files: ${error.message}`);
    }

    return count || 0;
  }
}

