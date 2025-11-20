#!/usr/bin/env python3
"""
Add missing translation sections to fr, ja, ko files
Uses the German file as structure reference
"""
import json
import sys

def load_json(path):
    with open(path, 'r', encoding='utf-8') as f:
        return json.load(f)

def save_json(path, data):
    with open(path, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
        f.write('\n')

# Load German (already complete) as structure reference
de_data = load_json('locales/de/common.json')

# Missing section keys
missing_keys = ['trustIndicators', 'beforeAfterShowcase', 'comparisonSlider', 
                'creativeGallery', 'createStudio', 'models', 'home', 
                'errors', 'generators', 'promptTemplates', 'footer']

# Load and update French
fr_data = load_json('locales/fr/common.json')
for key in missing_keys:
    if key in de_data and key not in fr_data:
        fr_data[key] = de_data[key]  # Copy structure from German temporarily
save_json('locales/fr/common.json', fr_data)
print(f"✓ French updated: {len(json.dumps(fr_data).splitlines())} lines")

# Load and update Japanese  
ja_data = load_json('locales/ja/common.json')
for key in missing_keys:
    if key in de_data and key not in ja_data:
        ja_data[key] = de_data[key]  # Copy structure from German temporarily
save_json('locales/ja/common.json', ja_data)
print(f"✓ Japanese updated: {len(json.dumps(ja_data).splitlines())} lines")

# Load and update Korean
ko_data = load_json('locales/ko/common.json')
for key in missing_keys:
    if key in de_data and key not in ko_data:
        ko_data[key] = de_data[key]  # Copy structure from German temporarily
save_json('locales/ko/common.json', ko_data)
print(f"✓ Korean updated: {len(json.dumps(ko_data).splitlines())} lines")

print("\n✅ All files updated with structure. Manual translation needed for proper localization.")

