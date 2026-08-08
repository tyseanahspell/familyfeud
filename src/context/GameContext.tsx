import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useReducer,
  type ReactNode,
} from 'react';
import {
  createInitialFastMoney,
  createInitialGameState,
  createInitialRound,
  otherTeam,
  type Answer,
  type GameState,
  type Question,
  type SurveyBoard,
  type TeamId,
  MAX_STRIKES,
} from '../types/game';
import { playSound, unlockAudio } from '../utils/sounds';
import { getActiveBoard, loadTeamNames } from '../utils/storage';

type Action =
  | { type: 'LOAD_BOARD'; board: SurveyBoard }
  | { type: 'SET_TEAM_NAMES'; teamA: string; teamB: string }
  | { type: 'RESET_SCORES' }
  | { type: 'SET_QUESTION'; index: number }
  | { type: 'REVEAL_ANSWER'; answerId: string }
  | { type: 'HIDE_ANSWER'; answerId: string }
  | { type: 'SET_FACEOFF_WINNER'; team: TeamId }
  | { type: 'ADD_STRIKE' }
  | { type: 'CLEAR_STRIKES' }
  | { type: 'AWARD_ROUND'; team: TeamId }
  | { type: 'START_STEAL' }
  | { type: 'RESOLVE_STEAL'; success: boolean; answerId?: string }
  | { type: 'REVEAL_ALL_REMAINING' }
  | { type: 'ADJUST_SCORE'; team: TeamId; delta: number }
  | { type: 'SET_SCORE'; team: TeamId; score: number }
  | { type: 'TOGGLE_SOUND' }
  | { type: 'TOGGLE_HOST_PANEL' }
  | { type: 'SET_MODE'; mode: 'main' | 'fast_money' }
  | { type: 'INIT_FAST_MONEY'; prompts: string[] }
  | { type: 'FM_SET_RUNNING'; running: boolean }
  | { type: 'FM_TICK' }
  | { type: 'FM_SET_ANSWER'; player: 1 | 2; index: number; text: string }
  | { type: 'FM_SET_POINTS'; player: 1 | 2; index: number; points: number; matched: boolean }
  | { type: 'FM_REVEAL_ANSWER'; player: 1 | 2; index: number }
  | { type: 'FM_NEXT_QUESTION' }
  | { type: 'FM_SWITCH_PLAYER' }
  | { type: 'FM_SET_SHOWING'; showing: boolean }
  | { type: 'FM_COMPLETE' }
  | { type: 'FM_AWARD_TO_TEAM'; team: TeamId }
  | { type: 'RESET_ROUND_REVEALS' };

function withSound(state: GameState, name: Parameters<typeof playSound>[0]): void {
  playSound(name, state.soundEnabled);
}

function resetReveals(question: Question): Question {
  return {
    ...question,
    answers: question.answers.map((a) => ({ ...a, revealed: false })),
  };
}

function updateCurrentQuestion(
  state: GameState,
  updater: (q: Question) => Question,
): GameState {
  if (!state.board) return state;
  const questions = state.board.questions.map((q, i) =>
    i === state.round.questionIndex ? updater(q) : q,
  );
  return { ...state, board: { ...state.board, questions } };
}

function currentQuestion(state: GameState): Question | null {
  if (!state.board) return null;
  return state.board.questions[state.round.questionIndex] ?? null;
}

function findAnswer(question: Question, answerId: string): Answer | undefined {
  return question.answers.find((a) => a.id === answerId);
}

