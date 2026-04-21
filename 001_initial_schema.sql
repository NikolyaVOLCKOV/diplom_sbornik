-- ============================================================
-- Гуманитарные исследования Центральной России
-- Supabase / PostgreSQL Schema v1.0
-- ============================================================

-- Расширения
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "unaccent";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";  -- для полнотекстового поиска


-- ============================================================
-- 1. ВЫПУСКИ (issues)
-- ============================================================
CREATE TABLE issues (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  number      INTEGER NOT NULL,          -- номер внутри года: 1,2,3,4
  volume      INTEGER NOT NULL,          -- том (сквозной): 37
  year        INTEGER NOT NULL,          -- 2025
  title_ru    TEXT,                      -- "Выпуск 4 (37) 2025"
  title_en    TEXT,
  published_at DATE,
  cover_url   TEXT,                      -- ссылка на обложку в Storage
  is_current  BOOLEAN DEFAULT FALSE,     -- текущий выпуск
  created_at  TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(volume, number)
);

-- Только один текущий выпуск
CREATE UNIQUE INDEX one_current_issue ON issues (is_current) WHERE is_current = TRUE;


-- ============================================================
-- 2. РАЗДЕЛЫ ЖУРНАЛА (sections)
-- ============================================================
CREATE TABLE sections (
  id       UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug     TEXT UNIQUE NOT NULL,          -- 'history', 'pedagogy', 'sociology'
  name_ru  TEXT NOT NULL,
  name_en  TEXT,
  vak_code TEXT,                          -- '5.6.1', '5.8.1' и т.д.
  sort_order INTEGER DEFAULT 0
);

-- Базовые разделы
INSERT INTO sections (slug, name_ru, name_en, vak_code, sort_order) VALUES
  ('history-domestic',  'Отечественная история',                          'Russian History',             '5.6.1', 10),
  ('history-general',   'Всеобщая история',                               'World History',               '5.6.2', 20),
  ('pedagogy-general',  'Общая педагогика, история педагогики',           'General Pedagogy',            '5.8.1', 30),
  ('pedagogy-methods',  'Методология и технология профессионального образования', 'Pedagogy Methods',   '5.8.7', 40),
  ('sociology',         'Современные вопросы социологии',                 'Sociology',                   '5.4',   50),
  ('young-scientists',  'Слово молодым учёным',                           'Young Scientists',            NULL,    60),
  ('discussion',        'Дискуссия',                                      'Discussion',                  NULL,    70),
  ('review',            'Рецензия',                                       'Review',                      NULL,    80);


