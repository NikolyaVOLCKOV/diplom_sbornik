import Header from '@/components/Header'
import Footer from '@/components/Footer'

export default function RulesPage() {
    return (
        <main style={{ background: 'var(--paper)', minHeight: '100vh' }}>
            <Header />

            <div style={{ background: '#141414', color: '#fff', padding: '48px 0' }}>
                <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 32px' }}>
                    <div style={{ fontSize: 11, letterSpacing: '2.5px', textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)', marginBottom: 12 }}>Авторам</div>
                    <h1 style={{ fontFamily: 'Playfair Display, serif', fontSize: 'clamp(24px, 3vw, 36px)', fontWeight: 700 }}>Правила для авторов</h1>
                </div>
            </div>

            <div style={{ maxWidth: 1200, margin: '0 auto', padding: '48px 32px', display: 'grid', gridTemplateColumns: '1fr 300px', gap: 48 }}>

                <article style={{ fontFamily: 'Lora, serif', fontSize: 15.5, lineHeight: 1.85, color: 'var(--ink2)' }}>

                    {/* Скачать PDF */}
                    <div style={{ background: 'var(--paper2)', border: '1px solid var(--border)', borderRadius: 6, padding: 20, marginBottom: 36, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
                        <div>
                            <div style={{ fontFamily: 'IBM Plex Sans, sans-serif', fontWeight: 600, fontSize: 14, color: 'var(--ink)', marginBottom: 4 }}>
                                Требования к оформлению статей
                            </div>
                            <div style={{ fontSize: 12, color: 'var(--ink3)' }}>Официальный документ в формате PDF</div>
                        </div>
                        <a href="/docs/trebovaniya-dlya-avtorov.pdf"
                           target="_blank"
                           style={{ flexShrink: 0, background: 'var(--burgundy)', color: '#fff', padding: '10px 20px', borderRadius: 4, fontSize: 13, fontWeight: 500, fontFamily: 'IBM Plex Sans, sans-serif', whiteSpace: 'nowrap' }}>
                            ↓ Скачать PDF
                        </a>
                    </div>

                    {/* Раздел 1 — Порядок направления */}
                    <h2 style={{ fontFamily: 'Playfair Display, serif', fontSize: 20, fontWeight: 700, color: 'var(--ink)', marginBottom: 16, paddingBottom: 8, borderBottom: '2px solid var(--burgundy)' }}>
                        Порядок направления, рецензирования и опубликования статей
                    </h2>

                    {[
                        'Редакция принимает материалы, соответствующие тематике журнала, отвечающие требованиям самостоятельного научного исследования (актуальность, научная новизна, достоверность сведений). Предоставляемые материалы не должны быть опубликованы ранее в других изданиях.',
                        <>Статьи для рассмотрения возможности их публикации в журнале присылаются на адрес электронной почты: <a href="mailto:gicr-lspu@yandex.ru" style={{ color: 'var(--burgundy)' }}>gicr-lspu@yandex.ru</a>. Редакция обязательно подтверждает получение рукописи в течение трёх дней. Присылаемый материал регистрируется в редакции с указанием даты поступления, Ф.И.О. автора или авторов, места работы, контактов, названия материала.</>,
                        'К рассмотрению принимаются тексты объёмом от 0,5 авторского листа (20 000 знаков с пробелами), оформленные в соответствии с предъявляемыми редакцией требованиями.',
                    ].map((text, i) => (
                        <div key={i} style={{ display: 'flex', gap: 16, marginBottom: 16 }}>
                            <span style={{ flexShrink: 0, width: 24, height: 24, borderRadius: '50%', background: 'var(--burgundy)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontFamily: 'IBM Plex Sans, sans-serif', fontWeight: 600, marginTop: 2 }}>{i + 1}</span>
                            <p style={{ margin: 0 }}>{text}</p>
                        </div>
                    ))}

                    {/* Файлы */}
                    <div style={{ display: 'flex', gap: 16, marginBottom: 16 }}>
                        <span style={{ flexShrink: 0, width: 24, height: 24, borderRadius: '50%', background: 'var(--burgundy)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontFamily: 'IBM Plex Sans, sans-serif', fontWeight: 600, marginTop: 2 }}>4</span>
                        <div>
                            <p style={{ margin: '0 0 10px' }}>Автор/авторы направляют в редакцию следующие файлы:</p>
                            {[
                                <><strong>Файл со статьёй.</strong> Название: <code style={{ background: 'var(--paper2)', padding: '1px 6px', borderRadius: 3, fontSize: 13 }}>Иванов_статья</code></>,
                                <><strong>Информация об авторе/авторах</strong> (на русском и английском языках). Включает: ФИО, место работы, должность, учёная степень, учёное звание, сфера научных интересов, контакты (телефон, адрес, e-mail, название статьи).</>,
                                <>Аспиранты и соискатели направляют <strong>отсканированный отзыв научного руководителя</strong> с заверенной подписью. Название: <code style={{ background: 'var(--paper2)', padding: '1px 6px', borderRadius: 3, fontSize: 13 }}>Иванов_отзыв</code>. В отзыве обязательно наличие фразы о том, что статья рекомендована к публикации.</>,
                            ].map((item, i) => (
                                <div key={i} style={{ display: 'flex', gap: 10, marginBottom: 8 }}>
                                    <span style={{ color: 'var(--burgundy)', flexShrink: 0 }}>›</span>
                                    <span>{item}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Важное замечание */}
                    <div style={{ background: '#fff8e8', border: '1px solid #e8d8a0', borderLeft: '4px solid var(--gold)', borderRadius: '0 4px 4px 0', padding: '14px 18px', marginBottom: 20, fontFamily: 'IBM Plex Sans, sans-serif', fontSize: 14 }}>
                        <strong>Все поступившие в редакцию научные статьи проходят обязательное двойное слепое рецензирование.</strong>
                    </div>

                    {[
                        'Рецензирование статей осуществляется членами редакционной коллегии, а также приглашёнными рецензентами — ведущими специалистами в соответствующей отрасли науки из России и других стран. Срок рецензирования составляет 3–4 недели, но по просьбе рецензента он может быть продлён.',
                        'Каждый рецензент имеет право отказаться от рецензии в случае наличия конфликта интересов. По итогам рассмотрения рецензент даёт рекомендации: принять, доработать или отклонить с обоснованием.',
                        'В случае отказа авторов от доработки материалов им следует уведомить редакцию об отзыве статьи. Редакция снимет рукопись с рассмотрения, если авторы не предоставят доработанный вариант в течение 3 месяцев.',
                        'Редакция проводит не более двух раундов рецензирования для каждой рукописи.',
                        'Решение об отказе в публикации принимается на заседании редакционной коллегии в соответствии с рекомендациями рецензентов. Статья, не рекомендованная к публикации, к повторному рассмотрению не принимается.',
                        'После принятия редколлегией решения о допуске статьи к публикации редакция информирует об этом автора и указывает сроки публикации.',
                        'Наличие положительной рецензии не является достаточным основанием для публикации. Окончательное решение принимается редакционной коллегией.',
                        'Оригиналы рецензий хранятся в редакции не менее 5 лет. Копии рецензий могут быть переданы в Министерство науки и высшего образования РФ по запросу.',
                    ].map((text, i) => (
                        <div key={i} style={{ display: 'flex', gap: 16, marginBottom: 16 }}>
                            <span style={{ flexShrink: 0, width: 24, height: 24, borderRadius: '50%', background: 'var(--paper2)', border: '1px solid var(--border)', color: 'var(--ink3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontFamily: 'IBM Plex Sans, sans-serif', fontWeight: 600, marginTop: 2 }}>{i + 5}</span>
                            <p style={{ margin: 0 }}>{text}</p>
                        </div>
                    ))}

                    {/* Раздел 2 — Требования к оформлению */}
                    <h2 style={{ fontFamily: 'Playfair Display, serif', fontSize: 20, fontWeight: 700, color: 'var(--ink)', margin: '40px 0 16px', paddingBottom: 8, borderBottom: '2px solid var(--burgundy)' }}>
                        Требования к оформлению статей
                    </h2>

                    {[
                        <><strong>Статья</strong> должна быть оформлена строго в соответствии с изложенными ниже требованиями и тщательно вычитана автором. <strong>Материалы, не соответствующие требованиям, редакционной коллегией не рассматриваются.</strong></>,
                        <><strong>Технические параметры:</strong> текст набирается в программе Word: размер шрифта — 14, гарнитура — Times New Roman, межстрочный интервал — 1,5, поля — 2 см со всех сторон. Объём статьи — от 0,5 а.л. (20 000 знаков с пробелами). Абзацный отступ — 1 см.</>,
                        <><strong>УДК</strong> — выравнивание по левому краю.</>,
                        <><strong>Заглавие статьи</strong> — на русском и английском языках, выравнивание по центру, заглавные буквы, полужирный шрифт. Названия должны быть информативными, краткими и отражать суть тематического содержания.</>,
                        <><strong>Инициалы и фамилия автора</strong> — на русском и английском языках, выравнивание по центру, строчные буквы, полужирный шрифт.</>,
                        <><strong>Аннотация</strong> — на русском и английском языках, курсив, объём — до 20 строк. Раскрывается содержание статьи: актуальность, предмет, объект, методы, научная новизна.</>,
                        <><strong>Ключевые слова</strong> — на русском и английском языках, 5–7 слов и словосочетаний.</>,
                        <><strong>Список литературы</strong> оформляется в алфавитном порядке. Каждый пункт включает: фамилию и инициалы автора/авторов, заглавие работы, место издания, издательство, год, количество страниц. <strong>Список литературы обязательно приводится также в транслитерации.</strong></>,
                        <><strong>Ссылка</strong> в тексте включает номер в квадратных скобках и страницу. Пример: [5, с. 321], [1, с. 12; 8, с. 12–14].</>,
                        <><strong>Таблицы</strong> нумеруются и сопровождаются заголовками. В тексте даётся ссылка: (см. табл. 5).</>,
                        <><strong>Иллюстрации</strong> представляются отдельным файлом с подписями. В тексте — ссылка: (см. рис. 2).</>,
                        <><strong>Формулы</strong> набираются в редакторе формул Word. Нумерация сквозная арабскими цифрами, номер в круглых скобках у правого края.</>,
                    ].map((text, i) => (
                        <div key={i} style={{ display: 'flex', gap: 16, marginBottom: 14 }}>
                            <span style={{ flexShrink: 0, width: 24, height: 24, borderRadius: '50%', background: 'var(--paper2)', border: '1px solid var(--border)', color: 'var(--ink3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontFamily: 'IBM Plex Sans, sans-serif', fontWeight: 600, marginTop: 2 }}>{i + 1}</span>
                            <p style={{ margin: 0 }}>{text}</p>
                        </div>
                    ))}

                </article>

                {/* Сайдбар */}
                <aside style={{ display: 'flex', flexDirection: 'column', gap: 20, position: 'sticky', top: 80, alignSelf: 'start' }}>

                    {/* Контакты */}
                    <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 4, padding: 20 }}>
                        <h3 style={{ fontFamily: 'Playfair Display, serif', fontSize: 14, fontWeight: 700, marginBottom: 14, paddingBottom: 10, borderBottom: '1px solid var(--border)' }}>
                            Связь с редакцией
                        </h3>
                        <div style={{ fontSize: 12, color: 'var(--ink3)', marginBottom: 4 }}>Ответственный секретарь:</div>
                        <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--ink)', marginBottom: 8 }}>
                            Гречушкина Наталия Валерьевна
                        </div>
                        <a href="tel:+79046976488" style={{ display: 'block', fontSize: 13, color: 'var(--burgundy)', marginBottom: 6 }}>
                            8-904-697-64-88
                        </a>
                        <a href="mailto:gicr-lspu@yandex.ru" style={{ display: 'block', fontSize: 13, color: 'var(--burgundy)', wordBreak: 'break-all' }}>
                            gicr-lspu@yandex.ru
                        </a>
                    </div>

                    {/* PDF */}
                    <div style={{ background: 'var(--paper2)', border: '1px solid var(--border)', borderRadius: 4, padding: 20 }}>
                        <h3 style={{ fontFamily: 'Playfair Display, serif', fontSize: 14, fontWeight: 700, marginBottom: 10 }}>
                            Документы
                        </h3>
                        <a href="/docs/trebovaniya-dlya-avtorov.pdf"
                           target="_blank"
                           style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', background: '#fff', border: '1px solid var(--border)', borderRadius: 4, fontSize: 13, color: 'var(--ink2)' }}>
                            <span style={{ color: 'var(--burgundy)', fontSize: 18 }}>↓</span>
                            <div>
                                <div style={{ fontWeight: 500, color: 'var(--ink)', marginBottom: 2 }}>Требования к оформлению</div>
                                <div style={{ fontSize: 11, color: 'var(--ink3)' }}>PDF, актуальная версия</div>
                            </div>
                        </a>
                    </div>

                    {/* Быстрые ссылки */}
                    <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 4, padding: 20 }}>
                        <h3 style={{ fontFamily: 'Playfair Display, serif', fontSize: 14, fontWeight: 700, marginBottom: 14, paddingBottom: 10, borderBottom: '1px solid var(--border)' }}>
                            Полезные ссылки
                        </h3>
                        {[
                            { label: 'Этика публикаций', href: '/ethics' },
                            { label: 'Редакционная политика', href: '/editorial-policy' },
                            { label: 'О журнале', href: '/about' },
                        ].map(({ label, href }) => (
                            <a key={label} href={href} style={{ display: 'block', fontSize: 13, color: 'var(--burgundy)', padding: '6px 0', borderBottom: '1px solid var(--border)' }}>
                                › {label}
                            </a>
                        ))}
                    </div>

                </aside>
            </div>

            <Footer />
        </main>
    )
}