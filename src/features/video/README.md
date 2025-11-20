# 视频生成器模块

基于 Veo 3.1 API 的完整视频生成解决方案，支持文本转视频、图片转视频和参考视频生成。

## 📁 文件结构

```
src/
├── features/video/
│   ├── VideoGenerator.tsx    # 视频生成器主组件
│   ├── index.ts              # 模块导出
│   └── README.md            # 本文档
├── app/api/
│   ├── generate-video/
│   │   └── route.ts          # 视频生成 API（使用回调机制）
│   └── callback/kie/
│       └── route.ts          # KIE API 回调处理（已更新支持视频）
├── infrastructure/services/ai-clients/veo3/
│   ├── veo3-client.ts        # Veo3 客户端实现
│   ├── types.ts             # Veo3 类型定义
│   └── index.ts             # 模块导出
└── shared/types/
    └── video.ts             # 视频生成类型定义
```

## 🎯 功能特性

### 1. **三种生成模式**
- **文本转视频** (Text to Video)
  - 纯文本描述生成视频
  - 无需上传图片
  
- **图片转视频** (Image to Video)
  - 上传 1-2 张图片（开始帧 + 结束帧）
  - AI 生成中间过渡动画
  
- **参考生成** (Reference to Video)
  - 上传 1-3 张参考图片
  - 结合文本提示生成相关视频

### 2. **模型选择**
- **Veo 3.1 Fast** (20 积分)
  - 快速生成，适合快速预览
  - 2-3 分钟完成
  
- **Veo 3.1 Quality** (150 积分)
  - 高质量生成，适合最终输出
  - 3-5 分钟完成

### 3. **多种宽高比**
- Auto：自动选择
- 16:9：横屏（适合桌面/电视）
- 9:16：竖屏（适合手机/短视频）

### 4. **回调机制**
- 异步生成，不阻塞用户操作
- 自动回调更新任务状态
- 支持任务状态轮询

## 🚀 使用方法

### 作为页面使用

访问 `/video` 路径：

```typescript
// 已创建页面: src/app/[locale]/video/page.tsx
// 访问: http://localhost:3000/en/video
// 或: http://localhost:3000/zh/video
```

### 作为组件集成

```typescript
import { VideoGenerator } from '@/features/video';

export default function MyPage() {
  return (
    <div>
      <VideoGenerator />
    </div>
  );
}
```

### API 调用示例

```typescript
// 1. 文本转视频
const response = await fetch('/api/generate-video', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    generationType: 'text-to-video',
    prompt: '一只可爱的小猫在花园里玩耍',
    model: 'veo3_fast',
    aspectRatio: '16:9',
    enableTranslation: true,
  }),
});

const { data } = await response.json();
const taskId = data.taskId; // 用于轮询状态

// 2. 图片转视频
const response = await fetch('/api/generate-video', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    generationType: 'image-to-video',
    prompt: '让这些图片动起来',
    model: 'veo3',
    aspectRatio: '16:9',
    imageUrls: [
      'https://example.com/start.jpg',
      'https://example.com/end.jpg',
    ],
  }),
});

// 3. 查询任务状态
const statusResponse = await fetch(`/api/tasks/${taskId}`);
const { data } = await statusResponse.json();

if (data.task.status === 'completed') {
  const videoUrl = data.task.generated_photos[0];
  console.log('视频生成完成:', videoUrl);
}
```

## 🔧 配置说明

### 环境变量

```bash
# .env.local
KIE_API_KEY=your_kie_api_key_here
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 积分配置

在 `src/app/api/generate-video/route.ts` 中修改：

```typescript
const VIDEO_CREDIT_COSTS = {
  'veo3_fast': 20,  // 快速模式积分
  'veo3': 150,      // 质量模式积分
};
```

## 📊 数据库结构

使用现有的 `generation_tasks` 表：

```sql
-- 视频任务示例
{
  id: 'uuid',
  user_id: 'uuid',
  status: 'processing', -- pending/processing/completed/failed
  ai_model: 'veo-veo3_fast',
  style: 'video',
  external_task_id: 'kie_task_id', -- KIE API 返回的任务 ID
  cost_credits: 20,
  user_prompt: '一只小猫在花园里玩耍',
  generation_params: {
    generationType: 'text-to-video',
    model: 'veo3_fast',
    aspectRatio: '16:9'
  },
  generated_photos: ['https://video-url.mp4'], -- 视频 URL
  created_at: '2025-01-01T00:00:00Z',
  completed_at: '2025-01-01T00:05:00Z'
}
```

## 🔄 回调流程

```
1. 用户提交生成请求
   ↓
