import { query } from './db';

// === Метаданные журнала — поправь под себя ===
const JOURNAL = {
    title_ru: 'Гуманитарные исследования Центральной России',
    title_en: 'Humanities Researches of the Central Russia',
    abbrev: 'ГИЦР',
    issn: '2541-9056',
    publisher_name: 'Воронежский государственный педагогический университет', // ← УТОЧНИ
    publisher_loc: 'Воронеж', // ← УТОЧНИ
    publisher_id: 'hum-research',
};

// === Утилиты ===

function escapeXml(s: string | null | undefined): string {
    if (s == null) return '';
    return String(s)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');
}

function dateParts(d: Date | string | null): { year: string; month: string; day: string } | null {
    if (!d) return null;
    const date = d instanceof Date ? d : new Date(d);
    if (isNaN(date.getTime())) return null;
    return {
        year: String(date.getUTCFullYear()),
        month: String(date.getUTCMonth() + 1).padStart(2, '0'),
        day: String(date.getUTCDate()).padStart(2, '0'),
    };
}

// Помощник: убирает пустые строки из массива и склеивает через \n
const lines = (parts: (string | false | null | undefined)[]): string =>
    parts.filter(Boolean).join('\n');

// === Типы данных ===

type Author = {
    last_name_ru: string;
    first_name_ru: string;
    middle_name_ru: string | null;
    last_name_en: string | null;
    first_name_en: string | null;
    orcid: string | null;
    email: string | null;
    affiliation_ru: string | null;
    is_corresponding: boolean;
    author_order: number;
};

type Reference = {
    ref_order: number;
    raw_text: string;
    doi: string | null;
};

type ArticleRow = {
    id: string;
    title_ru: string;
    title_en: string | null;
    abstract_ru: string | null;
    abstract_en: string | null;
    doi: string | null;
    pages_from: number | null;
    pages_to: number | null;
    published_at: Date | string | null;
    issue_published_at: Date | string | null;
    issue_volume: number;
    issue_number: number;
    issue_year: number;
    section_name: string;
    vak_code: string | null;
    authors: Author[] | null;
    keywords: string[] | null;
    refs: Reference[] | null;
};

// === Запрос данных ===

async function fetchArticle(id: string): Promise<ArticleRow | null> {
    const [row] = await query<ArticleRow>(`
    SELECT
      a.id, a.title_ru, a.title_en, a.abstract_ru, a.abstract_en,
      a.doi, a.pages_from, a.pages_to, a.published_at,
      i.published_at AS issue_published_at,
      i.volume AS issue_volume, i.number AS issue_number, i.year AS issue_year,
      s.name_ru AS section_name, s.vak_code,
      (
        SELECT JSON_AGG(JSON_BUILD_OBJECT(
          'last_name_ru', au.last_name_ru,
          'first_name_ru', au.first_name_ru,
          'middle_name_ru', au.middle_name_ru,
          'last_name_en', au.last_name_en,
          'first_name_en', au.first_name_en,
          'orcid', au.orcid,
          'email', au.email,
          'affiliation_ru', af.name_ru,
          'is_corresponding', aa.is_corresponding,
          'author_order', aa.author_order
        ) ORDER BY aa.author_order)
        FROM article_authors aa
        JOIN authors au ON aa.author_id = au.id
        LEFT JOIN affiliations af ON aa.affiliation_id = af.id
        WHERE aa.article_id = a.id
      ) AS authors,
      (
        SELECT JSON_AGG(k.word_ru ORDER BY k.word_ru)
        FROM article_keywords ak
        JOIN keywords k ON ak.keyword_id = k.id
        WHERE ak.article_id = a.id
      ) AS keywords,
      (
        SELECT JSON_AGG(JSON_BUILD_OBJECT(
          'ref_order', r.ref_order,
          'raw_text', r.raw_text,
          'doi', r.doi
        ) ORDER BY r.ref_order)
        FROM article_references r
        WHERE r.article_id = a.id
      ) AS refs
    FROM articles a
    JOIN issues i ON a.issue_id = i.id
    JOIN sections s ON a.section_id = s.id
    WHERE a.id = $1 AND a.status = 'published'
  `, [id]);
    return row || null;
}

// === Генератор ===

