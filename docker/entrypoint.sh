#!/bin/sh
set -e

echo "⏳ اعمال اسکیمای دیتابیس..."
# --accept-data-loss لازم است چون گاهی جدول‌های حذف‌شده (مثل مایل‌استون) باید drop شوند.
# داده‌های اصلی (تیم‌ها، کاربران، OKRها، چک‌این‌ها) دست‌نخورده می‌مانند.
npx prisma db push --skip-generate --accept-data-loss

echo "🌱 اجرای seed (idempotent — اجرای چندباره مشکلی ندارد)..."
node prisma/seed.cjs || echo "⚠ seed اجرا نشد (اگر داده‌ها از قبل موجودند، مشکلی نیست)"

echo "🚀 اجرای اپلیکیشن..."
exec "$@"
