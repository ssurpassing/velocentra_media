#!/usr/bin/env python3
"""
清理未使用的翻译键
分析代码中实际使用的翻译键，删除所有语言文件中未使用的键
"""

import json
import os
import re
from pathlib import Path
from typing import Set, Dict, Any

# 项目根目录
PROJECT_ROOT = Path(__file__).parent.parent
LOCALES_DIR = PROJECT_ROOT / "locales"
SRC_DIR = PROJECT_ROOT / "src"

# 已知使用的翻译键（基于代码分析）
USED_KEYS = {
    # app
    "app.name",
    "app.tagline",
    "app.description",
    
    # nav
    "nav.home",
    "nav.createStudio",
    "nav.pricing",
    "nav.aiVideo",
    "nav.aiImage",
    "nav.generate",
    "nav.login",
    "nav.signup",
    "nav.logout",
    
    # hero (ModernHeroSection, HeroSection)
    "hero.badge",
    "hero.welcomeTo",
    "hero.aiTownLab",
    "hero.subtitle",
    "hero.tagline",
    "hero.imageGen",
    "hero.videoGen",
    "hero.creativeDesign",
    "hero.startCreating",
    "hero.viewShowcase",
    "hero.poweredBy",
    "hero.imageLabel",
    "hero.videoLabel",
    "hero.quickBadge",
    "hero.title",
    "hero.cta",
    "hero.ctaSecondary",
    
    # quickGenerator (UnifiedGeneratorSection)
    "quickGenerator.badge",
    "quickGenerator.title",
    "quickGenerator.subtitle",
    "quickGenerator.loginTitle",
    "quickGenerator.loginSubtitle",
    "quickGenerator.login",
    "quickGenerator.signup",
    "quickGenerator.imageTab",
    "quickGenerator.imageDesc",
    "quickGenerator.videoTab",
    "quickGenerator.videoDesc",
    "quickGenerator.exploreImages",
    "quickGenerator.exploreImagesDesc",
    "quickGenerator.exploreVideos",
    "quickGenerator.exploreVideosDesc",
    
    # innovationLab (InnovationLabSection)
    "innovationLab.title",
    "innovationLab.subtitle",
    "innovationLab.createSimilar",
    "innovationLab.viewTutorial",
    "innovationLab.prompt",
    "innovationLab.tutorial",
    "innovationLab.noExamples",
    "innovationLab.loading",
    "innovationLab.imageExample",
    "innovationLab.videoExample",
    
    # pricing
    "pricing.title",
    "pricing.subtitle",
    "pricing.free",
    "pricing.popular",
    "pricing.perMonth",
    "pricing.perYear",
    "pricing.billedAnnually",
    "pricing.save",
    "pricing.getStarted",
    "pricing.buyNow",
    "pricing.subscribe",
    "pricing.monthly",
    "pricing.yearly",
    "pricing.credits",
    "pricing.plans.*",  # 所有定价方案
    
    # faq
    "faq.title",
    "faq.subtitle",
    "faq.q1", "faq.a1",
    "faq.q2", "faq.a2",
    "faq.q3", "faq.a3",
    "faq.q4", "faq.a4",
    "faq.q5", "faq.a5",
    "faq.q6", "faq.a6",
    "faq.q7", "faq.a7",
    "faq.q8", "faq.a8",
    
    # auth
    "auth.login",
    "auth.signup",
    "auth.email",
    "auth.password",
    "auth.confirmPassword",
    "auth.forgotPassword",
    "auth.noAccount",
    "auth.hasAccount",
    "auth.signupNow",
    "auth.loginNow",
    "auth.or",
    "auth.googleLogin",
    "auth.emailSent",
    "auth.checkEmail",
    
    # common
    "common.loading",
    "common.error",
    "common.success",
    "common.cancel",
    "common.confirm",
    "common.save",
    "common.delete",
    "common.edit",
    "common.back",
    "common.next",
    "common.finish",
    "common.select",
    "common.credits",
    
    # seo
    "seo.home.*",
    "seo.pricing.*",
    "seo.creative.*",
    "seo.aiVideo.*",
    "seo.aiImage.*",
    "seo.create.*",
    
    # aiImage
    "aiImage.title",
    "aiImage.subtitle",
    "aiImage.hero.*",
    "aiImage.generator.*",
    "aiImage.myImages.*",
    "aiImage.examples.*",
    "aiImage.optimize.*",
    
    # aiVideo
    "aiVideo.title",
    "aiVideo.subtitle",
    "aiVideo.hero.*",
    "aiVideo.generator.*",
    "aiVideo.examples.*",
    "aiVideo.optimize.*",
    
    # trustIndicators
    "trustIndicators.title",
    "trustIndicators.models",
    "trustIndicators.speed",
    "trustIndicators.seconds",
    "trustIndicators.quality",
    "trustIndicators.support",
    "trustIndicators.poweredBy",
    
    # beforeAfterShowcase
    "beforeAfterShowcase.title",
    "beforeAfterShowcase.subtitle",
    "beforeAfterShowcase.uploadedPhoto",
    "beforeAfterShowcase.aiGenerated",
    "beforeAfterShowcase.example",
    "beforeAfterShowcase.altBefore",
    "beforeAfterShowcase.altAfter",
    
    # comparisonSlider
    "comparisonSlider.beforeLabel",
    "comparisonSlider.afterLabel",
    "comparisonSlider.dragToCompare",
    
    # creativeGallery
    "creativeGallery.title",
    "creativeGallery.subtitle",
    "creativeGallery.portrait",
    "creativeGallery.commercial",
    "creativeGallery.animation",
    "creativeGallery.creative",
    "creativeGallery.allWorks",
    "creativeGallery.imageWorks",
    "creativeGallery.videoWorks",
    "creativeGallery.createSimilar",
    "creativeGallery.viewMore",
    "creativeGallery.loading",
    "creativeGallery.untitled",
    
    # createStudio
    "createStudio.title",
    "createStudio.subtitle",
    "createStudio.loading",
    "createStudio.imageTab",
    "createStudio.videoTab",
    "createStudio.myWorks",
    "createStudio.selectModel",
    "createStudio.imageModels",
    "createStudio.videoModels",
    "createStudio.recommended",
    "createStudio.modelTip",
    "createStudio.imageGen",
    "createStudio.videoGen",
    "createStudio.canvasTip",
    "createStudio.generatorParams",
    "createStudio.adjustParams",
    "createStudio.currentTasks",
    "createStudio.completedTasks",
    "createStudio.noCurrentTasks",
    "createStudio.noCurrentTasksDesc",
    "createStudio.noCompletedTasks",
    "createStudio.noCompletedTasksDesc",
    "createStudio.generating",
    "createStudio.pending",
    "createStudio.processing",
    "createStudio.download",
    "createStudio.clickToSwitch",
    "createStudio.aiImageGen",
    "createStudio.aiVideoGen",
    "createStudio.aiImageGeneration",
    "createStudio.aiVideoGeneration",
    "createStudio.noTasks",
    "createStudio.noTasksDesc",
    "createStudio.inProgress",
    "createStudio.history",
    "createStudio.queueing",
    "createStudio.aiGenerating",
    "createStudio.mayTakeSomeTime",
    "createStudio.generationFailed",
    "createStudio.generationTask",
    "createStudio.copyPrompt",
    "createStudio.regenerate",
    "createStudio.copied",
    "createStudio.promptCopied",
    "createStudio.failedNoDownload",
    
    # models
    "models.image.*",
    "models.video.*",
    
    # home
    "home.simpleSteps.*",
    "home.videoShowcase.*",
    "home.multiFunctionShowcase.*",
    
    # errors
    "errors.api.*",
    
    # generators
    "generators.common.*",
    "generators.video.*",
    "generators.image.*",
    "generators.upload.*",
    "generators.labels.*",
    
    # promptTemplates
    "promptTemplates.image.*",
    "promptTemplates.video.*",
    
    # footer
    "footer.sections.*",
    "footer.links.*",
    "footer.copyright",
    "footer.operatedBy",
    
    # company
    "company.legalName",
    "company.legalNameCn",
    "company.productBrand",
    
    # about
    "about.*",
    
    # privacy
    "privacy.*",
    
    # terms
    "terms.*",
    
    # payment
    "payment.success.*",
    
    # dashboard
    "dashboard.*",
}

