#!/bin/bash
# CamZone-EG GitHub Push Helper
# Usage: ./push-to-github.sh <GITHUB_TOKEN>
# Or: GITHUB_TOKEN=your_token ./push-to-github.sh

TOKEN="${1:-$GITHUB_TOKEN}"

if [ -z "$TOKEN" ]; then
  echo "⚠️ يرجى تزويد رمز المرور الشخصي (GitHub Personal Access Token):"
  echo "Usage: ./push-to-github.sh ghp_yourPersonalAccessTokenHere"
  echo "أو يمكنك تعيينه كمتغير بيئة: GITHUB_TOKEN=ghp_xxx ./push-to-github.sh"
  exit 1
fi

echo "🚀 جاري دفع التحديثات إلى مستودع GitHub..."
git push https://hosamebrahim392-blip:${TOKEN}@github.com/hosamebrahim392-blip/CamZon_EG.git main

if [ $? -eq 0 ]; then
  echo "✅ تم دفع التحديثات بنجاح إلى GitHub!"
  echo "🌐 سيقوم GitHub Actions ببناء ونشر الموقع تلقائياً على الرابط الحي:"
  echo "   https://hosamebrahim392-blip.github.io/CamZon_EG/"
else
  echo "❌ فشل الدفع. تأكد من صحة الـ Personal Access Token وصلاحيات repo."
fi
