import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('VITE_SUPABASE_URL / VITE_SUPABASE_PUBLISHABLE_KEY가 설정되지 않았습니다.');
}

export const supabase = createClient(supabaseUrl, supabaseKey);

export interface ScoreRow {
  id: string;
  nickname: string;
  score: number;
  survived_seconds: number;
  created_at: string;
}

const RANKING_LIMIT = 20;

export async function submitScore(nickname: string, score: number, survivedSeconds: number) {
  const { error } = await supabase
    .from('scores')
    .insert({ nickname, score, survived_seconds: survivedSeconds });
  if (error) throw error;
}

export async function fetchTopScores(): Promise<ScoreRow[]> {
  const { data, error } = await supabase
    .from('scores')
    .select('*')
    .order('score', { ascending: false })
    .limit(RANKING_LIMIT);
  if (error) throw error;
  return data;
}