-- ============================================================
-- 3. АВТОРЫ (authors)
-- ============================================================
CREATE TABLE authors (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  last_name_ru  TEXT NOT NULL,
  first_name_ru TEXT NOT NULL,
  middle_name_ru TEXT,
  last_name_en  TEXT,
  first_name_en TEXT,
  orcid         TEXT,                    -- '0000-0000-0000-0000'
  email         TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_authors_name ON authors USING GIN (
  to_tsvector('russian', last_name_ru || ' ' || first_name_ru || ' ' || COALESCE(middle_name_ru, ''))
);


-- ============================================================
-- 4. ОРГАНИЗАЦИИ/АФФИЛИАЦИИ (affiliations)
-- ============================================================
CREATE TABLE affiliations (
  id       UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name_ru  TEXT NOT NULL,
  name_en  TEXT,
  city     TEXT,
  country  TEXT DEFAULT 'Россия',
  ror_id   TEXT                          -- Research Organization Registry ID
);


-- ============================================================
-- 5. СТАТЬИ (articles) — центральная таблица
-- ============================================================
CREATE TABLE articles (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Принадлежность
  issue_id        UUID REFERENCES issues(id) ON DELETE RESTRICT,
  section_id      UUID REFERENCES sections(id),

  -- Метаданные
  title_ru        TEXT NOT NULL,
  title_en        TEXT,
  abstract_ru     TEXT,
  abstract_en     TEXT,

  -- Идентификаторы
  doi             TEXT UNIQUE,           -- '10.24412/2541-9056-2025-437-7-16'
  pages_from      INTEGER,
  pages_to        INTEGER,

  -- Файлы в Supabase Storage
  pdf_url         TEXT,                  -- storage path: 'articles/{issue_id}/{article_id}.pdf'
  jats_xml_url    TEXT,                  -- storage path: 'articles/{issue_id}/{article_id}.xml'

  -- Полный текст для поиска
  full_text_ru    TEXT,                  -- извлечённый из PDF или WP

  -- Статус
  status          TEXT DEFAULT 'published'
                  CHECK (status IN ('draft', 'review', 'published', 'retracted')),

  -- Даты
  received_at     DATE,                  -- дата получения рукописи
  accepted_at     DATE,                  -- дата принятия
  published_at    DATE,

  -- WP migration
  wp_post_id      INTEGER,               -- оригинальный ID из WordPress (для миграции)
  wp_url          TEXT,                  -- оригинальный URL для редиректов

  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Индексы для поиска
CREATE INDEX idx_articles_issue    ON articles(issue_id);
CREATE INDEX idx_articles_section  ON articles(section_id);
CREATE INDEX idx_articles_doi      ON articles(doi);
CREATE INDEX idx_articles_fts      ON articles USING GIN (
  to_tsvector('russian',
    COALESCE(title_ru, '') || ' ' ||
    COALESCE(abstract_ru, '') || ' ' ||
    COALESCE(full_text_ru, '')
  )
);


-- ============================================================
-- 6. АВТОРЫ СТАТЕЙ (article_authors) — связующая таблица
-- ============================================================
CREATE TABLE article_authors (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  article_id     UUID REFERENCES articles(id) ON DELETE CASCADE,
  author_id      UUID REFERENCES authors(id) ON DELETE RESTRICT,
  affiliation_id UUID REFERENCES affiliations(id),
  author_order   INTEGER NOT NULL DEFAULT 1,  -- порядок авторов
  is_corresponding BOOLEAN DEFAULT FALSE       -- ответственный автор
);

CREATE UNIQUE INDEX uq_article_author_order ON article_authors(article_id, author_order);


-- ============================================================
-- 7. КЛЮЧЕВЫЕ СЛОВА (keywords)
-- ============================================================
CREATE TABLE keywords (
  id      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  word_ru TEXT UNIQUE NOT NULL,
  word_en TEXT
);

CREATE TABLE article_keywords (
  article_id UUID REFERENCES articles(id) ON DELETE CASCADE,
  keyword_id UUID REFERENCES keywords(id) ON DELETE CASCADE,
  PRIMARY KEY (article_id, keyword_id)
);

CREATE INDEX idx_keywords_trgm ON keywords USING GIN (word_ru gin_trgm_ops);


-- ============================================================
-- 8. СПИСОК ЛИТЕРАТУРЫ (references)
-- ============================================================
CREATE TABLE article_references (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  article_id  UUID REFERENCES articles(id) ON DELETE CASCADE,
  ref_order   INTEGER NOT NULL,
  raw_text    TEXT NOT NULL,         -- оригинальная строка ссылки
  doi         TEXT,                  -- если есть
  created_at  TIMESTAMPTZ DEFAULT NOW()
);


-- ============================================================
-- 9. СТАТИСТИКА ПРОСМОТРОВ (views) — опционально
-- ============================================================
CREATE TABLE article_views (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  article_id UUID REFERENCES articles(id) ON DELETE CASCADE,
  viewed_at  TIMESTAMPTZ DEFAULT NOW(),
  ip_hash    TEXT                    -- анонимизированный IP
);


-- ============================================================
-- VIEWS — удобные представления для фронтенда
-- ============================================================

-- Полная информация о статье с авторами
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
  a.pdf_url,
  a.jats_xml_url,
  a.status,
  a.published_at,
  a.wp_url,

  -- Выпуск
  i.number        AS issue_number,
  i.volume        AS issue_volume,
  i.year          AS issue_year,
  i.title_ru      AS issue_title,
  i.id            AS issue_id,

  -- Раздел
  s.name_ru       AS section_name,
  s.slug          AS section_slug,
  s.vak_code,

  -- Авторы (JSON-массив)
  COALESCE(
    (
      SELECT JSON_AGG(
        JSON_BUILD_OBJECT(
          'id',           au.id,
          'last_name',    au.last_name_ru,
          'first_name',   au.first_name_ru,
          'middle_name',  au.middle_name_ru,
          'orcid',        au.orcid,
          'affiliation',  af.name_ru,
          'order',        aa.author_order
        )
        ORDER BY aa.author_order
      )
      FROM article_authors aa
      JOIN authors au ON aa.author_id = au.id
      LEFT JOIN affiliations af ON aa.affiliation_id = af.id
      WHERE aa.article_id = a.id
    ),
    '[]'::JSON
  ) AS authors,

  -- Ключевые слова (JSON-массив)
  COALESCE(
    (
      SELECT JSON_AGG(k.word_ru ORDER BY k.word_ru)
      FROM article_keywords ak
      JOIN keywords k ON ak.keyword_id = k.id
      WHERE ak.article_id = a.id
    ),
    '[]'::JSON
  ) AS keywords

FROM articles a
LEFT JOIN issues  i ON a.issue_id   = i.id
LEFT JOIN sections s ON a.section_id = s.id
WHERE a.status = 'published';


-- Оглавление выпуска
CREATE VIEW v_issue_toc AS
SELECT
  i.id            AS issue_id,
  i.number        AS issue_number,
  i.volume,
  i.year,
  i.title_ru      AS issue_title,
  i.published_at,
  i.is_current,

  s.id            AS section_id,
  s.name_ru       AS section_name,
  s.slug          AS section_slug,
  s.sort_order    AS section_order,

  a.id            AS article_id,
  a.title_ru      AS article_title,
  a.doi,
  a.pages_from,
  a.pages_to,
  a.pdf_url,

  -- Первый автор
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

-- Полнотекстовый поиск по статьям
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
    COALESCE(
      (SELECT JSON_AGG(JSON_BUILD_OBJECT('last_name', au.last_name_ru, 'first_name', au.first_name_ru))
       FROM article_authors aa JOIN authors au ON aa.author_id = au.id
       WHERE aa.article_id = a.id ORDER BY aa.author_order),
      '[]'::JSON
    ) AS authors,
    ts_rank(
      to_tsvector('russian', COALESCE(a.title_ru,'') || ' ' || COALESCE(a.abstract_ru,'') || ' ' || COALESCE(a.full_text_ru,'')),
      plainto_tsquery('russian', query)
    ) AS rank
  FROM articles a
  LEFT JOIN issues i ON a.issue_id = i.id
  WHERE a.status = 'published'
    AND to_tsvector('russian', COALESCE(a.title_ru,'') || ' ' || COALESCE(a.abstract_ru,'') || ' ' || COALESCE(a.full_text_ru,''))
        @@ plainto_tsquery('russian', query)
  ORDER BY rank DESC
  LIMIT 20;
$$ LANGUAGE SQL STABLE;

-- Автообновление updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_articles_updated_at
  BEFORE UPDATE ON articles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();


-- ============================================================
-- RLS — Row Level Security (Supabase)
-- ============================================================

ALTER TABLE issues           ENABLE ROW LEVEL SECURITY;
ALTER TABLE articles         ENABLE ROW LEVEL SECURITY;
ALTER TABLE authors          ENABLE ROW LEVEL SECURITY;
ALTER TABLE affiliations     ENABLE ROW LEVEL SECURITY;
ALTER TABLE sections         ENABLE ROW LEVEL SECURITY;
ALTER TABLE keywords         ENABLE ROW LEVEL SECURITY;
ALTER TABLE article_authors  ENABLE ROW LEVEL SECURITY;
ALTER TABLE article_keywords ENABLE ROW LEVEL SECURITY;
ALTER TABLE article_references ENABLE ROW LEVEL SECURITY;

-- Публичное чтение для всех
CREATE POLICY "public_read_issues"     ON issues     FOR SELECT USING (TRUE);
CREATE POLICY "public_read_articles"   ON articles   FOR SELECT USING (status = 'published');
CREATE POLICY "public_read_authors"    ON authors    FOR SELECT USING (TRUE);
CREATE POLICY "public_read_affiliations" ON affiliations FOR SELECT USING (TRUE);
CREATE POLICY "public_read_sections"   ON sections   FOR SELECT USING (TRUE);
CREATE POLICY "public_read_keywords"   ON keywords   FOR SELECT USING (TRUE);
CREATE POLICY "public_read_aa"         ON article_authors  FOR SELECT USING (TRUE);
CREATE POLICY "public_read_ak"         ON article_keywords FOR SELECT USING (TRUE);
CREATE POLICY "public_read_refs"       ON article_references FOR SELECT USING (TRUE);

-- Запись только для аутентифицированных (редакция)
CREATE POLICY "auth_write_issues"    ON issues    FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "auth_write_articles"  ON articles  FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "auth_write_authors"   ON authors   FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "auth_write_affiliations" ON affiliations FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "auth_write_keywords"  ON keywords  FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "auth_write_aa"        ON article_authors  FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "auth_write_ak"        ON article_keywords FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "auth_write_refs"      ON article_references FOR ALL USING (auth.role() = 'authenticated');
