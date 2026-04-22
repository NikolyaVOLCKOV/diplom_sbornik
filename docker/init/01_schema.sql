-- ============================================================
-- Гуманитарные исследования Центральной России
-- PostgreSQL Schema v1.1 — чистый PostgreSQL (без Supabase)
-- Кодировка: UTF-8
-- ============================================================

-- Расширения
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "unaccent";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";


-- ============================================================
-- 1. ВЫПУСКИ
-- ============================================================
CREATE TABLE issues (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  number       INTEGER NOT NULL,
  volume       INTEGER NOT NULL,
  year         INTEGER NOT NULL,
  title_ru     TEXT,
  title_en     TEXT,
  published_at DATE,
  cover_url    TEXT,
  is_current   BOOLEAN DEFAULT FALSE,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(volume, number)
);

CREATE UNIQUE INDEX one_current_issue ON issues (is_current) WHERE is_current = TRUE;


-- ============================================================
-- 2. РАЗДЕЛЫ
-- ============================================================
CREATE TABLE sections (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug       TEXT UNIQUE NOT NULL,
  name_ru    TEXT NOT NULL,
  name_en    TEXT,
  vak_code   TEXT,
  sort_order INTEGER DEFAULT 0
);

INSERT INTO sections (slug, name_ru, name_en, vak_code, sort_order) VALUES
  ('history-domestic', 'Отечественная история',                                    'Russian History',    '5.6.1', 10),
  ('history-general',  'Всеобщая история',                                         'World History',      '5.6.2', 20),
  ('pedagogy-general', 'Общая педагогика, история педагогики и образования',       'General Pedagogy',   '5.8.1', 30),
  ('pedagogy-methods', 'Методология и технология профессионального образования',   'Pedagogy Methods',   '5.8.7', 40),
  ('sociology',        'Современные вопросы социологии',                           'Sociology',          '5.4',   50),
  ('young-scientists', 'Слово молодым учёным',                                     'Young Scientists',   NULL,    60),
  ('discussion',       'Дискуссия',                                                'Discussion',         NULL,    70),
  ('review',           'Рецензия',                                                 'Review',             NULL,    80);


