import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

// 랭킹 설정이 비어있어도 게임 자체(시작/플레이/게임오버)는 죽지 않아야 하므로,
// 여기서 throw하지 않고 각 API 호출 시점에만 실패하도록 한다.
const supabase: SupabaseClient | null =
  supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

export interface ScoreRow {
  id: string;
  nickname: string;
  score: number;
  survived_seconds: number;
  created_at: string;
}

const RANKING_LIMIT = 20;

function requireClient(): SupabaseClient {
  if (!supabase) {
    throw new Error('VITE_SUPABASE_URL / VITE_SUPABASE_PUBLISHABLE_KEY가 설정되지 않았습니다.');
  }
  return supabase;
}

export async function submitScore(nickname: string, score: number, survivedSeconds: number) {
  const { error } = await requireClient()
    .from('scores')
    .insert({ nickname, score, survived_seconds: survivedSeconds });
  if (error) throw error;
}

export async function fetchTopScores(): Promise<ScoreRow[]> {
  const { data, error } = await requireClient()
    .from('scores')
    .select('*')
    .order('score', { ascending: false })
    .limit(RANKING_LIMIT);
  if (error) throw error;
  return data;
}

// 주어진 점수보다 높은 기록 수 + 1 = 해당 점수의 순위.
// 동점자는 같은(가장 높은) 순위로 계산된다.
export async function fetchScoreRank(score: number): Promise<number> {
  const { count, error } = await requireClient()
    .from('scores')
    .select('*', { count: 'exact', head: true })
    .gt('score', score);
  if (error) throw error;
  return (count ?? 0) + 1;
}