# 未使用的翻译键（需要删除）
UNUSED_KEYS = {
    # 旧的 workflows 相关键（已废弃）
    "workflows",
    "examples",  # 旧的 examples section
}


def is_key_used(key_path: str) -> bool:
    """检查翻译键是否被使用"""
    # 精确匹配
    if key_path in USED_KEYS:
        return True
    
    # 通配符匹配
    for used_key in USED_KEYS:
        if used_key.endswith(".*"):
            prefix = used_key[:-2]
            if key_path.startswith(prefix + "."):
                return True
    
    return False


def is_key_unused(key_path: str) -> bool:
    """检查翻译键是否在未使用列表中"""
    for unused_key in UNUSED_KEYS:
        if key_path == unused_key or key_path.startswith(unused_key + "."):
            return True
    return False


def get_all_keys(obj: Dict[str, Any], prefix: str = "") -> Set[str]:
    """递归获取所有翻译键路径"""
    keys = set()
    for key, value in obj.items():
        current_path = f"{prefix}.{key}" if prefix else key
        keys.add(current_path)
        if isinstance(value, dict):
            keys.update(get_all_keys(value, current_path))
    return keys


def remove_unused_keys(obj: Dict[str, Any], prefix: str = "") -> Dict[str, Any]:
    """递归删除未使用的键"""
    result = {}
    for key, value in obj.items():
        current_path = f"{prefix}.{key}" if prefix else key
        
        # 如果是明确标记为未使用的键，跳过
        if is_key_unused(current_path):
            print(f"  ❌ 删除未使用的键: {current_path}")
            continue
        
        # 如果是字典，递归处理
        if isinstance(value, dict):
            cleaned_value = remove_unused_keys(value, current_path)
            # 只保留非空的对象
            if cleaned_value:
                result[key] = cleaned_value
            else:
                print(f"  ❌ 删除空对象: {current_path}")
        else:
            # 叶子节点，检查是否被使用
            if is_key_used(current_path):
                result[key] = value
            else:
                print(f"  ⚠️  可能未使用: {current_path}")
                # 保留，以防误删
                result[key] = value
    
    return result


