/**
 * 图片上传组件
 * 用于图生视频和参考视频生成
 */

'use client';

import { useRef } from 'react';
import { useTranslations } from 'next-intl';
import { Upload, X, Image as ImageIcon } from 'lucide-react';

export interface ImageUploadSectionProps {
  images: File[];
  imagePreviews: string[];
  maxImages: number;
  onAdd: (files: File[]) => void;
  onRemove: (index: number) => void;
  label?: string;
  labelCn?: string;
  description?: string;
  descriptionCn?: string;
  locale?: string;
  disabled?: boolean;
}

export function ImageUploadSection({
  images,
  imagePreviews,
  maxImages,
  onAdd,
  onRemove,
  label = 'Upload Images',
  labelCn = '上传图片',
  description,
  descriptionCn,
  locale = 'en',
  disabled = false,
}: ImageUploadSectionProps) {
  const t = useTranslations();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      onAdd(files);
    }
    // 重置 input 以允许重复选择同一文件
    e.target.value = '';
  };

  const handleClickUpload = () => {
    fileInputRef.current?.click();
  };

  const canAddMore = images.length < maxImages;

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        {locale === 'zh' ? labelCn : label}
        {maxImages > 1 && (
          <span className="text-gray-500 ml-2">
            ({images.length}/{maxImages})
          </span>
        )}
      </label>
      
      {description && (
        <p className="text-sm text-gray-500 mb-3">
          {locale === 'zh' && descriptionCn ? descriptionCn : description}
        </p>
      )}

      {/* 图片预览网格 */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-4">
        {imagePreviews.map((preview, index) => (
          <div
            key={index}
            className="relative aspect-video bg-gray-100 rounded-lg overflow-hidden group"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={preview}
              alt={`Upload ${index + 1}`}
              className="w-full h-full object-cover"
            />
            <button
              onClick={() => onRemove(index)}
              disabled={disabled}
              className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-50"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>

      {/* 上传按钮 */}
      {canAddMore && (
        <>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple={maxImages > 1}
            onChange={handleFileSelect}
            disabled={disabled}
            className="hidden"
          />
          
          <button
            onClick={handleClickUpload}
            disabled={disabled}
            className="w-full px-4 py-8 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <div className="flex flex-col items-center gap-2">
              <div className="p-3 bg-blue-100 rounded-full">
                <ImageIcon className="w-6 h-6 text-blue-600" />
              </div>
              <div className="text-sm font-medium text-gray-700">
                {t('generators.upload.clickToUpload')}
              </div>
              <div className="text-xs text-gray-500">
                {t('generators.upload.supportedFormats')}
              </div>
            </div>
          </button>
        </>
      )}
    </div>
  );
}

