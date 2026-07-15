#!/bin/sh
set -e

echo "⏳ اعمال اسکیمای دیتابیس..."
npx prisma db push --skip-generate

echo "🌱 اجرای seed (idempotent — اجرای چندباره مشکلی ندارد)..."
node prisma/seed.cjs || echo "⚠ seed اجرا نشد (اگر داده‌ها از قبل موجودند، مشکلی نیست)"

echo "🚀 اجرای اپلیکیشن..."
exec "$@"
