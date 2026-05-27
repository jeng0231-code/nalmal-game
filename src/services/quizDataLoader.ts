import type { QuizQuestion } from '../types';
import type { QuizCategory } from '../types/hakdang';

type LiteracyModule = typeof import('../data/quizData');
type ProverbsModule = typeof import('../data/proverbsData');
type IdiomsModule = typeof import('../data/idiomsData');
type HistoryModule = typeof import('../data/historyData');
type EtiquetteModule = typeof import('../data/etiquetteData');

const categoryLoaders: Record<QuizCategory, () => Promise<QuizQuestion[]>> = {
  literacy: async () => {
    const mod = await import('../data/quizData') as LiteracyModule;
    return mod.INITIAL_QUIZ_DATA.map((question) => ({ ...question, category: 'literacy' as const }));
  },
  proverbs: async () => {
    const mod = await import('../data/proverbsData') as ProverbsModule;
    return mod.PROVERBS_QUESTIONS;
  },
  idioms: async () => {
    const mod = await import('../data/idiomsData') as IdiomsModule;
    return mod.IDIOMS_QUESTIONS;
  },
  history: async () => {
    const mod = await import('../data/historyData') as HistoryModule;
    return mod.HISTORY_QUESTIONS;
  },
  etiquette: async () => {
    const mod = await import('../data/etiquetteData') as EtiquetteModule;
    return mod.ETIQUETTE_QUESTIONS;
  },
};

const categoryCache = new Map<QuizCategory, QuizQuestion[]>();

export async function loadCategoryQuestions(category: QuizCategory): Promise<QuizQuestion[]> {
  const cached = categoryCache.get(category);
  if (cached) {
    return cached;
  }

  const questions = await categoryLoaders[category]();
  categoryCache.set(category, questions);
  return questions;
}

export async function loadAllCategoryQuestions(): Promise<QuizQuestion[]> {
  const categories = Object.keys(categoryLoaders) as QuizCategory[];
  const questionSets = await Promise.all(categories.map((category) => loadCategoryQuestions(category)));
  return questionSets.flat();
}
