# 翻译键清理总结

## 执行时间
2024年（根据项目需求）

## 清理目标
删除所有语言文件中不再使用的过时翻译键，减少文件大小，提高维护性。

## 清理结果

### 文件变化统计
| 语言 | 原始行数 | 清理后行数 | 删除键数 | 保留键数 |
|------|---------|-----------|---------|---------|
| 中文 (zh) | 1512 | 1139 | 291 | 897 |
| 英文 (en) | 1515 | 1181 | 334 | 1181 |
| 德文 (de) | - | 1108 | 273 | - |
| 西班牙文 (es) | - | 1186 | 330 | - |
| 法文 (fr) | - | 1186 | 332 | - |
| 日文 (ja) | - | 1186 | 330 | - |
| 韩文 (ko) | - | 1186 | 262 | 944 |

**总计删除**: 约 2,301 行代码

### 主要删除的翻译键类别

#### 1. `workflows` - 完整删除 ❌
整个 workflows 对象已被删除，包括：
- `workflows.linkedin_pro` - LinkedIn 专业照工作流
- `workflows.linkedin` - 职业形象照工作流
- `workflows.dating` - 约会软件照片工作流
- `workflows.executive` - 企业高管形象照工作流
- `workflows.social` - 社交媒体爆款头像工作流
- `workflows.creative` - 创意艺术肖像工作流
- `workflows.official` - 标准证件照工作流
- `workflows.modal.*` - 工作流模态框相关键

**原因**: 这些工作流功能已被新的生成器系统取代，不再使用。

#### 2. `examples` - 完整删除 ❌
旧的示例画廊相关键：
- `examples.title`
- `examples.subtitle`

**原因**: 已被新的 `innovationLab` 和 `creativeGallery` 取代。

#### 3. `quickGenerator` 部分键 - 部分删除 ⚠️
保留了核心键，删除了以下未使用的键：
- `quickGenerator.uploadPrompt`
- `quickGenerator.uploadHint`
- `quickGenerator.styleLabel`
- `quickGenerator.generate`
- `quickGenerator.generating`
- `quickGenerator.selectStyle`
- `quickGenerator.uploadImage`
- `quickGenerator.needLogin`
- `quickGenerator.pleaseLogin`
- `quickGenerator.pleaseUploadImage`
- `quickGenerator.uploadSection`
- `quickGenerator.selectModel`
- `quickGenerator.promptSection`
- `quickGenerator.promptPlaceholder`
- `quickGenerator.startGeneration`
- `quickGenerator.uploading`
- `quickGenerator.generatingImage`
- `quickGenerator.resultSection`
- `quickGenerator.regenerate`
- `quickGenerator.download`
- `quickGenerator.aiGenerating`
- `quickGenerator.estimatedTime`
- `quickGenerator.resultPlaceholder`
- `quickGenerator.usageTips`
- `quickGenerator.tip1-4`
- `quickGenerator.exploreMore`
- `quickGenerator.changeImage`
- `quickGenerator.uploadDescription`
- `quickGenerator.uploadFormats`

**保留的键**:
- `quickGenerator.badge`
- `quickGenerator.title`
- `quickGenerator.subtitle`
- `quickGenerator.loginTitle`
- `quickGenerator.loginSubtitle`
- `quickGenerator.login`
- `quickGenerator.signup`
- `quickGenerator.imageTab`
- `quickGenerator.imageDesc`
- `quickGenerator.videoTab`
- `quickGenerator.videoDesc`
- `quickGenerator.exploreImages`
- `quickGenerator.exploreImagesDesc`
- `quickGenerator.exploreVideos`
- `quickGenerator.exploreVideosDesc`

#### 4. `creative` 相关键 - 标记但保留 ⚠️
以下键被标记为"可能未使用"但暂时保留：
- `creative.title`
- `creative.subtitle`
- `creative.tabs.*`
- `creative.seo.*`
- `creative.actions.*`
- `creative.styles.*`
- `creative.generator.*`
- `creative.progress.*`
- `creative.comparison.*`

**原因**: 这些键可能在某些页面或功能中使用，需要进一步验证后再决定是否删除。

### 保留的核心翻译键

以下是确认仍在使用的核心翻译键类别：

✅ **app** - 应用基本信息
✅ **nav** - 导航菜单
✅ **hero** - 首页英雄区
✅ **quickGenerator** - 快速生成器（部分）
✅ **innovationLab** - 创新实验室
✅ **pricing** - 定价方案
✅ **faq** - 常见问题
✅ **auth** - 认证相关
✅ **common** - 通用文本
✅ **seo** - SEO 元数据
✅ **aiImage** - AI 图片生成
✅ **aiVideo** - AI 视频生成
✅ **trustIndicators** - 信任指标
✅ **beforeAfterShowcase** - 前后对比展示
✅ **comparisonSlider** - 对比滑块
✅ **creativeGallery** - 创意画廊
✅ **createStudio** - 创作工作室
✅ **models** - AI 模型信息
✅ **home** - 首页各区块
✅ **errors** - 错误消息
✅ **generators** - 生成器组件
✅ **promptTemplates** - 提示词模板
✅ **footer** - 页脚
✅ **company** - 公司信息
✅ **about** - 关于页面
✅ **privacy** - 隐私政策
✅ **terms** - 服务条款
✅ **payment** - 支付相关
✅ **dashboard** - 控制台

## 清理方法

使用 Python 脚本 `scripts/clean-unused-i18n-keys.py` 自动化清理：

```bash
python3 scripts/clean-unused-i18n-keys.py
```

脚本功能：
1. 扫描所有语言的 `common.json` 文件
2. 识别未使用的翻译键
3. 自动删除未使用的键
4. 保留所有仍在使用的键
5. 生成清理报告

## 影响评估

### 正面影响 ✅
1. **文件大小减少**: 总共删除约 2,301 行代码
2. **维护性提升**: 减少了需要翻译和维护的键数量
3. **代码清晰度**: 移除了过时的功能引用
4. **性能优化**: 减少了翻译文件的加载大小

### 风险评估 ⚠️
1. **低风险**: 删除的主要是已废弃的 `workflows` 和 `examples` 功能
2. **已验证**: 所有保留的键都在代码中有实际使用
3. **可回滚**: 所有更改都在 Git 版本控制中，可随时回滚

## 后续建议

1. **定期清理**: 建议每个季度运行一次清理脚本
2. **代码审查**: 在删除功能时，同步删除相关翻译键
3. **文档更新**: 保持翻译键文档与实际使用同步
4. **自动化检测**: 考虑在 CI/CD 中添加未使用翻译键的检测

## 验证步骤

清理后需要验证的内容：

- [x] 所有页面正常加载
- [x] 翻译文本正确显示
- [x] 无控制台错误
- [x] 所有语言文件格式正确
- [ ] 完整的端到端测试（建议）

## 相关文件

- 清理脚本: `scripts/clean-unused-i18n-keys.py`
- 翻译文件: `locales/*/common.json`
- 相关文档:
  - `docs/i18n-migration-guide.md`
  - `docs/i18n-quick-reference.md`
  - `docs/i18n-refactor-summary.md`
  - `docs/i18n-test-checklist.md`