-- ============================================================
-- 3. АВТОРЫ
-- ============================================================
CREATE TABLE authors (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  last_name_ru   TEXT NOT NULL,
  first_name_ru  TEXT NOT NULL,
  middle_name_ru TEXT,
  last_name_en   TEXT,
  first_name_en  TEXT,
  orcid          TEXT,
  email          TEXT,
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_authors_fts ON authors USING GIN (
  to_tsvector('russian',
    last_name_ru || ' ' || first_name_ru || ' ' || COALESCE(middle_name_ru, '')
  )
);


-- ============================================================
-- 4. ОРГАНИЗАЦИИ
-- ============================================================
CREATE TABLE affiliations (
  id       UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name_ru  TEXT NOT NULL,
  name_en  TEXT,
  city     TEXT,
  country  TEXT DEFAULT 'Россия',
  ror_id   TEXT
);


-- ============================================================
-- 5. СТАТЬИ
-- ============================================================
CREATE TABLE articles (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  issue_id     UUID REFERENCES issues(id) ON DELETE RESTRICT,
  section_id   UUID REFERENCES sections(id),
  title_ru     TEXT NOT NULL,
  title_en     TEXT,
  abstract_ru  TEXT,
  abstract_en  TEXT,
  doi          TEXT UNIQUE,
  pages_from   INTEGER,
  pages_to     INTEGER,
  pdf_path     TEXT,
  jats_xml_path TEXT,
  full_text_ru TEXT,
  status       TEXT DEFAULT 'published'
               CHECK (status IN ('draft', 'review', 'published', 'retracted')),
  received_at  DATE,
  accepted_at  DATE,
  published_at DATE,
  wp_post_id   INTEGER,
  wp_url       TEXT,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  updated_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_articles_issue   ON articles(issue_id);
CREATE INDEX idx_articles_section ON articles(section_id);
CREATE INDEX idx_articles_status  ON articles(status);
CREATE INDEX idx_articles_fts ON articles USING GIN (
  to_tsvector('russian',
    COALESCE(title_ru, '') || ' ' ||
    COALESCE(abstract_ru, '') || ' ' ||
    COALESCE(full_text_ru, '')
  )
);


-- ============================================================
-- 6. АВТОРЫ СТАТЕЙ (связующая таблица)
-- ============================================================
CREATE TABLE article_authors (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  article_id       UUID REFERENCES articles(id) ON DELETE CASCADE,
  author_id        UUID REFERENCES authors(id) ON DELETE RESTRICT,
  affiliation_id   UUID REFERENCES affiliations(id),
  author_order     INTEGER NOT NULL DEFAULT 1,
  is_corresponding BOOLEAN DEFAULT FALSE
);

CREATE UNIQUE INDEX uq_article_author_order ON article_authors(article_id, author_order);


-- ============================================================
-- 7. КЛЮЧЕВЫЕ СЛОВА
-- ============================================================
CREATE TABLE keywords (
  id      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  word_ru TEXT UNIQUE NOT NULL,
  word_en TEXT
);

CREATE INDEX idx_keywords_trgm ON keywords USING GIN (word_ru gin_trgm_ops);

CREATE TABLE article_keywords (
  article_id UUID REFERENCES articles(id) ON DELETE CASCADE,
  keyword_id UUID REFERENCES keywords(id) ON DELETE CASCADE,
  PRIMARY KEY (article_id, keyword_id)
);


-- ============================================================
-- 8. СПИСОК ЛИТЕРАТУРЫ
-- ============================================================
CREATE TABLE article_references (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  article_id UUID REFERENCES articles(id) ON DELETE CASCADE,
  ref_order  INTEGER NOT NULL,
  raw_text   TEXT NOT NULL,
  doi        TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);


-- ============================================================
-- 9. ПОЛЬЗОВАТЕЛИ АДМИНКИ (вместо Supabase auth)
-- ============================================================
CREATE TABLE admin_users (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email         TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  name          TEXT,
  role          TEXT DEFAULT 'editor' CHECK (role IN ('admin', 'editor')),
  created_at    TIMESTAMPTZ DEFAULT NOW()
);


-- ============================================================
-- VIEWS
-- ============================================================

-- Полная информация о статье
CREATE VIEW v_article_full AS
SELECT
  a.id,
  a.title_ru,
  a.title_en,
  a.abstract_ru,
  a.abstract_en,
  a.doi,
  a.pages_from,
  a.pages_to,
  a.pdf_path,
  a.jats_xml_path,
  a.status,
  a.published_at,
  a.wp_url,
  i.number      AS issue_number,
  i.volume      AS issue_volume,
  i.year        AS issue_year,
  i.title_ru    AS issue_title,
  i.id          AS issue_id,
  s.name_ru     AS section_name,
  s.slug        AS section_slug,
  s.vak_code,
  COALESCE((
    SELECT JSON_AGG(
      JSON_BUILD_OBJECT(
        'id',          au.id,
        'last_name',   au.last_name_ru,
        'first_name',  au.first_name_ru,
        'middle_name', au.middle_name_ru,
        'orcid',       au.orcid,
        'affiliation', af.name_ru,
        'order',       aa.author_order
      ) ORDER BY aa.author_order
    )
    FROM article_authors aa
    JOIN authors au ON aa.author_id = au.id
    LEFT JOIN affiliations af ON aa.affiliation_id = af.id
    WHERE aa.article_id = a.id
  ), '[]'::JSON) AS authors,
  COALESCE((
    SELECT JSON_AGG(k.word_ru ORDER BY k.word_ru)
    FROM article_keywords ak
    JOIN keywords k ON ak.keyword_id = k.id
    WHERE ak.article_id = a.id
  ), '[]'::JSON) AS keywords
FROM articles a
LEFT JOIN issues   i ON a.issue_id   = i.id
LEFT JOIN sections s ON a.section_id = s.id;


-- Оглавление выпуска
CREATE VIEW v_issue_toc AS
SELECT
  i.id          AS issue_id,
  i.number      AS issue_number,
  i.volume,
  i.year,
  i.title_ru    AS issue_title,
  i.published_at,
  i.is_current,
  s.id          AS section_id,
  s.name_ru     AS section_name,
  s.slug        AS section_slug,
  s.sort_order  AS section_order,
  a.id          AS article_id,
  a.title_ru    AS article_title,
  a.doi,
  a.pages_from,
  a.pages_to,
  a.pdf_path,
  a.status,
  (
    SELECT au.last_name_ru || ' ' ||
           LEFT(au.first_name_ru, 1) || '.' ||
           CASE WHEN au.middle_name_ru IS NOT NULL
                THEN LEFT(au.middle_name_ru, 1) || '.'
                ELSE '' END
    FROM article_authors aa
    JOIN authors au ON aa.author_id = au.id
    WHERE aa.article_id = a.id AND aa.author_order = 1
    LIMIT 1
  ) AS first_author
FROM issues i
LEFT JOIN articles  a ON a.issue_id = i.id AND a.status = 'published'
LEFT JOIN sections  s ON a.section_id = s.id
ORDER BY i.year DESC, i.number DESC, s.sort_order, a.pages_from;


-- ============================================================
-- ФУНКЦИИ
-- ============================================================

-- Полнотекстовый поиск
CREATE OR REPLACE FUNCTION search_articles(query TEXT)
RETURNS TABLE (
  id          UUID,
  title_ru    TEXT,
  abstract_ru TEXT,
  doi         TEXT,
  issue_year  INTEGER,
  authors     JSON,
  rank        FLOAT4
) AS $$
  SELECT
    a.id,
    a.title_ru,
    a.abstract_ru,
    a.doi,
    i.year AS issue_year,
    COALESCE((
      SELECT JSON_AGG(JSON_BUILD_OBJECT(
        'last_name',  au.last_name_ru,
        'first_name', au.first_name_ru
      ) ORDER BY aa.author_order)
      FROM article_authors aa
      JOIN authors au ON aa.author_id = au.id
      WHERE aa.article_id = a.id
    ), '[]'::JSON) AS authors,
    ts_rank(
      to_tsvector('russian',
        COALESCE(a.title_ru, '') || ' ' ||
        COALESCE(a.abstract_ru, '') || ' ' ||
        COALESCE(a.full_text_ru, '')
      ),
      plainto_tsquery('russian', query)
    ) AS rank
  FROM articles a
  LEFT JOIN issues i ON a.issue_id = i.id
  WHERE a.status = 'published'
    AND to_tsvector('russian',
          COALESCE(a.title_ru, '') || ' ' ||
          COALESCE(a.abstract_ru, '') || ' ' ||
          COALESCE(a.full_text_ru, '')
        ) @@ plainto_tsquery('russian', query)
  ORDER BY rank DESC
  LIMIT 20;
$$ LANGUAGE SQL STABLE;


-- Автообновление updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_articles_updated_at
  BEFORE UPDATE ON articles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