def clean_translation_file(file_path: Path):
    """清理单个翻译文件"""
    print(f"\n处理文件: {file_path.relative_to(PROJECT_ROOT)}")
    
    with open(file_path, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    # 获取所有键
    all_keys = get_all_keys(data)
    print(f"  总键数: {len(all_keys)}")
    
    # 删除未使用的键
    cleaned_data = remove_unused_keys(data)
    
    # 保存清理后的文件
    with open(file_path, 'w', encoding='utf-8') as f:
        json.dump(cleaned_data, f, ensure_ascii=False, indent=2)
    
    # 统计
    cleaned_keys = get_all_keys(cleaned_data)
    removed_count = len(all_keys) - len(cleaned_keys)
    print(f"  ✅ 删除了 {removed_count} 个键")
    print(f"  ✅ 保留了 {len(cleaned_keys)} 个键")


def main():
    """主函数"""
    print("=" * 60)
    print("清理未使用的翻译键")
    print("=" * 60)
    
    # 获取所有语言的 common.json 文件
    locale_files = list(LOCALES_DIR.glob("*/common.json"))
    
    if not locale_files:
        print("❌ 未找到翻译文件")
        return
    
    print(f"\n找到 {len(locale_files)} 个翻译文件:")
    for file in locale_files:
        print(f"  - {file.relative_to(PROJECT_ROOT)}")
    
    # 清理每个文件
    for file_path in locale_files:
        clean_translation_file(file_path)
    
    print("\n" + "=" * 60)
    print("✅ 清理完成！")
    print("=" * 60)


if __name__ == "__main__":
    main()
