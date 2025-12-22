# Инструкция: Как обновить Bridge API на Render.com

## Важно понимать:
- **Render.com** - это удаленный сервер (за границей), где работает Bridge API на `idenself.com`
- **Timeweb Cloud** - это российский сервер, где работает основное приложение
- Нужно обновить код на **Render.com**, чтобы добавить эндпоинт `/api/generate-variants`

---

## Шаг 1: Проверьте, как подключен репозиторий на Render.com

1. Войдите на https://dashboard.render.com
2. Найдите ваш **Web Service** (тот, который работает на `idenself.com`)
3. Откройте настройки сервиса
4. Посмотрите раздел **"Repository"** или **"Source"**

**Вариант A:** Если подключен GitHub репозиторий `zagovormasonov/idenself`
- Код уже обновлен в GitHub (я закоммитил изменения)
- Нужно просто запустить деплой

**Вариант B:** Если это отдельный репозиторий или ручной деплой
- Нужно обновить код вручную

---

## Шаг 2: Обновите код на Render.com

### Если подключен GitHub (Вариант A):

1. В панели Render.com откройте ваш Web Service
2. Убедитесь, что:
   - **Root Directory**: `bridge` (должно быть указано!)
   - **Branch**: `main`
3. Нажмите кнопку **"Manual Deploy"** → **"Deploy latest commit"**
4. Дождитесь завершения деплоя (2-3 минуты)
5. Проверьте логи - должно быть: `Bridge API server running on port XXXX`

### Если НЕ подключен GitHub (Вариант B):

1. В Render.com откройте ваш Web Service
2. Перейдите в раздел **"Shell"** (или используйте SSH)
3. Выполните команды:
   ```bash
   cd bridge
   git pull origin main
   npm install
   ```
4. Перезапустите сервис через панель управления Render.com

---

## Шаг 3: Проверьте настройки сервиса на Render.com

Убедитесь, что в настройках указано:

- **Root Directory**: `bridge` ⚠️ **ВАЖНО!**
- **Build Command**: `npm install`
- **Start Command**: `npm start`
- **Environment**: Node

---

## Шаг 4: Проверьте переменные окружения

В разделе **Environment Variables** должно быть:

- `GEMINI_API_KEY` - ваш API ключ от Google Gemini
- `PORT` - обычно устанавливается автоматически Render.com

---

## Шаг 5: Проверьте, что эндпоинт работает

После деплоя проверьте в браузере или через curl:

```bash
curl -X POST https://idenself.com/api/generate-variants \
  -H "Content-Type: application/json" \
  -d '{"complaint": "Тестовая жалоба"}'
```

**Ожидаемый ответ:**
```json
{
  "variants": [
    "Первый вариант...",
    "Второй вариант...",
    "Третий вариант..."
  ]
}
```

Если получаете 404 - значит деплой не прошел или Root Directory указан неправильно.

---

## Шаг 6: Проверьте логи на Render.com

1. В панели Render.com откройте ваш Web Service
2. Перейдите на вкладку **"Logs"**
3. Должны увидеть:
   ```
   Bridge API server running on port XXXX
   Gemini API Key configured: true
   ```

Если видите ошибки - скопируйте их и проверьте настройки.

---

## Если ничего не помогает:

1. **Удалите старый сервис** на Render.com
2. **Создайте новый Web Service**:
   - Подключите репозиторий `zagovormasonov/idenself`
   - **Root Directory**: `bridge` ⚠️
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - Добавьте переменную `GEMINI_API_KEY`
3. После деплоя обновите `BRIDGE_API_URL` на Timeweb Cloud сервере

---

## После успешного обновления:

На российском сервере (Timeweb Cloud) ничего менять не нужно! 
Сервер автоматически начнет использовать новый эндпоинт при следующем запросе.

