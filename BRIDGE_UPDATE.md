# Инструкция по обновлению Bridge API на Render.com

## Проблема
Bridge API на `idenself.com` не имеет нового эндпоинта `/api/generate-variants`, что вызывает ошибку 404.

## Решение

### Вариант 1: Автоматическое обновление через GitHub (рекомендуется)

1. Убедитесь, что код Bridge API закоммичен в репозиторий:
   ```bash
   git add bridge/
   git commit -m "Add /api/generate-variants endpoint"
   git push origin main
   ```

2. На Render.com:
   - Откройте ваш Web Service для Bridge API
   - Render автоматически обнаружит изменения в репозитории
   - Нажмите "Manual Deploy" → "Deploy latest commit"
   - Дождитесь завершения деплоя

### Вариант 2: Ручное обновление

1. На Render.com откройте ваш Bridge API сервис
2. Перейдите в раздел "Shell"
3. Выполните:
   ```bash
   cd bridge
   git pull origin main
   npm install
   ```
4. Перезапустите сервис через панель управления

### Проверка

После обновления проверьте, что эндпоинт работает:

```bash
curl -X POST https://idenself.com/api/generate-variants \
  -H "Content-Type: application/json" \
  -d '{"complaint": "Тестовая жалоба"}'
```

Должен вернуться JSON с массивом `variants`.

## Важно

После обновления Bridge API на Render.com, ваш основной сервер автоматически начнет использовать новый эндпоинт при следующем запросе. Никаких изменений на основном сервере не требуется.

