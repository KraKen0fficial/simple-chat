# AnonWave (simple-chat)

Красивый анонимный мессенджер на Firebase Realtime Database.

## Что умеет
- Анонимный вход без регистрации.
- Авто-генерация личности (псевдоним + цвет).
- Раздельные комнаты (`?r=<room>`), чтобы делиться приватной ссылкой.
- Кнопка копирования ссылки на текущую комнату.
- Сообщения в реальном времени.
- Адаптивный интерфейс (desktop/mobile).

## Локальный запуск
```bash
python3 -m http.server 4173
```

Откройте `http://localhost:4173`.

## Публикация на GitHub Pages (публичная ссылка)
1. Создайте репозиторий на GitHub.
2. Запушьте код:

```bash
git remote add origin https://github.com/<your-user>/<your-repo>.git
git branch -M main
git push -u origin main
```

3. В GitHub откройте **Settings → Pages**.
4. В блоке **Build and deployment**:
   - **Source**: Deploy from a branch
   - **Branch**: `main` и `/ (root)`
5. Нажмите **Save**.
6. Через ~1 минуту появится публичная ссылка:
   `https://<your-user>.github.io/<your-repo>/`

## Важно
Сейчас в `index.html` стоят demo-настройки Firebase. Для реального использования замените конфиг на ваш проект Firebase.
