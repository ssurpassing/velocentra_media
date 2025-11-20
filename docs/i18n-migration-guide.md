# 国际化迁移指南

## 📚 目标读者

本指南适用于：
- 需要添加新功能的开发者
- 需要修复国际化问题的维护者
- 需要理解国际化架构的新成员

---

## 🎯 迁移前后对比

### ❌ 旧的方式（已弃用）

```typescript
// 1. 使用 isChinese 判断
const isChinese = locale === 'zh';
const title = isChinese ? '生成视频' : 'Generate Video';

// 2. 配置文件中的双语属性
const model = {
  name: 'Veo 3.1',
  nameCn: 'Veo 3.1',
  description: 'AI video generation',
  descriptionCn: 'AI 视频生成'
};

// 3. API 返回双语错误
return NextResponse.json({
  success: false,
  error: 'Insufficient credits',
  errorCn: '积分不足'
});

// 4. 组件中硬编码文本
<button>生成视频</button>
```

### ✅ 新的方式（推荐）

```typescript
// 1. 使用 useTranslations Hook
const t = useTranslations('namespace');
const title = t('generateVideo');

// 2. 配置文件简化
const model = {
  name: 'Veo 3.1',  // fallback
  // 组件从翻译文件读取: models.video['google-veo-3.1'].name
};

// 3. API 返回错误码
return NextResponse.json({
  success: false,
  error: 'INSUFFICIENT_CREDITS',
  message: 'Insufficient credits'  // 可选的英文说明
});

// 4. 组件使用翻译
<button>{t('generateVideo')}</button>
```

---

## 🔧 实战迁移步骤

### 步骤 1: 识别需要翻译的文本

查找以下模式：
```bash
# 查找 isChinese
grep -r "isChinese" src/

# 查找硬编码中文
grep -r "[\u4e00-\u9fa5]" src/

# 查找双语属性
grep -r "Cn:" src/
grep -r "Cn\":" src/
```

### 步骤 2: 添加翻译键

在 `locales/zh/common.json` 和 `locales/en/common.json` 中添加：

```json
// locales/zh/common.json
{
  "myFeature": {
    "title": "我的功能",
    "description": "这是一个新功能",
    "actions": {
      "submit": "提交",
      "cancel": "取消"
    }
  }
}

// locales/en/common.json
{
  "myFeature": {
    "title": "My Feature",
    "description": "This is a new feature",
    "actions": {
      "submit": "Submit",
      "cancel": "Cancel"
    }
  }
}
```

### 步骤 3: 重构组件

#### Before (旧代码)
```typescript
'use client';

export function MyComponent({ locale }: { locale: string }) {
  const isChinese = locale === 'zh';
  
  return (
    <div>
      <h1>{isChinese ? '我的功能' : 'My Feature'}</h1>
      <p>{isChinese ? '这是一个新功能' : 'This is a new feature'}</p>
      <button>{isChinese ? '提交' : 'Submit'}</button>
    </div>
  );
}
```

#### After (新代码)
```typescript
'use client';

import { useTranslations } from 'next-intl';

export function MyComponent() {
  const t = useTranslations('myFeature');
  
  return (
    <div>
      <h1>{t('title')}</h1>
      <p>{t('description')}</p>
      <button>{t('actions.submit')}</button>
    </div>
  );
}
```

### 步骤 4: 重构错误处理

#### Before (旧代码)
```typescript
// API 路由
if (!user) {
  return NextResponse.json({
    success: false,
    error: 'Please login first',
    errorCn: '请先登录'
  }, { status: 401 });
}

// 前端组件
if (error) {
  const message = locale === 'zh' ? error.errorCn : error.error;
  toast.error(message);
}
```

#### After (新代码)
```typescript
// API 路由
if (!user) {
  return NextResponse.json({
    success: false,
    error: 'UNAUTHORIZED',
    message: 'Please login first'
  }, { status: 401 });
}

// 前端组件
import { useApiError } from '@/shared/hooks/useApiError';

const { translateError } = useApiError();
if (error) {
  const message = translateError(error.error);
  toast.error(message);
}
```

