export const ERROR_TYPES = [
  { key: 'articles', label: 'Артикли', color: 'bg-rose-100 text-rose-700 border-rose-300', headerColor: 'bg-rose-50 text-rose-800', dotColor: 'bg-rose-500' },
  { key: 'grammar', label: 'Грамматика', color: 'bg-amber-100 text-amber-700 border-amber-300', headerColor: 'bg-amber-50 text-amber-800', dotColor: 'bg-amber-500' },
  { key: 'vocabulary', label: 'Лексика', color: 'bg-sky-100 text-sky-700 border-sky-300', headerColor: 'bg-sky-50 text-sky-800', dotColor: 'bg-sky-500' },
  { key: 'punctuation', label: 'Пунктуация', color: 'bg-emerald-100 text-emerald-700 border-emerald-300', headerColor: 'bg-emerald-50 text-emerald-800', dotColor: 'bg-emerald-500' },
  { key: 'spelling', label: 'Орфография', color: 'bg-orange-100 text-orange-700 border-orange-300', headerColor: 'bg-orange-50 text-orange-800', dotColor: 'bg-orange-500' },
  { key: 'prepositions', label: 'Предлоги', color: 'bg-teal-100 text-teal-700 border-teal-300', headerColor: 'bg-teal-50 text-teal-800', dotColor: 'bg-teal-500' },
  { key: 'tenses', label: 'Времена', color: 'bg-pink-100 text-pink-700 border-pink-300', headerColor: 'bg-pink-50 text-pink-800', dotColor: 'bg-pink-500' },
] as const;

export type ErrorTypeKey = typeof ERROR_TYPES[number]['key'];

export interface EssayError {
  type: ErrorTypeKey;
  examples: string[];
}

export interface Essay {
  id: string;
  topic: string;
  text: string;
  correctedText?: string;
  date: string;
  errors: EssayError[];
}

export type UserRole = 'admin' | 'user';

export interface UserProfile {
  username: string;
  role: UserRole;
}