2. 创建数据库任务记录（status: pending）
   ↓
3. 扣除用户积分
   ↓
4. 调用 Veo3 API（传入回调 URL）
   ↓
5. 更新任务状态（status: processing, external_task_id）
   ↓
6. 立即返回任务 ID 给前端
   ↓
7. 前端开始轮询任务状态
   ↓
8. KIE API 生成完成后回调 /api/callback/kie
   ↓
9. 更新数据库任务状态（status: completed, generated_photos）
   ↓
10. 前端轮询获取到完成状态，显示视频
```

## 🎨 UI 组件说明

### VideoGenerator 组件

主要功能模块：

1. **生成类型选择**
   - 三个按钮：文本/图片/参考
   - 切换时自动清空图片

2. **模型选择**
   - 显示积分成本
   - 快速模式 vs 质量模式

3. **图片上传区**
   - 拖拽上传
   - 预览缩略图
   - 标注开始/结束帧
   - 最多上传 2-3 张（根据模式）

4. **提示词输入**
   - 多行文本框
   - 自动翻译支持

5. **宽高比选择**
   - Auto / 16:9 / 9:16

6. **生成按钮**
   - 显示积分消耗
   - 上传/生成状态反馈
   - 错误提示

## 🔍 任务状态监控

### 轮询示例

```typescript
async function pollTaskStatus(taskId: string) {
  const maxAttempts = 60; // 最多轮询 60 次（5 分钟）
  let attempts = 0;

  while (attempts < maxAttempts) {
    const response = await fetch(`/api/tasks/${taskId}`);
    const { data } = await response.json();

    if (data.task.status === 'completed') {
      return data.task.generated_photos[0]; // 返回视频 URL
    } else if (data.task.status === 'failed') {
      throw new Error(data.task.error_message);
    }

    await new Promise(resolve => setTimeout(resolve, 5000)); // 等待 5 秒
    attempts++;
  }

  throw new Error('Task timeout');
}
```

## 🐛 故障排查

### 常见问题

1. **回调未触发**
   - 检查 `NEXT_PUBLIC_APP_URL` 是否正确
   - 确保回调 URL 可以被外网访问
   - 查看 `/api/callback/kie` 日志

2. **积分未扣除**
   - 检查数据库 `user_profiles` 表
   - 查看 `credit_transactions` 交易记录

3. **任务一直 processing**
   - 检查 `external_task_id` 是否正确
   - 手动调用 Veo3 API 查询状态
   - 查看 KIE API 回调日志

4. **图片上传失败**
   - 检查文件大小（最大 10MB）
   - 确认图片格式（JPG, PNG）
   - 查看 `/api/upload` 日志

## 📝 扩展建议

### 1. 添加视频表

```sql
CREATE TABLE generated_videos (
  id UUID PRIMARY KEY,
  task_id UUID REFERENCES generation_tasks(id),
  user_id UUID REFERENCES user_profiles(id),
  video_url TEXT NOT NULL,
  video_1080p_url TEXT,
  thumbnail_url TEXT,
  duration INTEGER,
  aspect_ratio TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### 2. 添加视频列表页面

类似图片画廊，显示用户生成的所有视频。

### 3. 添加视频编辑功能

- 视频剪辑
- 添加字幕
- 合并多个视频

### 4. 添加视频扩展功能

使用 Veo3 的 `extendVideo` API 延长视频时长。

```typescript
import { createVeo3Client } from '@/infrastructure/services/ai-clients/veo3';

const veo3 = createVeo3Client();
const extendedVideo = await veo3.extend(
  originalTaskId,
  '继续展示更多细节'
);
```

## 📚 相关文档

- [Veo 3.1 API 文档](https://docs.kie.ai/cn/veo3-api/)
- [项目架构文档](../../../README.md)
- [图片生成器](../creative/README.md)

## 🤝 贡献指南

1. 遵循现有代码风格
2. 添加 TypeScript 类型
3. 编写清晰的注释
4. 测试所有功能

## 📄 许可证

与主项目相同

