# 国际化快速参考指南

## 🚀 快速开始

### 在组件中使用翻译

```typescript
'use client';

import { useTranslations } from 'next-intl';

export function MyComponent() {
  const t = useTranslations('myNamespace');
  
  return (
    <div>
      <h1>{t('title')}</h1>
      <p>{t('description')}</p>
      <button>{t('actions.submit')}</button>
    </div>
  );
}
```

### 处理 API 错误

```typescript
import { useApiError } from '@/shared/hooks/useApiError';

export function MyComponent() {
  const { translateError } = useApiError();
  const [error, setError] = useState('');
  
  const handleSubmit = async () => {
    try {
      const response = await api.post('/endpoint');
      if (!response.success) {
        // 自动翻译错误码或错误消息
        setError(translateError(response.error));
      }
    } catch (err) {
      setError(translateError('INTERNAL_ERROR'));
    }
  };
}
```

---

## 📁 翻译文件结构

```
locales/
├── zh/
│   └── common.json    # 中文翻译
├── en/
│   └── common.json    # 英文翻译
├── ja/
│   └── common.json    # 日语翻译 (待添加)
└── ...
```

---

## 🗂️ 翻译键命名规范

### 按功能模块组织

```json
{
  "models": {
    "image": { ... },
    "video": { ... }
  },
  "generators": {
    "common": { ... },
    "video": { ... },
    "image": { ... }
  },
  "home": {
    "simpleSteps": { ... },
    "videoShowcase": { ... }
  },
  "errors": {
    "api": { ... }
  }
}
```

### 命名约定

- 使用 camelCase: `simpleSteps`, `videoShowcase`
- 嵌套层级: `home.simpleSteps.step1.title`
- 动作用动词: `startGenerating`, `download`
- 标签用名词: `quality`, `duration`

---

## 🔧 常用翻译键

### 生成器

```typescript
// 通用
t('generators.common.pleaseLogin')        // 请先登录
t('generators.common.optimize')           // 优化
t('generators.common.cost')               // 本次生成消耗
t('generators.common.credits')            // 积分
t('generators.common.uploading')          // 上传图片中...
t('generators.common.aiGenerating')       // AI 生成中...

// 视频生成器
t('generators.video.generationMode')      // 生成模式
t('generators.video.qualityLevel')        // 质量级别
t('generators.video.sceneList')           // 场景列表
t('generators.video.textToVideo')         // 文本转视频
t('generators.video.imageToVideo')        // 图片转视频

// 图片生成器
t('generators.image.textToImage')         // 文生图
t('generators.image.imageToImage')        // 图生图
t('generators.image.startGeneration')     // 开始生成图片
```

### 错误消息

```typescript
t('errors.api.UNAUTHORIZED')                      // 请先登录
t('errors.api.INSUFFICIENT_CREDITS')              // 积分不足
t('errors.api.PRO_MODEL_REQUIRES_SUBSCRIPTION')   // Pro 模型需要订阅
t('errors.api.GENERATION_FAILED')                 // 生成失败
```

### 标签

```typescript
t('generators.labels.generator')          // 生成器
t('generators.labels.aspectRatio')        // 宽高比
t('generators.labels.duration')           // 时长
t('generators.labels.quality')            // 质量
t('generators.labels.watermark')          // 水印
```

---

## 🎨 最佳实践

### ✅ 推荐做法

```typescript
// 1. 使用翻译键
const title = t('myModule.title');

// 2. 嵌套结构
const step1 = t('steps.upload.title');
const step2 = t('steps.generate.title');

// 3. 错误处理
const { translateError } = useApiError();
const errorMsg = translateError(apiError);

// 4. 动态内容用占位符或分隔
// JSON: "tags": "1:1,60秒,100张"
const tags = t('showcase.tags').split(',');
```

### ❌ 避免做法

```typescript
// 不要硬编码
const title = isChinese ? '标题' : 'Title';  // ❌

// 不要在 API 返回双语
return { error: 'Error', errorCn: '错误' };  // ❌

// 不要在配置文件加双语属性
{
  name: 'Model',
  nameCn: '模型',  // ❌
}
```

---

## 📝 添加新翻译

### 步骤

1. **确定命名空间和键名**
   ```
   home.newFeature.title
   home.newFeature.description
   ```

2. **添加中文翻译** (`locales/zh/common.json`)
   ```json
   {
     "home": {
       "newFeature": {
         "title": "新功能",
         "description": "这是一个新功能的描述"
       }
     }
   }
   ```

3. **添加英文翻译** (`locales/en/common.json`)
   ```json
   {
     "home": {
       "newFeature": {
         "title": "New Feature",
         "description": "This is a description of the new feature"
       }
     }
   }
   ```

4. **在组件中使用**
   ```typescript
   const t = useTranslations('home.newFeature');
   return <h1>{t('title')}</h1>;
   ```

---

## 🔍 调试技巧

### 检查翻译键是否存在

```typescript
const t = useTranslations();
const value = t('some.key');

// 如果键不存在，会返回键名本身
if (value === 'some.key') {
  console.warn('Translation key not found');
}
```

### 查找未翻译的文本

```bash
# 查找硬编码的中文
grep -r "[\u4e00-\u9fa5]" src/

# 查找 isChinese 判断
grep -r "isChinese" src/
```

---

## 🌍 错误码列表

| 错误码 | 中文 | 英文 |
|--------|------|------|
| `UNAUTHORIZED` | 请先登录 | Please login first |
| `INSUFFICIENT_CREDITS` | 积分不足 | Insufficient credits |
| `PRO_MODEL_REQUIRES_SUBSCRIPTION` | Pro 模型需要订阅 | Pro model requires subscription |
| `PRO_MODEL_DURATION_LIMIT` | 时长限制 | Duration limit |
| `INVALID_REQUEST` | 请求无效 | Invalid request |
| `INTERNAL_ERROR` | 服务器错误 | Internal error |
| `GENERATION_FAILED` | 生成失败 | Generation failed |
| `TIMEOUT` | 请求超时 | Request timeout |

---

## 📚 相关文件

- 翻译文件: `locales/{locale}/common.json`
- 错误处理工具: `src/shared/utils/error-handler.ts`
- 错误 Hook: `src/shared/hooks/useApiError.ts`
- 详细文档: `docs/i18n-refactor-summary.md`

---

## 💡 常见问题

### Q: 如何在 API 路由中返回错误？

```typescript
// ✅ 返回错误码
return NextResponse.json({
  success: false,
  error: 'INSUFFICIENT_CREDITS',
  message: 'Insufficient credits' // 可选的英文说明
}, { status: 403 });
```

### Q: 如何处理动态内容？

```typescript
// 方法1: 使用分隔符
// JSON: "tags": "1:1,60秒,100张"
const tags = t('tags').split(',');

// 方法2: 使用数组
// JSON: "features": ["Feature 1", "Feature 2"]
const features = JSON.parse(t('features'));
```

### Q: 如何测试不同语言？

```typescript
// 在浏览器中切换语言
// URL: /zh/create 或 /en/create
```

---

## 🎯 检查清单

在提交代码前检查：

- [ ] 没有硬编码的用户可见文本
- [ ] 没有 `isChinese` 条件判断
- [ ] API 返回错误码而非双语文本
- [ ] 所有翻译键都存在于 zh/en 文件中
- [ ] 组件使用 `useTranslations` Hook
- [ ] 错误处理使用 `useApiError` Hook

