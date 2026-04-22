@AGENTS.md
Проект: Сайт научного журнала "Гуманитарные исследования Центральной России"
Стек:

Next.js 15 (App Router, TypeScript)
PostgreSQL (локально / Docker)
Tailwind CSS + инлайновые стили
Шрифты: Playfair Display, IBM Plex Sans, Lora (Google Fonts)

Структура проекта:
src/
├── app/
│   ├── page.tsx                    # Главная
│   ├── article/[doi]/page.tsx      # Страница статьи
│   ├── issue/[volume]/[number]/page.tsx  # Страница выпуска
│   ├── archive/page.tsx            # Архив выпусков
│   ├── current/page.tsx            # Редирект на текущий выпуск
│   ├── login/page.tsx              # Вход в админку
│   ├── admin/page.tsx              # Дашборд админки
│   └── api/
│       └── auth/login/route.ts     # API авторизации
├── components/
│   ├── Header.tsx
│   └── Footer.tsx
├── lib/
│   ├── db.ts                       # Подключение к PostgreSQL (pg Pool)
│   └── auth.ts                     # JWT + bcrypt авторизация
└── middleware.ts                   # Защита роутов /admin/*
База данных — таблицы:

issues — выпуски (volume, number, year, is_current)
articles — статьи (title_ru, abstract_ru, doi, pdf_path, jats_xml_path, status)
authors — авторы (last_name_ru, first_name_ru, middle_name_ru, orcid)
affiliations — организации авторов
article_authors — связь авторов со статьями (author_order)
sections — разделы журнала (slug, name_ru, vak_code)
keywords + article_keywords — ключевые слова
article_references — список литературы
admin_users — пользователи админки

Переменные окружения (.env.local):
DATABASE_URL=postgresql://postgres:ПАРОЛЬ@localhost:5432/hum_research
JWT_SECRET=секретная-строка
UPLOAD_DIR=uploads
Цветовая схема (CSS переменные):
css--burgundy: #7a1b1b
--burgundy-dark: #5a1212
--ink: #141414
--ink2: #3a3a3a
--ink3: #6a6a6a
--paper: #faf9f7
--paper2: #f3f1ec
--border: #ddd9d0
Что уже сделано:

Главная страница с hero, статистикой, списком статей, архивом
Страница статьи с метаданными, авторами, аннотацией, ключевыми словами, цитированием
Страница выпуска с оглавлением по разделам
Архив всех выпусков сгруппированный по годам
Авторизация в админку (JWT + cookie)
Дашборд админки со статистикой и списком статей
Docker Compose для PostgreSQL

Что ещё нужно сделать:

Форма загрузки новой статьи с PDF в админке
JATS XML генератор из данных БД
Поиск по статьям, авторам, ключевым словам
Страница автора
Миграция контента из WordPress
Деплой на сервер (Nginx + PM2)

Важные особенности:

Next.js 15: params асинхронный — всегда const { x } = await params
Серверные компоненты не поддерживают onMouseEnter/onMouseLeave — hover через CSS классы
Middleware не поддерживает Node.js библиотеки (jsonwebtoken) — только Edge-совместимый код
Кодировка SQL файлов должна быть UTF-8 (проблема на Windows с WIN1251)