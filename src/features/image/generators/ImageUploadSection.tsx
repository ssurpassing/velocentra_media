/**
 * 图片上传组件
 * 可复用的图片上传、预览和移除功能
 */

'use client';

import { useRef } from 'react';
import { Upload, X } from 'lucide-react';

interface ImageUploadSectionProps {
  imageFile: File | null;
  imagePreview: string | null;
  onImageSelect: (file: File) => void;
  onImageRemove: () => void;
  disabled?: boolean;
  label?: string;
  hint?: string;
  multiple?: boolean;
  imageFiles?: File[];
  imagePreviews?: string[];
  onImagesSelect?: (files: File[]) => void;
  onImageRemoveAt?: (index: number) => void;
}

export function ImageUploadSection({
  imageFile,
  imagePreview,
  onImageSelect,
  onImageRemove,
  disabled = false,
  label = '上传图片',
  hint = '支持 PNG、JPG、WEBP，最大 5MB',
  multiple = false,
  imageFiles = [],
  imagePreviews = [],
  onImagesSelect,
  onImageRemoveAt,
}: ImageUploadSectionProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (multiple && onImagesSelect) {
      // 多图模式
      const files = Array.from(e.target.files || []);
      if (files.length === 0) return;

      // 验证所有文件
      const validFiles: File[] = [];
      for (const file of files) {
        if (file.size > 5 * 1024 * 1024) {
          alert(`${file.name} 大小超过 5MB`);
          continue;
        }
        if (!file.type.match(/^image\/(jpeg|jpg|png|webp)$/)) {
          alert(`${file.name} 格式不支持`);
          continue;
        }
        validFiles.push(file);
      }

      if (validFiles.length > 0) {
        onImagesSelect(validFiles);
      }
    } else {
      // 单图模式
      const file = e.target.files?.[0];
      if (!file) return;

      if (file.size > 5 * 1024 * 1024) {
        alert('图片大小不能超过 5MB');
        return;
      }

      if (!file.type.match(/^image\/(jpeg|jpg|png|webp)$/)) {
        alert('只支持 JPG、PNG、WEBP 格式');
        return;
      }

      onImageSelect(file);
    }
    
    // 重置 input
    e.target.value = '';
  };

  const handleDrop = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    if (disabled) return;

    if (multiple && onImagesSelect) {
      // 多图模式
      const files = Array.from(e.dataTransfer.files || []);
      if (files.length === 0) return;

      const validFiles: File[] = [];
      for (const file of files) {
        if (file.size > 5 * 1024 * 1024) continue;
        if (!file.type.match(/^image\/(jpeg|jpg|png|webp)$/)) continue;
        validFiles.push(file);
      }

      if (validFiles.length > 0) {
        onImagesSelect(validFiles);
      }
    } else {
      // 单图模式
      const file = e.dataTransfer.files?.[0];
      if (!file) return;

      if (file.size > 5 * 1024 * 1024) {
        alert('图片大小不能超过 5MB');
        return;
      }

      if (!file.type.match(/^image\/(jpeg|jpg|png|webp)$/)) {
        alert('只支持 JPG、PNG、WEBP 格式');
        return;
      }

      onImageSelect(file);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
  };

  // 多图模式渲染
  if (multiple && onImagesSelect && onImageRemoveAt) {
    return (
      <div>
        {label && (
          <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
            <span>{label}</span>
            {imagePreviews.length > 0 && (
              <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs font-semibold rounded-full">
                {imagePreviews.length} 张
              </span>
            )}
          </label>
        )}

        {/* 已上传的图片网格 */}
        {imagePreviews.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-3">
            {imagePreviews.map((preview, index) => (
              <div key={index} className="group relative aspect-square border-2 border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden bg-gray-50 dark:bg-gray-800 hover:border-blue-400 dark:hover:border-blue-500 transition-all">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={preview}
                  alt={`Preview ${index + 1}`}
                  className="w-full h-full object-cover"
                />
                {/* 悬浮遮罩 */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                {/* 图片序号 */}
                <div className="absolute bottom-2 left-2 px-2 py-1 bg-black/70 text-white text-xs font-semibold rounded-md">
                  #{index + 1}
                </div>
                {!disabled && (
                  <button
                    type="button"
                    onClick={() => onImageRemoveAt(index)}
                    className="absolute top-2 right-2 p-1.5 bg-red-500 hover:bg-red-600 text-white rounded-lg shadow-lg transition-all opacity-0 group-hover:opacity-100 hover:scale-110"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

        {/* 上传区域 */}
        <label
          htmlFor="image-upload-multiple"
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          className={`group relative flex flex-col items-center justify-center w-full p-8 border-2 border-dashed rounded-xl cursor-pointer transition-all ${
            disabled
              ? 'opacity-50 cursor-not-allowed bg-gray-100 dark:bg-gray-800'
              : 'border-gray-300 dark:border-gray-600 hover:border-blue-500 dark:hover:border-blue-500 hover:bg-blue-50/50 dark:hover:bg-blue-900/10 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800/50 dark:to-gray-800'
          }`}
        >
          <div className="flex flex-col items-center justify-center text-center">
            <div className="p-3.5 rounded-xl bg-gradient-to-br from-blue-100 to-blue-200 dark:from-blue-900/40 dark:to-blue-800/40 mb-3 group-hover:scale-110 transition-transform">
              <Upload className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-1.5">
              点击或拖拽上传图片
            </h4>
            <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {hint}
            </p>
          </div>
          <input
            ref={fileInputRef}
            id="image-upload-multiple"
            type="file"
            className="hidden"
            accept="image/jpeg,image/jpg,image/png,image/webp"
            onChange={handleFileChange}
            disabled={disabled}
            multiple
          />
        </label>
      </div>
    );
  }

  // 单图模式渲染
  return (
    <div>
      {label && (
        <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-3">
          {label}
        </label>
      )}

      <label
        htmlFor="image-upload"
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        className={`group relative flex flex-col items-center justify-center w-full aspect-[4/3] border-2 border-dashed rounded-xl cursor-pointer transition-all overflow-hidden ${
          disabled
            ? 'opacity-50 cursor-not-allowed bg-gray-100 dark:bg-gray-800'
            : imagePreview
            ? 'border-gray-300 dark:border-gray-600 hover:border-blue-500 dark:hover:border-blue-500'
            : 'border-gray-300 dark:border-gray-600 hover:border-blue-500 dark:hover:border-blue-500 hover:bg-blue-50/50 dark:hover:bg-blue-900/10 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800/50 dark:to-gray-800'
        }`}
      >
        {imagePreview ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={imagePreview}
              alt="Preview"
              className="w-full h-full object-contain"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <div className="text-center">
                <div className="p-3 rounded-xl bg-white/20 backdrop-blur-sm mb-2 mx-auto w-fit">
                  <Upload className="h-6 w-6 text-white" />
                </div>
                <p className="text-white text-sm font-semibold">点击更换图片</p>
              </div>
            </div>
            {!disabled && (
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onImageRemove();
                }}
                className="absolute top-3 right-3 p-2 bg-red-500 hover:bg-red-600 text-white rounded-lg shadow-lg transition-all z-10 opacity-0 group-hover:opacity-100 hover:scale-110"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </>
        ) : (
          <div className="flex flex-col items-center justify-center p-6 text-center">
            <div className="p-4 rounded-xl bg-gradient-to-br from-blue-100 to-blue-200 dark:from-blue-900/40 dark:to-blue-800/40 mb-4 group-hover:scale-110 transition-transform">
              <Upload className="h-8 w-8 text-blue-600 dark:text-blue-400" />
            </div>
            <h4 className="text-base font-semibold text-gray-900 dark:text-white mb-2">
              点击或拖拽上传图片
            </h4>
            <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1.5 justify-center">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {hint}
            </p>
          </div>
        )}
        <input
          ref={fileInputRef}
          id="image-upload"
          type="file"
          className="hidden"
          accept="image/jpeg,image/jpg,image/png,image/webp"
          onChange={handleFileChange}
          disabled={disabled}
        />
      </label>
    </div>
  );
}

