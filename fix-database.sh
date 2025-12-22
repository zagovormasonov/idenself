#!/bin/bash
# Скрипт для исправления проблемы с базой данных на сервере

echo "=== Исправление проблемы с базой данных ==="

# 1. Проверяем, существует ли база данных
echo "Шаг 1: Проверка существования базы данных..."
sudo docker compose exec -T postgres psql -U postgres -tc "SELECT 1 FROM pg_database WHERE datname = 'mvp_db'" | grep -q 1

if [ $? -ne 0 ]; then
    echo "База данных не существует. Создаю..."
    sudo docker compose exec -T postgres psql -U postgres -c "CREATE DATABASE mvp_db;"
    echo "✓ База данных создана"
else
    echo "✓ База данных уже существует"
fi

# 2. Применяем схему Prisma
echo ""
echo "Шаг 2: Применение схемы Prisma..."
sudo docker compose exec app-server npx prisma db push --accept-data-loss
echo "✓ Схема Prisma применена"

# 3. Перезапускаем сервер
echo ""
echo "Шаг 3: Перезапуск сервера..."
sudo docker compose restart app-server
echo "✓ Сервер перезапущен"

# 4. Проверяем логи
echo ""
echo "Шаг 4: Проверка логов (последние 20 строк)..."
sleep 3
sudo docker compose logs --tail=20 app-server

echo ""
echo "=== Готово! ==="
echo "Если ошибки все еще есть, проверьте логи:"
echo "  sudo docker compose logs -f app-server"

