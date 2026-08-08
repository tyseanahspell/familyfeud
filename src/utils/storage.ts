import type { SurveyBoard } from '../types/game';

const BOARDS_KEY = 'familyfeud_boards';
const ACTIVE_KEY = 'familyfeud_active_board';
const TEAMS_KEY = 'familyfeud_teams';

export function loadBoards(): SurveyBoard[] {
  try {
    const raw = localStorage.getItem(BOARDS_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as SurveyBoard[];
  } catch {
    return [];
  }
}

export function saveBoards(boards: SurveyBoard[]): void {
  localStorage.setItem(BOARDS_KEY, JSON.stringify(boards));
}

export function upsertBoard(board: SurveyBoard): SurveyBoard[] {
  const boards = loadBoards();
  const idx = boards.findIndex((b) => b.id === board.id);
  const next = { ...board, updatedAt: new Date().toISOString() };
  if (idx >= 0) boards[idx] = next;
  else boards.unshift(next);
  saveBoards(boards);
  return boards;
}

export function deleteBoard(id: string): SurveyBoard[] {
  const boards = loadBoards().filter((b) => b.id !== id);
  saveBoards(boards);
  if (localStorage.getItem(ACTIVE_KEY) === id) {
    localStorage.removeItem(ACTIVE_KEY);
  }
  return boards;
}

export function setActiveBoardId(id: string): void {
  localStorage.setItem(ACTIVE_KEY, id);
}

export function getActiveBoard(): SurveyBoard | null {
  const id = localStorage.getItem(ACTIVE_KEY);
  if (!id) return null;
  return loadBoards().find((b) => b.id === id) ?? null;
}

export function saveTeamNames(teamA: string, teamB: string): void {
  localStorage.setItem(TEAMS_KEY, JSON.stringify({ teamA, teamB }));
}

export function loadTeamNames(): { teamA: string; teamB: string } {
  try {
    const raw = localStorage.getItem(TEAMS_KEY);
    if (!raw) return { teamA: 'Family A', teamB: 'Family B' };
    return JSON.parse(raw) as { teamA: string; teamB: string };
  } catch {
    return { teamA: 'Family A', teamB: 'Family B' };
  }
}

export function exportBoardJson(board: SurveyBoard): string {
  return JSON.stringify(board, null, 2);
}

export function importBoardJson(json: string): SurveyBoard {
  const parsed = JSON.parse(json) as SurveyBoard;
  if (!parsed.title || !Array.isArray(parsed.questions)) {
    throw new Error('Invalid board format');
  }
  return {
    ...parsed,
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    questions: parsed.questions.map((q) => ({
      ...q,
      id: q.id || crypto.randomUUID(),
      answers: q.answers.map((a) => ({
        ...a,
        id: a.id || crypto.randomUUID(),
        revealed: false,
      })),
    })),
  };
}
