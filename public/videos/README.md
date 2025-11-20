# Videos 文件夹

这个文件夹用于存放视频展示区域的演示素材。

## 当前状态

✅ **已使用 `public/showcase/` 文件夹中的视频**

为了避免重复，VideoShowcase 组件现在直接使用 `public/showcase/` 文件夹中的视频素材：
- 视频：`/showcase/video-brand.mp4`
- 缩略图：`/showcase/video-brand-thumb.jpg`

## 如果需要独立的演示视频

如果未来需要为 VideoShowcase 组件创建独立的演示视频，请在此文件夹中添加：

### 需要的文件：
1. `showcase-demo.mp4` - 演示视频（推荐 16:9 比例，1920x1080px，5-10秒）
2. `showcase-demo-poster.jpg` - 视频封面图（16:9 比例，1280x720px）

### 视频要求：
- **用途**：展示 AI 视频生成能力
- **时长**：5-10秒
- **格式**：MP4
- **尺寸**：1920x1080px (16:9)
- **内容建议**：展示 AI 生成的高质量视频效果，可以是创意动画、品牌宣传或特效演示

### 生成方式：
- 使用 Veo 3.1、Sora 2 或其他 AI 视频生成工具
- 或从免费素材网站获取：Pexels Videos、Mixkit 等

---

**注意**：如果此文件夹为空，系统会自动使用 `showcase` 文件夹中的素材。

