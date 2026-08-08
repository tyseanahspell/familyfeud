export interface Answer {
  id: string;
  text: string;
  points: number;
  revealed: boolean;
}

export interface Question {
  id: string;
  prompt: string;
  answers: Answer[];
}

export interface FastMoneyQuestion {
  id: string;
  prompt: string;
  answers: Answer[];
}

export interface SurveyBoard {
  id: string;
  title: string;
  questions: Question[];
  fastMoneyQuestions: FastMoneyQuestion[];
  createdAt: string;
  updatedAt: string;
}

export type TeamId = 'teamA' | 'teamB';

export type RoundPhase =
  | 'faceoff'
  | 'control'
  | 'steal'
  | 'reveal_remaining'
  | 'round_over';

export type GameMode = 'main' | 'fast_money';

export interface Team {
  id: TeamId;
  name: string;
  score: number;
}

export interface RoundState {
  questionIndex: number;
  phase: RoundPhase;
  controllingTeam: TeamId | null;
  faceoffWinner: TeamId | null;
  strikes: number;
  roundPoints: number;
  stealAttempted: boolean;
  stealSuccessful: boolean | null;
}

export interface FastMoneyAnswer {
  text: string;
  points: number;
  matched: boolean;
  revealed: boolean;
}

export interface FastMoneyPlayer {
  answers: FastMoneyAnswer[];
  totalPoints: number;
  timeRemaining: number;
}

export interface FastMoneyState {
  questionPrompts: string[];
  answerKey: Array<Array<{ text: string; points: number }>>;
  player1: FastMoneyPlayer;
  player2: FastMoneyPlayer;
  currentPlayer: 1 | 2;
  currentQuestionIndex: number;
  isRunning: boolean;
  isComplete: boolean;
  showingAnswers: boolean;
  targetScore: number;
}

export interface GameState {
  board: SurveyBoard | null;
  teams: [Team, Team];
  mode: GameMode;
  round: RoundState;
  fastMoney: FastMoneyState | null;
  soundEnabled: boolean;
  hostPanelOpen: boolean;
}

export const MAX_STRIKES = 3;
export const FAST_MONEY_TARGET = 200;
export const FAST_MONEY_TIME_P1 = 20;
export const FAST_MONEY_TIME_P2 = 25;
export const MAX_ANSWERS = 8;
export const MAX_FAST_MONEY_QUESTIONS = 5;

export function createEmptyAnswer(index: number): Answer {
  return {
    id: crypto.randomUUID(),
    text: '',
    points: Math.max(1, 30 - index * 4),
    revealed: false,
  };
}

export function createEmptyQuestion(): Question {
  return {
    id: crypto.randomUUID(),
    prompt: '',
    answers: Array.from({ length: 6 }, (_, i) => createEmptyAnswer(i)),
  };
}

export function createEmptyFastMoneyQuestion(): FastMoneyQuestion {
  return {
    id: crypto.randomUUID(),
    prompt: '',
    answers: Array.from({ length: 5 }, (_, i) => createEmptyAnswer(i)),
  };
}

export function createEmptyBoard(title = 'New Survey'): SurveyBoard {
  const now = new Date().toISOString();
  return {
    id: crypto.randomUUID(),
    title,
    questions: [createEmptyQuestion()],
    fastMoneyQuestions: Array.from(
      { length: MAX_FAST_MONEY_QUESTIONS },
      createEmptyFastMoneyQuestion,
    ),
    createdAt: now,
    updatedAt: now,
  };
}

export function createInitialRound(questionIndex = 0): RoundState {
  return {
    questionIndex,
    phase: 'faceoff',
    controllingTeam: null,
    faceoffWinner: null,
    strikes: 0,
    roundPoints: 0,
    stealAttempted: false,
    stealSuccessful: null,
  };
}

export function createInitialFastMoney(questions: FastMoneyQuestion[]): FastMoneyState {
  const prompts = questions.map((question) => question.prompt);
  const emptyAnswers = () =>
    prompts.map(() => ({
      text: '',
      points: 0,
      matched: false,
      revealed: false,
    }));

  return {
    questionPrompts: prompts,
    answerKey: questions.map((question) =>
      question.answers
        .filter((answer) => answer.text.trim())
        .map((answer) => ({ text: answer.text.trim(), points: answer.points })),
    ),
    player1: {
      answers: emptyAnswers(),
      totalPoints: 0,
      timeRemaining: FAST_MONEY_TIME_P1,
    },
    player2: {
      answers: emptyAnswers(),
      totalPoints: 0,
      timeRemaining: FAST_MONEY_TIME_P2,
    },
    currentPlayer: 1,
    currentQuestionIndex: 0,
    isRunning: false,
    isComplete: false,
    showingAnswers: false,
    targetScore: FAST_MONEY_TARGET,
  };
}

export function createInitialGameState(): GameState {
  return {
    board: null,
    teams: [
      { id: 'teamA', name: 'Family A', score: 0 },
      { id: 'teamB', name: 'Family B', score: 0 },
    ],
    mode: 'main',
    round: createInitialRound(),
    fastMoney: null,
    soundEnabled: true,
    hostPanelOpen: true,
  };
}

export function otherTeam(team: TeamId): TeamId {
  return team === 'teamA' ? 'teamB' : 'teamA';
}

export function totalSurveyPoints(question: Question): number {
  return question.answers.reduce((sum, a) => sum + (a.points || 0), 0);
}
