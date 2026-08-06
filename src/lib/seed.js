/* Przykładowe treści, żeby aplikacja nie była pusta na start.
   Możesz je edytować lub usunąć w interfejsie. */

export const seedMaterials = [
  {
    id: 'm-seed-1',
    title: 'Wprowadzenie do SEO — checklista on-page',
    category: 'Podstawy',
    kind: 'link',
    url: 'https://developers.google.com/search/docs/fundamentals/seo-starter-guide',
    description: 'Oficjalny przewodnik Google dla początkujących. Dobra baza przed pierwszym audytem.',
    fileId: null,
    fileName: null,
    createdAt: '2026-08-01T09:00:00.000Z',
  },
  {
    id: 'm-seed-2',
    title: 'Procedura audytu technicznego (wewnętrzna)',
    category: 'Procedury',
    kind: 'note',
    url: '',
    description: '1. Crawl serwisu (Screaming Frog).\n2. Sprawdzenie indeksacji w GSC.\n3. Core Web Vitals.\n4. Struktura nagłówków i linkowanie wewnętrzne.\n5. Raport + rekomendacje.',
    fileId: null,
    fileName: null,
    createdAt: '2026-08-02T09:00:00.000Z',
  },
]

export const seedQuizzes = [
  {
    id: 'q-seed-1',
    title: 'Podstawy SEO — sprawdź się',
    description: 'Krótki quiz z podstawowych pojęć.',
    createdAt: '2026-08-01T10:00:00.000Z',
    questions: [
      {
        id: 'qq-1',
        text: 'Co oznacza skrót SERP?',
        options: [
          'Search Engine Results Page',
          'Search Engine Ranking Protocol',
          'Site Extended Rich Preview',
        ],
        correct: 0,
      },
      {
        id: 'qq-2',
        text: 'Który tag definiuje główny tytuł strony w wynikach wyszukiwania?',
        options: ['<h1>', '<title>', '<meta description>'],
        correct: 1,
      },
      {
        id: 'qq-3',
        text: 'Co to jest canonical?',
        options: [
          'Znacznik wskazujący preferowaną wersję adresu URL',
          'Plik z listą wszystkich podstron',
          'Rodzaj przekierowania 301',
        ],
        correct: 0,
      },
    ],
  },
]

export const seedTips = [
  {
    id: 't-seed-1',
    type: 'porada',
    text: 'Przy optymalizacji title trzymaj się ~55–60 znaków — dłuższe tytuły Google i tak ucina w wynikach.',
    createdAt: '2026-08-03T08:00:00.000Z',
  },
  {
    id: 't-seed-2',
    type: 'ciekawostka',
    text: 'Google przetwarza ponad 8,5 miliarda zapytań dziennie. Każda sekunda ładowania strony realnie wpływa na konwersję.',
    createdAt: '2026-08-04T08:00:00.000Z',
  },
]

export const seedNews = [
  {
    id: 'n-seed-1',
    title: 'Przykładowy news: aktualizacja algorytmu',
    source: 'Wewnętrzny research',
    url: '',
    body: 'To przykładowy wpis. Dodawaj tu nowinki ze świata SEO — Google update’y, zmiany w narzędziach, testy zespołu.',
    date: '2026-08-05',
    createdAt: '2026-08-05T08:00:00.000Z',
  },
]
