# ---- مرحله ۱: نصب وابستگی‌ها ----
FROM node:22-alpine AS deps
WORKDIR /app
RUN apk add --no-cache openssl libc6-compat
COPY package.json package-lock.json* ./
COPY prisma ./prisma
RUN npm ci --no-audit --no-fund

# ---- مرحله ۲: بیلد ----
FROM node:22-alpine AS builder
WORKDIR /app
RUN apk add --no-cache openssl libc6-compat
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
# در زمان بیلد به دیتابیس نیاز نیست؛ prisma generate + next build
# seed هم به یک فایل مستقل باندل می‌شود تا ایمیج نهایی به tsx نیاز نداشته باشد
RUN npx prisma generate \
    && npm run build \
    && npx esbuild prisma/seed.ts --bundle --platform=node --format=cjs \
       --outfile=prisma/seed.cjs --external:@prisma/client

# ---- مرحله ۳: اجرا ----
FROM node:22-alpine AS runner
WORKDIR /app
RUN apk add --no-cache openssl libc6-compat
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# خروجی standalone نکست + فایل‌های استاتیک
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

# اسکیما + seed باندل‌شده + CLI پریزما برای migrate هنگام استارت
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/prisma ./node_modules/prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/.bin ./node_modules/.bin
# تبدیل CRLF→LF برای وقتی که کد روی ویندوز checkout شده باشد
COPY docker/entrypoint.sh ./entrypoint.sh
RUN sed -i 's/\r$//' ./entrypoint.sh && chmod +x ./entrypoint.sh

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

ENTRYPOINT ["./entrypoint.sh"]
CMD ["node", "server.js"]
