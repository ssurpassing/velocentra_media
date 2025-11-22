/**
 * AI Prompt Optimizer Modal
 * 提示词优化弹窗：选择模板 -> 优化 -> 复制/回填
 * Shared component for both image and video generators
 */

'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import * as Dialog from '@radix-ui/react-dialog';
import { X, Loader2, Copy, Check, ArrowLeft } from 'lucide-react';
import { Button } from '@/shared/components/ui/Button';
import { getVideoTemplates } from '@/shared/config/video-prompt-templates';
import { getAllImageTemplates } from '@/shared/config/image-prompt-templates';
import { http } from '@/infrastructure/http/client';

interface PromptOptimizeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  originalPrompt: string;
  imagePreviews?: string[];
  imagePreview?: string | null;
  onFillBack: (optimizedPrompt: string) => void;
  type?: 'video' | 'image';
}

export function PromptOptimizeModal({
  open,
  onOpenChange,
  originalPrompt,
  imagePreviews = [],
  imagePreview,
  onFillBack,
  type = 'video',
}: PromptOptimizeModalProps) {
  const t = useTranslations(type === 'video' ? 'aiVideo.optimize' : 'aiImage.optimize');
  const tTemplates = useTranslations('promptTemplates');
  const [selectedTemplate, setSelectedTemplate] = useState(type === 'video' ? 'video-general' : 'image-general');
  const [optimizing, setOptimizing] = useState(false);
  const [optimizedPrompt, setOptimizedPrompt] = useState('');
  const [copied, setCopied] = useState(false);

  // 根据类型加载对应的模板
  const templates = type === 'video' ? getVideoTemplates() : getAllImageTemplates();

  // 组合所有图片预览
  const allPreviews = imagePreview ? [imagePreview] : imagePreviews;

  const handleOptimize = async () => {
    if (!originalPrompt.trim()) {
      return;
    }

    try {
      setOptimizing(true);
      setOptimizedPrompt('');

      const response = await http.post('/optimize-prompt', {
        userPrompt: originalPrompt,
        styleKey: selectedTemplate,
      });

      if (response.success && response.data) {
        setOptimizedPrompt(response.data.optimizedPrompt);
      } else {
        console.error('Optimization failed:', response.error);
      }
    } catch (error) {
      console.error('Optimization error:', error);
    } finally {
      setOptimizing(false);
    }
  };

  const handleCopy = async () => {
    if (!optimizedPrompt) return;

    try {
      await navigator.clipboard.writeText(optimizedPrompt);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const handleFillBack = () => {
    if (!optimizedPrompt) return;
    onFillBack(optimizedPrompt);
    onOpenChange(false);
  };

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 animate-in fade-in" />
        <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto z-50 animate-in fade-in zoom-in-95">
          <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex items-center justify-between z-10">
            <div>
              <Dialog.Title className="text-2xl font-bold text-gray-900 dark:text-white">
                {t('title')}
              </Dialog.Title>
              <Dialog.Description className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                {t('subtitle')}
              </Dialog.Description>
            </div>
            <Dialog.Close asChild>
              <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors">
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </Dialog.Close>
          </div>

          <div className="p-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* 左侧：图片预览 */}
              <div className="lg:col-span-1">
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  上传的图片
                </h3>
                {allPreviews.length > 0 ? (
                  <div className="space-y-2">
                    {allPreviews.map((preview, index) => (
                      <div
                        key={index}
                        className="relative aspect-video rounded-lg overflow-hidden border-2 border-gray-200 dark:border-gray-700"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={preview}
                          alt={`Image ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="aspect-video rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600 flex items-center justify-center">
                    <p className="text-sm text-gray-500 dark:text-gray-400">暂无图片</p>
                  </div>
                )}
              </div>

              {/* 右侧：表单 */}
              <div className="lg:col-span-2 space-y-6">
                {/* 原始提示词 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t('originalPrompt')}
                  </label>
                  <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700">
                    <p className="text-sm text-gray-900 dark:text-gray-100">
                      {originalPrompt || '未输入提示词'}
                    </p>
                  </div>
                </div>

                {/* 模板选择 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t('selectTemplate')}
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {templates.map((template) => (
                      <button
                        key={template.id}
                        onClick={() => setSelectedTemplate(template.id)}
                        className={`p-4 rounded-lg border-2 text-left transition-all ${
                          selectedTemplate === template.id
                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                            : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                        }`}
                      >
                        <div className="font-medium text-gray-900 dark:text-white text-sm mb-1">
                          {tTemplates(`${type}.${template.id}.name`)}
                        </div>
                        <div className="text-xs text-gray-600 dark:text-gray-400">
                          {tTemplates(`${type}.${template.id}.description`)}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* 优化按钮 */}
                <Button
                  onClick={handleOptimize}
                  disabled={optimizing || !originalPrompt.trim()}
                  className="w-full"
                  size="lg"
                >
                  {optimizing ? (
                    <>
                      <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                      {t('optimizing')}
                    </>
                  ) : (
                    t('optimize')
                  )}
                </Button>

                {/* 优化结果 */}
                {optimizedPrompt && (
                  <div className="space-y-3 animate-in fade-in slide-in-from-bottom-4">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      {t('optimizedPrompt')}
                    </label>
                    <div className="relative">
                      <textarea
                        value={optimizedPrompt}
                        onChange={(e) => setOptimizedPrompt(e.target.value)}
                        className="w-full h-32 p-4 bg-green-50 dark:bg-green-900/20 border-2 border-green-200 dark:border-green-700 rounded-lg text-sm text-gray-900 dark:text-gray-100 resize-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      />
                    </div>

                    {/* 操作按钮 */}
                    <div className="flex gap-3">
                      <Button
                        onClick={handleCopy}
                        variant="outline"
                        className="flex-1"
                      >
                        {copied ? (
                          <>
                            <Check className="h-4 w-4 mr-2 text-green-500" />
                            {t('copySuccess')}
                          </>
                        ) : (
                          <>
                            <Copy className="h-4 w-4 mr-2" />
                            {t('copy')}
                          </>
                        )}
                      </Button>
                      <Button
                        onClick={handleFillBack}
                        className="flex-1 gradient-primary"
                      >
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        {t('fillBack')}
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

