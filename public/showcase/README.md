# 🎨 Showcase 素材生成指南

这个文件夹用于存放首页"多功能展示"区域的示例素材。

## 📋 素材清单

### 图片素材（2张）

#### 1. avatar-linkedin.jpg
- **用途**：LinkedIn 专业头像示例
- **尺寸**：1:1 比例（正方形），推荐 1024x1024px
- **格式**：JPG 或 PNG
- **AI 生成提示词**：

```
Professional LinkedIn headshot portrait of a business professional, 
studio lighting, corporate background, confident expression, 
business casual attire, high quality photography, 
sharp focus, professional color grading, 
suitable for corporate profile picture
```

**中文提示词**：
```
专业商务肖像照，职业人士形象照，工作室灯光，
公司背景，自信的表情，商务休闲装，
高质量摄影，清晰对焦，专业调色，
适合企业头像使用，LinkedIn 风格
```

**参考风格**：
- 干净的单色或虚化背景
- 专业的灯光布置
- 正式但友好的表情
- 商务或商务休闲着装

---

#### 2. poster-product.jpg
- **用途**：产品广告海报示例
- **尺寸**：16:9 比例（横屏），推荐 1920x1080px
- **格式**：JPG 或 PNG
- **AI 生成提示词**：

```
Modern product advertisement poster design, 
sleek smartphone or tech gadget floating on gradient background,
vibrant colors (blue and purple gradients), 
minimalist design, clean composition, 
professional commercial photography style,
marketing materials, high-end product showcase
```

**中文提示词**：
```
现代产品广告海报设计，时尚科技产品（手机或数码产品）
悬浮在渐变背景上，鲜艳的颜色（蓝色和紫色渐变），
极简设计风格，干净的构图，专业商业摄影风格，
营销素材，高端产品展示，电商广告风格
```

**参考风格**：
- 现代简约设计
- 渐变色背景
- 产品居中悬浮
- 科技感强

---

### 视频素材（2个视频 + 2个缩略图）

#### 3. video-brand.mp4
- **用途**：品牌宣传视频示例
- **尺寸**：16:9 比例，推荐 1920x1080px
- **时长**：5-10秒
- **格式**：MP4
- **AI 生成提示词（使用 Runway、Pika 或其他视频 AI）**：

```
Brand promotional video showing modern office environment 
with creative team collaboration, smooth camera movement,
professional lighting, corporate colors, 
dynamic transitions, uplifting atmosphere,
business success theme, high-quality cinematography
```

**中文提示词**：
```
品牌宣传视频，展示现代办公环境，创意团队协作场景，
流畅的镜头运动，专业灯光，企业色调，
动态转场效果，积极向上的氛围，
商业成功主题，高质量电影摄影风格，
5-10秒短视频
```

**替代方案**：
- 如果 AI 生成视频困难，可以使用免费视频网站：
  - Pexels Videos (pexels.com/videos)
  - Pixabay Videos (pixabay.com/videos)
  - 搜索关键词：brand, business, corporate, team

---

#### 4. video-brand-thumb.jpg
- **用途**：品牌宣传视频的缩略图
- **尺寸**：16:9 比例，推荐 1280x720px
- **格式**：JPG
- **生成方式**：
  - 从 video-brand.mp4 中截取代表性的一帧
  - 或使用 AI 生成与视频主题相符的图片

**AI 生成提示词**：
```
Video thumbnail for brand promotional content,
modern office team meeting, professional business setting,
bright lighting, corporate atmosphere, 
cinematic composition, high quality
```

---

#### 5. animation-character.mp4
- **用途**：角色动画短片示例
- **尺寸**：9:16 比例（竖屏），推荐 1080x1920px
- **时长**：10秒左右
- **格式**：MP4
- **AI 生成提示词**：

```
Animated character in motion, cute 3D character walking or dancing,
colorful background, smooth animation, 
playful and friendly style, cartoon aesthetics,
vertical video format (9:16), short loop animation
```

**中文提示词**：
```
角色动画短片，可爱的3D角色行走或跳舞，
彩色背景，流畅的动画效果，
有趣友好的风格，卡通美学，
竖屏视频格式（9:16），短循环动画，
10秒动画演示
```

**替代方案**：
- 使用静态图片 + AI 动画工具（如 Runway Gen-2 Image to Video）
- 从 Mixkit 或 Pexels 下载免费动画素材

---

#### 6. animation-thumb.jpg
- **用途**：角色动画的缩略图
- **尺寸**：9:16 比例（竖屏），推荐 1080x1920px
- **格式**：JPG
- **生成方式**：
  - 从 animation-character.mp4 中截取最有代表性的一帧
  - 或使用 AI 生成与动画主题相符的图片

**AI 生成提示词**：
```
Vertical thumbnail for character animation,
cute 3D animated character, colorful background,
playful and energetic pose, cartoon style,
suitable for mobile vertical video format
```

---

## 🎯 快速生成建议

### 图片生成工具推荐：
1. **Midjourney** - 质量最高（需付费）
2. **DALL-E 3** - ChatGPT Plus 可用
3. **Stable Diffusion** - 免费开源
4. **Leonardo.ai** - 免费额度

### 视频生成工具推荐：
1. **Runway Gen-2** - 专业视频生成
2. **Pika Labs** - 高质量视频
3. **Stable Video Diffusion** - 开源方案

### 免费素材网站（备选方案）：
1. **图片**：Unsplash, Pexels, Pixabay
2. **视频**：Pexels Videos, Mixkit, Pixabay Videos

---

## 📝 文件命名规范

请确保文件名完全一致（区分大小写）：

```
showcase/
├── avatar-linkedin.jpg       ← LinkedIn 头像
├── poster-product.jpg        ← 产品海报
├── video-brand.mp4           ← 品牌视频
├── video-brand-thumb.jpg     ← 品牌视频缩略图
├── animation-character.mp4   ← 角色动画
└── animation-thumb.jpg       ← 动画缩略图
```

---

## 🎨 配色建议

为保持网站整体风格统一，建议素材配色：

**主色调**：
- 主色：蓝色/紫色渐变 (#3B82F6 → #8B5CF6)
- 辅色：金黄色 (#F59E0B)
- 背景：浅色/白色

**风格**：
- 现代简约
- 专业商务
- 科技感
- 充满活力

---

## ✅ 检查清单

生成素材后，请检查：

- [ ] 所有 6 个文件都已生成
- [ ] 文件名完全匹配（包括大小写）
- [ ] 图片尺寸符合要求（至少达到最低分辨率）
- [ ] 视频可以正常播放（格式为 MP4）
- [ ] 文件大小合理（图片 < 1MB，视频 < 10MB）
- [ ] 素材风格统一，符合网站整体设计

---

## 🚀 快速开始

1. 选择你喜欢的 AI 工具
2. 复制对应的提示词
3. 生成素材
4. 下载并重命名文件
5. 放到 `public/showcase/` 文件夹下
6. 刷新网站查看效果

**祝你生成顺利！** 🎉