---

## 📝 常见迁移场景

### 场景 1: 数组/列表数据

#### Before
```typescript
const steps = [
  {
    title: isChinese ? '上传' : 'Upload',
    description: isChinese ? '上传图片' : 'Upload images'
  },
  // ...
];
```

#### After
```typescript
const t = useTranslations('myFeature');

const steps = [
  {
    titleKey: 'steps.upload.title',
    descriptionKey: 'steps.upload.description'
  },
  // ...
];

// 渲染时
{steps.map(step => (
  <div key={step.titleKey}>
    <h3>{t(step.titleKey)}</h3>
    <p>{t(step.descriptionKey)}</p>
  </div>
))}
```

### 场景 2: 动态文本

#### Before
```typescript
const message = isChinese 
  ? `已生成 ${count} 张图片`
  : `Generated ${count} images`;
```

#### After
```typescript
// 方案 1: 使用模板字符串
const message = t('generatedCount', { count });

// locales/zh/common.json
{
  "generatedCount": "已生成 {count} 张图片"
}

// 方案 2: 分离数字
const message = `${t('generated')} ${count} ${t('images')}`;
```

### 场景 3: 条件显示

#### Before
```typescript
{hasCredits ? (
  isChinese ? '生成' : 'Generate'
) : (
  isChinese ? '充值' : 'Recharge'
)}
```

#### After
```typescript
{hasCredits ? t('generate') : t('recharge')}
```

### 场景 4: 配置对象

#### Before
```typescript
const models = [
  {
    id: 'veo',
    name: 'Veo 3.1',
    nameCn: 'Veo 3.1',
    description: 'AI video generation',
    descriptionCn: 'AI 视频生成'
  }
];
```

#### After
```typescript
// 配置文件
const models = [
  {
    id: 'veo',
    name: 'Veo 3.1',  // fallback
    // 翻译在 locales/*/common.json 中: models.video.veo.name
  }
];

// 组件中
const t = useTranslations('models.video');
{models.map(model => (
  <div key={model.id}>
    <h3>{t(`${model.id}.name`) || model.name}</h3>
    <p>{t(`${model.id}.description`)}</p>
  </div>
))}
```

---

## ⚠️ 常见陷阱和解决方案

### 陷阱 1: 翻译键不存在

```typescript
// ❌ 错误 - 如果键不存在，会显示键名
<h1>{t('nonExistentKey')}</h1>
// 显示: "nonExistentKey"

// ✅ 正确 - 提供 fallback
<h1>{t('nonExistentKey') || 'Default Title'}</h1>
```

### 陷阱 2: 命名空间错误

```typescript
// ❌ 错误 - 命名空间不匹配
const t = useTranslations('home');
<h1>{t('generators.title')}</h1>
// 查找: home.generators.title (可能不存在)

// ✅ 正确 - 使用正确的命名空间
const t = useTranslations('generators');
<h1>{t('title')}</h1>
// 查找: generators.title
```

### 陷阱 3: 动态键名

```typescript
// ❌ 可能有问题 - 如果 type 是动态的
const type = getUserType(); // 可能返回任意值
<p>{t(type)}</p>

// ✅ 更安全 - 验证并提供 fallback
const validTypes = ['image', 'video', 'audio'];
const type = getUserType();
<p>{validTypes.includes(type) ? t(type) : t('default')}</p>
```

### 陷阱 4: 服务端组件

```typescript
// ❌ 错误 - useTranslations 只能在客户端使用
export default function ServerComponent() {
  const t = useTranslations(); // 错误！
  return <div>{t('title')}</div>;
}

// ✅ 正确 - 添加 'use client'
'use client';
export default function ClientComponent() {
  const t = useTranslations();
  return <div>{t('title')}</div>;
}
```

---

## 🎨 最佳实践

### 1. 命名空间组织

