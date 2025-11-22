#!/usr/bin/env python3
"""
对比各语言翻译文件，找出缺失的翻译键
以中文为基准，检查其他语言缺少哪些键
"""

import json
from pathlib import Path
from typing import Dict, Set, Any, List

# 项目根目录
PROJECT_ROOT = Path(__file__).parent.parent
LOCALES_DIR = PROJECT_ROOT / "locales"

# 语言配置
LANGUAGES = {
    'zh': '中文',
    'en': '英文',
    'de': '德文',
    'es': '西班牙文',
    'fr': '法文',
    'ja': '日文',
    'ko': '韩文',
}

# 基准语言
BASE_LANG = 'zh'


def get_all_keys(obj: Dict[str, Any], prefix: str = "") -> Set[str]:
    """递归获取所有翻译键路径"""
    keys = set()
    for key, value in obj.items():
        current_path = f"{prefix}.{key}" if prefix else key
        if isinstance(value, dict):
            keys.update(get_all_keys(value, current_path))
        else:
            # 只记录叶子节点
            keys.add(current_path)
    return keys


def get_nested_value(obj: Dict[str, Any], key_path: str) -> Any:
    """根据键路径获取嵌套值"""
    keys = key_path.split('.')
    value = obj
    for key in keys:
        if isinstance(value, dict) and key in value:
            value = value[key]
        else:
            return None
    return value


def load_translation_file(lang: str) -> Dict[str, Any]:
    """加载翻译文件"""
    file_path = LOCALES_DIR / lang / "common.json"
    with open(file_path, 'r', encoding='utf-8') as f:
        return json.load(f)


def compare_languages():
    """对比所有语言的翻译键"""
    print("=" * 80)
    print("翻译键对比分析")
    print("=" * 80)
    print(f"\n基准语言: {LANGUAGES[BASE_LANG]} ({BASE_LANG})")
    print()
    
    # 加载所有语言文件
    translations = {}
    all_keys = {}
    
    for lang_code in LANGUAGES.keys():
        try:
            translations[lang_code] = load_translation_file(lang_code)
            all_keys[lang_code] = get_all_keys(translations[lang_code])
            print(f"✅ 加载 {LANGUAGES[lang_code]} ({lang_code}): {len(all_keys[lang_code])} 个键")
        except Exception as e:
            print(f"❌ 加载 {LANGUAGES[lang_code]} ({lang_code}) 失败: {e}")
            return
    
    print()
    print("=" * 80)
    
    # 以中文为基准，检查其他语言缺少的键
    base_keys = all_keys[BASE_LANG]
    
    for lang_code, lang_name in LANGUAGES.items():
        if lang_code == BASE_LANG:
            continue
        
        print(f"\n【{lang_name} ({lang_code})】与中文对比:")
        print("-" * 80)
        
        current_keys = all_keys[lang_code]
        
        # 缺少的键
        missing_keys = base_keys - current_keys
        # 多余的键
        extra_keys = current_keys - base_keys
        
        if not missing_keys and not extra_keys:
            print(f"✅ 完全一致！无缺失，无多余")
        else:
            if missing_keys:
                print(f"\n❌ 缺少 {len(missing_keys)} 个键:")
                # 按键路径排序并分组显示
                missing_by_category = {}
                for key in sorted(missing_keys):
                    category = key.split('.')[0]
                    if category not in missing_by_category:
                        missing_by_category[category] = []
                    missing_by_category[category].append(key)
                
                for category, keys in sorted(missing_by_category.items()):
                    print(f"\n  [{category}] 类别缺少 {len(keys)} 个键:")
                    for key in keys[:10]:  # 只显示前10个
                        # 获取中文值作为参考
                        zh_value = get_nested_value(translations[BASE_LANG], key)
                        if isinstance(zh_value, str) and len(zh_value) < 50:
                            print(f"    - {key}: \"{zh_value}\"")
                        else:
                            print(f"    - {key}")
                    if len(keys) > 10:
                        print(f"    ... 还有 {len(keys) - 10} 个键")
            
            if extra_keys:
                print(f"\n⚠️  多余 {len(extra_keys)} 个键 (中文没有):")
                extra_by_category = {}
                for key in sorted(extra_keys):
                    category = key.split('.')[0]
                    if category not in extra_by_category:
                        extra_by_category[category] = []
                    extra_by_category[category].append(key)
                
                for category, keys in sorted(extra_by_category.items()):
                    print(f"\n  [{category}] 类别多余 {len(keys)} 个键:")
                    for key in keys[:5]:  # 只显示前5个
                        print(f"    - {key}")
                    if len(keys) > 5:
                        print(f"    ... 还有 {len(keys) - 5} 个键")
        
        print()
    
    # 汇总统计
    print("=" * 80)
    print("\n📊 汇总统计:")
    print("-" * 80)
    print(f"{'语言':<15} {'键总数':<10} {'缺失数':<10} {'多余数':<10} {'完整度':<10}")
    print("-" * 80)
    
    for lang_code, lang_name in LANGUAGES.items():
        if lang_code == BASE_LANG:
            print(f"{lang_name} ({lang_code}){'':<6} {len(base_keys):<10} {'基准':<10} {'基准':<10} {'100%':<10}")
        else:
            current_keys = all_keys[lang_code]
            missing = len(base_keys - current_keys)
            extra = len(current_keys - base_keys)
            completeness = (len(base_keys & current_keys) / len(base_keys) * 100) if base_keys else 100
            print(f"{lang_name} ({lang_code}){'':<6} {len(current_keys):<10} {missing:<10} {extra:<10} {completeness:.1f}%")
    
    print()
    print("=" * 80)
    
    # 生成缺失键的详细报告
    print("\n📝 生成详细缺失键列表...")
    
    for lang_code, lang_name in LANGUAGES.items():
        if lang_code == BASE_LANG:
            continue
        
        current_keys = all_keys[lang_code]
        missing_keys = base_keys - current_keys
        
        if missing_keys:
            output_file = PROJECT_ROOT / f"missing-keys-{lang_code}.json"
            missing_data = {}
            
            for key in sorted(missing_keys):
                zh_value = get_nested_value(translations[BASE_LANG], key)
                missing_data[key] = {
                    "zh": zh_value,
                    "en": get_nested_value(translations.get('en', {}), key) or ""
                }
            
            with open(output_file, 'w', encoding='utf-8') as f:
                json.dump(missing_data, f, ensure_ascii=False, indent=2)
            
            print(f"  ✅ {lang_name}: {output_file.name}")


def main():
    """主函数"""
    compare_languages()
    print("\n✅ 对比完成！\n")


if __name__ == "__main__":
    main()