function reducer(state: GameState, action: Action): GameState {
  switch (action.type) {
    case 'LOAD_BOARD': {
      const board: SurveyBoard = {
        ...action.board,
        questions: action.board.questions.map(resetReveals),
      };
      return {
        ...state,
        board,
        mode: 'main',
        round: createInitialRound(0),
        fastMoney: null,
      };
    }
    case 'SET_TEAM_NAMES':
      return {
        ...state,
        teams: [
          { ...state.teams[0], name: action.teamA || 'Family A' },
          { ...state.teams[1], name: action.teamB || 'Family B' },
        ],
      };
    case 'RESET_SCORES':
      return {
        ...state,
        teams: state.teams.map((t) => ({ ...t, score: 0 })) as GameState['teams'],
      };
    case 'SET_QUESTION': {
      if (!state.board) return state;
      const idx = Math.max(0, Math.min(action.index, state.board.questions.length - 1));
      const board = {
        ...state.board,
        questions: state.board.questions.map((q, i) =>
          i === idx ? resetReveals(q) : q,
        ),
      };
      return {
        ...state,
        board,
        mode: 'main',
        round: createInitialRound(idx),
      };
    }
    case 'REVEAL_ANSWER': {
      const q = currentQuestion(state);
      if (!q) return state;
      const answer = findAnswer(q, action.answerId);
      if (!answer || answer.revealed) return state;

      withSound(state, 'reveal');

      let next = updateCurrentQuestion(state, (question) => ({
        ...question,
        answers: question.answers.map((a) =>
          a.id === action.answerId ? { ...a, revealed: true } : a,
        ),
      }));

      const roundPoints = next.round.roundPoints + answer.points;
      let phase = next.round.phase;
      let controllingTeam = next.round.controllingTeam;

      if (phase === 'faceoff' && next.round.faceoffWinner) {
        phase = 'control';
        controllingTeam = next.round.faceoffWinner;
      }

      const allRevealed = next.board!.questions[next.round.questionIndex].answers.every(
        (a) => a.revealed || !a.text.trim(),
      );

      if (phase === 'control' && allRevealed) {
        phase = 'round_over';
        withSound(next, 'win');
      }

      return {
        ...next,
        round: {
          ...next.round,
          roundPoints,
          phase,
          controllingTeam,
        },
      };
    }
    case 'HIDE_ANSWER': {
      const q = currentQuestion(state);
      if (!q) return state;
      const answer = findAnswer(q, action.answerId);
      if (!answer || !answer.revealed) return state;
      return updateCurrentQuestion(
        {
          ...state,
          round: {
            ...state.round,
            roundPoints: Math.max(0, state.round.roundPoints - answer.points),
          },
        },
        (question) => ({
          ...question,
          answers: question.answers.map((a) =>
            a.id === action.answerId ? { ...a, revealed: false } : a,
          ),
        }),
      );
    }
    case 'SET_FACEOFF_WINNER':
      withSound(state, 'ding');
      return {
        ...state,
        round: {
          ...state.round,
          faceoffWinner: action.team,
          controllingTeam: action.team,
          phase: 'control',
          strikes: 0,
        },
      };
    case 'ADD_STRIKE': {
      if (state.round.phase !== 'control' && state.round.phase !== 'faceoff') {
        return state;
      }
      withSound(state, 'strike');
      const strikes = state.round.strikes + 1;
      if (strikes >= MAX_STRIKES && state.round.controllingTeam) {
        withSound(state, 'buzzer');
        return {
          ...state,
          round: {
            ...state.round,
            strikes,
            phase: 'steal',
          },
        };
      }
      return {
        ...state,
        round: { ...state.round, strikes },
      };
    }
    case 'CLEAR_STRIKES':
      return { ...state, round: { ...state.round, strikes: 0 } };
    case 'START_STEAL':
      withSound(state, 'steal');
      return {
        ...state,
        round: { ...state.round, phase: 'steal', stealAttempted: false },
      };
    case 'RESOLVE_STEAL': {
      if (!state.round.controllingTeam) return state;
      const stealingTeam = otherTeam(state.round.controllingTeam);
      let next = state;

      if (action.success && action.answerId) {
        const q = currentQuestion(state);
        const answer = q ? findAnswer(q, action.answerId) : undefined;
        if (answer && !answer.revealed) {
          withSound(state, 'reveal');
          next = updateCurrentQuestion(state, (question) => ({
            ...question,
            answers: question.answers.map((a) =>
              a.id === action.answerId ? { ...a, revealed: true } : a,
            ),
          }));
          const points = next.round.roundPoints + answer.points;
          withSound(next, 'win');
          return {
            ...next,
            teams: next.teams.map((t) =>
              t.id === stealingTeam ? { ...t, score: t.score + points } : t,
            ) as GameState['teams'],
            round: {
              ...next.round,
              roundPoints: 0,
              phase: 'reveal_remaining',
              stealAttempted: true,
              stealSuccessful: true,
            },
          };
        }
      }

      withSound(state, 'buzzer');
      const controlTeam = state.round.controllingTeam;
      const points = state.round.roundPoints;
      return {
        ...state,
        teams: state.teams.map((t) =>
          t.id === controlTeam ? { ...t, score: t.score + points } : t,
        ) as GameState['teams'],
        round: {
          ...state.round,
          roundPoints: 0,
          phase: 'reveal_remaining',
          stealAttempted: true,
          stealSuccessful: false,
        },
      };
    }
    case 'AWARD_ROUND': {
      withSound(state, 'win');
      const points = state.round.roundPoints;
      return {
        ...state,
        teams: state.teams.map((t) =>
          t.id === action.team ? { ...t, score: t.score + points } : t,
        ) as GameState['teams'],
        round: {
          ...state.round,
          roundPoints: 0,
          phase: 'reveal_remaining',
        },
      };
    }
    case 'REVEAL_ALL_REMAINING': {
      withSound(state, 'theme');
      return updateCurrentQuestion(state, (question) => ({
        ...question,
        answers: question.answers.map((a) =>
          a.text.trim() ? { ...a, revealed: true } : a,
        ),
      }));
    }
    case 'ADJUST_SCORE':
      return {
        ...state,
        teams: state.teams.map((t) =>
          t.id === action.team
            ? { ...t, score: Math.max(0, t.score + action.delta) }
            : t,
        ) as GameState['teams'],
      };
    case 'SET_SCORE':
      return {
        ...state,
        teams: state.teams.map((t) =>
          t.id === action.team ? { ...t, score: Math.max(0, action.score) } : t,
        ) as GameState['teams'],
      };
    case 'TOGGLE_SOUND':
      return { ...state, soundEnabled: !state.soundEnabled };
    case 'TOGGLE_HOST_PANEL':
      return { ...state, hostPanelOpen: !state.hostPanelOpen };
    case 'SET_MODE':
      return { ...state, mode: action.mode };
    case 'INIT_FAST_MONEY': {
      withSound(state, 'theme');
      return {
        ...state,
        mode: 'fast_money',
        fastMoney: createInitialFastMoney(action.prompts),
      };
    }
    case 'FM_SET_RUNNING':
      return state.fastMoney
        ? {
            ...state,
            fastMoney: { ...state.fastMoney, isRunning: action.running },
          }
        : state;
    case 'FM_TICK': {
      if (!state.fastMoney || !state.fastMoney.isRunning) return state;
      const key = state.fastMoney.currentPlayer === 1 ? 'player1' : 'player2';
      const player = state.fastMoney[key];
      const timeRemaining = Math.max(0, player.timeRemaining - 1);
      if (timeRemaining === 0) {
        withSound(state, 'buzzer');
        return {
          ...state,
          fastMoney: {
            ...state.fastMoney,
            isRunning: false,
            [key]: { ...player, timeRemaining: 0 },
          },
        };
      }
      if (timeRemaining <= 5) withSound(state, 'timer');
      return {
        ...state,
        fastMoney: {
          ...state.fastMoney,
          [key]: { ...player, timeRemaining },
        },
      };
    }
    case 'FM_SET_ANSWER': {
      if (!state.fastMoney) return state;
      const key = action.player === 1 ? 'player1' : 'player2';
      const player = state.fastMoney[key];
      const answers = player.answers.map((a, i) =>
        i === action.index ? { ...a, text: action.text } : a,
      );
      return {
        ...state,
        fastMoney: { ...state.fastMoney, [key]: { ...player, answers } },
      };
    }
    case 'FM_SET_POINTS': {
      if (!state.fastMoney) return state;
      const key = action.player === 1 ? 'player1' : 'player2';
      const player = state.fastMoney[key];
      const answers = player.answers.map((a, i) =>
        i === action.index
          ? { ...a, points: action.points, matched: action.matched }
          : a,
      );
      const totalPoints = answers.reduce((s, a) => s + a.points, 0);
      withSound(state, action.matched ? 'fastMoneyReveal' : 'buzzer');
      return {
        ...state,
        fastMoney: {
          ...state.fastMoney,
          [key]: { ...player, answers, totalPoints },
        },
      };
    }
    case 'FM_REVEAL_ANSWER': {
      if (!state.fastMoney) return state;
      const key = action.player === 1 ? 'player1' : 'player2';
      const player = state.fastMoney[key];
      const answers = player.answers.map((a, i) =>
        i === action.index ? { ...a, revealed: true } : a,
      );
      withSound(state, 'ding');
      return {
        ...state,
        fastMoney: { ...state.fastMoney, [key]: { ...player, answers } },
      };
    }
    case 'FM_NEXT_QUESTION': {
      if (!state.fastMoney) return state;
      const next = Math.min(
        state.fastMoney.currentQuestionIndex + 1,
        state.fastMoney.questionPrompts.length - 1,
      );
      return {
        ...state,
        fastMoney: { ...state.fastMoney, currentQuestionIndex: next },
      };
    }
    case 'FM_SWITCH_PLAYER': {
      if (!state.fastMoney) return state;
      withSound(state, 'theme');
      return {
        ...state,
        fastMoney: {
          ...state.fastMoney,
          currentPlayer: 2,
          currentQuestionIndex: 0,
          isRunning: false,
        },
      };
    }
    case 'FM_SET_SHOWING':
      return state.fastMoney
        ? {
            ...state,
            fastMoney: { ...state.fastMoney, showingAnswers: action.showing },
          }
        : state;
    case 'FM_COMPLETE': {
      if (!state.fastMoney) return state;
      withSound(state, 'applause');
      return {
        ...state,
        fastMoney: { ...state.fastMoney, isComplete: true, isRunning: false },
      };
    }
    case 'FM_AWARD_TO_TEAM': {
      if (!state.fastMoney) return state;
      const total =
        state.fastMoney.player1.totalPoints + state.fastMoney.player2.totalPoints;
      const won = total >= state.fastMoney.targetScore;
      const award = won ? total * 1 : 0;
      // Classic: winning Fast Money awards the combined points (often as cash).
      // We add the combined total to the team score when they hit the target.
      withSound(state, won ? 'win' : 'buzzer');
      return {
        ...state,
        teams: state.teams.map((t) =>
          t.id === action.team ? { ...t, score: t.score + award } : t,
        ) as GameState['teams'],
        mode: 'main',
      };
    }
    case 'RESET_ROUND_REVEALS': {
      if (!state.board) return state;
      return {
        ...state,
        board: {
          ...state.board,
          questions: state.board.questions.map((q, i) =>
            i === state.round.questionIndex ? resetReveals(q) : q,
          ),
        },
        round: createInitialRound(state.round.questionIndex),
      };
    }
    default:
      return state;
  }
}

function buildInitialState(): GameState {
  const base = createInitialGameState();
  const names = loadTeamNames();
  const board = getActiveBoard();
  return {
    ...base,
    teams: [
      { id: 'teamA', name: names.teamA, score: 0 },
      { id: 'teamB', name: names.teamB, score: 0 },
    ],
    board: board
      ? {
          ...board,
          questions: board.questions.map(resetReveals),
        }
      : null,
  };
}

interface GameContextValue {
  state: GameState;
  dispatch: React.Dispatch<Action>;
  currentQuestion: Question | null;
  unlock: () => void;
}

const GameContext = createContext<GameContextValue | null>(null);

export function GameProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, buildInitialState);

  const unlock = useCallback(() => unlockAudio(), []);

  const q = useMemo(() => currentQuestion(state), [state]);

  const value = useMemo(
    () => ({ state, dispatch, currentQuestion: q, unlock }),
    [state, dispatch, q, unlock],
  );

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
}

export function useGame(): GameContextValue {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error('useGame must be used within GameProvider');
  return ctx;
}