export async function generateJatsXml(articleId: string): Promise<string | null> {
    const a = await fetchArticle(articleId);
    if (!a) return null;

    const authors = a.authors || [];
    const keywords = a.keywords || [];
    const refs = a.refs || [];

    // Уникальные аффилиации с id для xref
    const affMap = new Map<string, string>();
    authors.forEach(au => {
        if (au.affiliation_ru && !affMap.has(au.affiliation_ru)) {
            affMap.set(au.affiliation_ru, `aff${affMap.size + 1}`);
        }
    });

    // Дата публикации: сначала пробуем дату статьи, потом дату выпуска
    const pub = dateParts(a.published_at) || dateParts(a.issue_published_at);
    const pubDateXml = pub
        ? `      <pub-date publication-format="electronic" date-type="pub" iso-8601-date="${pub.year}-${pub.month}-${pub.day}">
        <day>${pub.day}</day>
        <month>${pub.month}</month>
        <year>${pub.year}</year>
      </pub-date>`
        : `      <pub-date publication-format="electronic" date-type="pub">
        <year>${a.issue_year}</year>
      </pub-date>`;

    // Авторы
    const authorsXml = authors.map(au => {
        const givenNames = [au.first_name_ru, au.middle_name_ru].filter(Boolean).join(' ');
        const affId = au.affiliation_ru ? affMap.get(au.affiliation_ru) : null;

        return lines([
            `        <contrib contrib-type="author"${au.is_corresponding ? ' corresp="yes"' : ''}>`,
            au.orcid && `          <contrib-id contrib-id-type="orcid">https://orcid.org/${escapeXml(au.orcid)}</contrib-id>`,
            `          <name xml:lang="ru">`,
            `            <surname>${escapeXml(au.last_name_ru)}</surname>`,
            `            <given-names>${escapeXml(givenNames)}</given-names>`,
            `          </name>`,
            au.last_name_en && au.first_name_en && lines([
                `          <name-alternatives>`,
                `            <name xml:lang="en">`,
                `              <surname>${escapeXml(au.last_name_en)}</surname>`,
                `              <given-names>${escapeXml(au.first_name_en)}</given-names>`,
                `            </name>`,
                `          </name-alternatives>`,
            ]),
            affId && `          <xref ref-type="aff" rid="${affId}"/>`,
            au.email && `          <email>${escapeXml(au.email)}</email>`,
            `        </contrib>`,
        ]);
    }).join('\n');

    // Аффилиации
    const affXml = Array.from(affMap.entries()).map(([name, id]) =>
        `      <aff id="${id}"><institution>${escapeXml(name)}</institution></aff>`
    ).join('\n');

    // Заголовки
    const titleGroupXml = lines([
        `      <title-group>`,
        `        <article-title xml:lang="ru">${escapeXml(a.title_ru)}</article-title>`,
        a.title_en && lines([
            `        <trans-title-group xml:lang="en">`,
            `          <trans-title>${escapeXml(a.title_en)}</trans-title>`,
            `        </trans-title-group>`,
        ]),
        `      </title-group>`,
    ]);

    // Аннотации
    const abstractRuXml = a.abstract_ru
        ? `      <abstract xml:lang="ru"><p>${escapeXml(a.abstract_ru)}</p></abstract>`
        : '';

    const abstractEnXml = a.abstract_en
        ? `      <trans-abstract xml:lang="en"><p>${escapeXml(a.abstract_en)}</p></trans-abstract>`
        : '';

    // Ключевые слова
    const keywordsXml = keywords.length > 0
        ? lines([
            `      <kwd-group xml:lang="ru">`,
            ...keywords.map(k => `        <kwd>${escapeXml(k)}</kwd>`),
            `      </kwd-group>`,
        ])
        : '';

    // Категории
    const categoriesXml = lines([
        `      <article-categories>`,
        `        <subj-group subj-group-type="heading">`,
        `          <subject>${escapeXml(a.section_name)}</subject>`,
        `        </subj-group>`,
        a.vak_code && lines([
            `        <subj-group subj-group-type="vak-code">`,
            `          <subject>${escapeXml(a.vak_code)}</subject>`,
            `        </subj-group>`,
        ]),
        `      </article-categories>`,
    ]);

    // Страницы
    const pagesXml = a.pages_from && a.pages_to
        ? `      <fpage>${a.pages_from}</fpage>\n      <lpage>${a.pages_to}</lpage>`
        : '';

    // DOI
    const doiXml = a.doi
        ? `      <article-id pub-id-type="doi">${escapeXml(a.doi)}</article-id>`
        : '';

    // Список литературы
    const refsXml = refs.length > 0
        ? lines([
            `  <back>`,
            `    <ref-list>`,
            ...refs.map(r => {
                const doiPart = r.doi ? `<pub-id pub-id-type="doi">${escapeXml(r.doi)}</pub-id>` : '';
                return `      <ref id="ref${r.ref_order}"><mixed-citation>${escapeXml(r.raw_text)}${doiPart}</mixed-citation></ref>`;
            }),
            `    </ref-list>`,
            `  </back>`,
        ])
        : '';

    // Собираем
    return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE article PUBLIC "-//NLM//DTD JATS (Z39.96) Journal Archiving and Interchange DTD v1.2 20190208//EN" "JATS-archivearticle1.dtd">
<article xmlns:xlink="http://www.w3.org/1999/xlink" article-type="research-article" xml:lang="ru" dtd-version="1.2">
  <front>
    <journal-meta>
      <journal-id journal-id-type="publisher-id">${escapeXml(JOURNAL.publisher_id)}</journal-id>
      <journal-title-group>
        <journal-title xml:lang="ru">${escapeXml(JOURNAL.title_ru)}</journal-title>
        <trans-title-group xml:lang="en">
          <trans-title>${escapeXml(JOURNAL.title_en)}</trans-title>
        </trans-title-group>
        <abbrev-journal-title>${escapeXml(JOURNAL.abbrev)}</abbrev-journal-title>
      </journal-title-group>
      <issn publication-format="print">${escapeXml(JOURNAL.issn)}</issn>
      <publisher>
        <publisher-name>${escapeXml(JOURNAL.publisher_name)}</publisher-name>
        <publisher-loc>${escapeXml(JOURNAL.publisher_loc)}</publisher-loc>
      </publisher>
    </journal-meta>
    <article-meta>
${doiXml}
${categoriesXml}
${titleGroupXml}
      <contrib-group>
${authorsXml}
      </contrib-group>
${affXml}
${pubDateXml}
      <volume>${a.issue_volume}</volume>
      <issue>${a.issue_number}</issue>
${pagesXml}
${abstractRuXml}
${abstractEnXml}
${keywordsXml}
    </article-meta>
  </front>
${refsXml}
</article>
`;
}

// Имя файла для скачивания
export function jatsFilename(doi: string | null, articleId: string): string {
    const safe = (doi || articleId)
        .replace(/[\/\\?%*:|"<>]/g, '_')
        .replace(/\s+/g, '_');
    return `${safe}.xml`;
}