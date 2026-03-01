# AnonWave — анонимный мессенджер

Красивый веб-мессенджер без регистрации:
- случайный анонимный ник;
- общий realtime-чат через Firebase Realtime Database;
- адаптивный glassmorphism-дизайн;
- запуск как статический сайт через GitHub Pages.

## Быстрый запуск

1. Открой `index.html` через локальный сервер.
2. Вставь свой Firebase конфиг в блоке **Firebase настройки**.
3. Нажми **Войти в чат**.

## Локально

```bash
python3 -m http.server 4173
```

Открой `http://localhost:4173`.

## Деплой через GitHub Pages (автоматически)

В проект уже добавлен workflow: `.github/workflows/deploy-pages.yml`.

1. Создай репозиторий `simple-chat` на GitHub.
2. Запушь проект в одну из веток: `main` **или** `work`.
3. На GitHub зайди в **Settings → Pages** и в разделе **Source** выбери **GitHub Actions**.
4. Дождись успешного workflow **Deploy static site to GitHub Pages**.
5. Публичная ссылка будет:
   `https://kraken0fficial.github.io/simple-chat/`

## Если по ссылке 404

1. Проверь, что workflow отработал успешно в **Actions**.
2. Проверь, что в **Settings → Pages** выбран источник **GitHub Actions**.
3. Убедись, что последний push был в `main` или `work`.
4. Подожди 1–5 минут после успешного деплоя (кеш GitHub Pages).

## Команды для пуша

```bash
git remote add origin https://github.com/kraken0fficial/simple-chat.git
git push -u origin work
```

Или в `main`:

```bash
git branch -M main
git push -u origin main
```

## Важно

Для рабочего чата нужен ваш собственный Firebase проект с включенным Realtime Database.
