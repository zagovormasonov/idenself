# IdenSelf Bridge API

Bridge API для интеграции Gemini AI с основным приложением через Render.com.

## Деплой на Render.com

1. Создайте новый Web Service на Render.com
2. Подключите ваш GitHub репозиторий
3. Настройте следующие параметры:
   - **Root Directory**: `bridge`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Environment**: Node

4. Добавьте переменные окружения:
   - `GEMINI_API_KEY` - ваш API ключ от Google Gemini
   - `PORT` - будет установлен автоматически Render.com

5. После деплоя скопируйте URL вашего сервиса (например, `https://your-app.onrender.com`)

6. На вашем основном сервере добавьте переменную окружения:
   ```
   BRIDGE_API_URL=https://your-app.onrender.com
   ```

## Локальная разработка

```bash
cd bridge
npm install
cp .env.example .env
# Отредактируйте .env и добавьте GEMINI_API_KEY
npm start
```

## API Endpoints

- `GET /health` - проверка работоспособности
- `POST /api/generate-part1` - генерация первой части опросника
- `POST /api/generate-part2` - генерация второй части опросника
- `POST /api/generate-results` - генерация финальных результатов

## Безопасность

- CORS настроен для приема запросов от любых источников
- Для production рекомендуется ограничить CORS только вашим доменом
- API ключ Gemini хранится только на Render.com