```typescript
// ✅ 推荐 - 按功能模块组织
home/
  simpleSteps/
  videoShowcase/
generators/
  common/
  video/
  image/
errors/
  api/

// ❌ 避免 - 扁平结构
allKeys: {
  homeSimpleStepsTitle: "...",
  homeSimpleStepsStep1: "...",
  // 难以管理和查找
}
```

### 2. 键名规范

```typescript
// ✅ 推荐
t('actions.submit')          // 动作用动词
t('labels.username')         // 标签用名词
t('messages.success')        // 消息
t('errors.validation')       // 错误

// ❌ 避免
t('submitButton')            // 不够灵活
t('userNameLabel')           // 冗余后缀
```

### 3. 复用翻译

```typescript
// ✅ 推荐 - 提取通用翻译
{
  "common": {
    "actions": {
      "submit": "提交",
      "cancel": "取消",
      "delete": "删除"
    }
  }
}

// 使用
const tCommon = useTranslations('common');
<button>{tCommon('actions.submit')}</button>
```

### 4. 错误处理

```typescript
// ✅ 推荐 - 使用错误码
const ERROR_CODES = {
  UNAUTHORIZED: 'UNAUTHORIZED',
  INSUFFICIENT_CREDITS: 'INSUFFICIENT_CREDITS',
} as const;

return {
  error: ERROR_CODES.UNAUTHORIZED
};

// ❌ 避免 - 硬编码错误消息
return {
  error: '请先登录'
};
```

---

## 🧪 测试建议

### 单元测试

```typescript
import { render, screen } from '@testing-library/react';
import { IntlProvider } from 'next-intl';
import zhMessages from '@/locales/zh/common.json';
import enMessages from '@/locales/en/common.json';

describe('MyComponent', () => {
  it('renders Chinese text', () => {
    render(
      <IntlProvider messages={zhMessages} locale="zh">
        <MyComponent />
      </IntlProvider>
    );
    expect(screen.getByText('我的功能')).toBeInTheDocument();
  });

  it('renders English text', () => {
    render(
      <IntlProvider messages={enMessages} locale="en">
        <MyComponent />
      </IntlProvider>
    );
    expect(screen.getByText('My Feature')).toBeInTheDocument();
  });
});
```

---

## 📚 参考资源

- [Next-intl 文档](https://next-intl-docs.vercel.app/)
- 项目文档:
  - `docs/i18n-refactor-summary.md` - 重构总结
  - `docs/i18n-quick-reference.md` - 快速参考
  - `docs/i18n-test-checklist.md` - 测试清单
- 工具函数:
  - `src/shared/utils/error-handler.ts`
  - `src/shared/hooks/useApiError.ts`

---

## ❓ 常见问题 FAQ

### Q: 我应该在哪里添加新的翻译键？

A: 在 `locales/zh/common.json` 和 `locales/en/common.json` 中添加。按功能模块组织，使用嵌套结构。

### Q: 如何处理复数形式？

A: Next-intl 支持 ICU MessageFormat:
```json
{
  "itemCount": "{count, plural, =0 {No items} =1 {One item} other {# items}}"
}
```

### Q: 如何处理日期和数字格式化？

A: 使用 next-intl 的格式化功能:
```typescript
import { useFormatter } from 'next-intl';

const format = useFormatter();
format.dateTime(date, { year: 'numeric', month: 'long' });
format.number(1234.56, { style: 'currency', currency: 'USD' });
```

### Q: 旧代码中的 locale 参数还需要吗？

A: 不需要。`useTranslations` 会自动使用当前路由的 locale。可以逐步移除 locale prop。

### Q: 如何添加新语言？

A: 
1. 创建 `locales/{lang}/common.json`
2. 复制 zh 或 en 的内容
3. 翻译所有键
4. 在 i18n 配置中添加语言代码

---

## 🚀 下一步

完成迁移后:
1. ✅ 运行测试确保功能正常
2. ✅ 检查是否有遗漏的硬编码文本
3. ✅ 更新相关文档
4. ✅ Code Review 时关注国际化规范

