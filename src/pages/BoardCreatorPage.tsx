import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Alert,
  Box,
  Button,
  Container,
  IconButton,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import SaveIcon from '@mui/icons-material/Save';
import {
  createEmptyAnswer,
  createEmptyBoard,
  createEmptyQuestion,
  MAX_ANSWERS,
  type Answer,
  type FastMoneyQuestion,
  type Question,
  type SurveyBoard,
} from '../types/game';
import { loadBoards, upsertBoard, setActiveBoardId, exportBoardJson, importBoardJson } from '../utils/storage';
import { useGame } from '../context/GameContext';

export default function BoardCreatorPage() {
  const { boardId } = useParams();
  const navigate = useNavigate();
  const { dispatch } = useGame();
  const [board, setBoard] = useState<SurveyBoard>(() => createEmptyBoard());
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeQ, setActiveQ] = useState(0);
  const [editorMode, setEditorMode] = useState<'rounds' | 'fastMoney'>('rounds');
  const [activeFastMoneyQ, setActiveFastMoneyQ] = useState(0);

  useEffect(() => {
    if (!boardId) return;
    const found = loadBoards().find((b) => b.id === boardId);
    if (found) {
      setBoard(found);
      setActiveQ(0);
    }
  }, [boardId]);

  const question = board.questions[activeQ] ?? board.questions[0];
  const fastMoneyQuestion = board.fastMoneyQuestions[activeFastMoneyQ];

  const totalPoints = useMemo(
    () => (question?.answers ?? []).reduce((s, a) => s + (Number(a.points) || 0), 0),
    [question],
  );

  const updateQuestion = (updater: (q: Question) => Question) => {
    setBoard((prev) => ({
      ...prev,
      questions: prev.questions.map((q, i) => (i === activeQ ? updater(q) : q)),
    }));
  };

  const updateAnswer = (answerId: string, patch: Partial<Answer>) => {
    updateQuestion((q) => ({
      ...q,
      answers: q.answers.map((a) => (a.id === answerId ? { ...a, ...patch } : a)),
    }));
  };

  const updateFastMoneyQuestion = (
    updater: (question: FastMoneyQuestion) => FastMoneyQuestion,
  ) => {
    setBoard((previous) => ({
      ...previous,
      fastMoneyQuestions: previous.fastMoneyQuestions.map((question, index) =>
        index === activeFastMoneyQ ? updater(question) : question,
      ),
    }));
  };

  const updateFastMoneyAnswer = (answerId: string, patch: Partial<Answer>) => {
    updateFastMoneyQuestion((question) => ({
      ...question,
      answers: question.answers.map((answer) =>
        answer.id === answerId ? { ...answer, ...patch } : answer,
      ),
    }));
  };

  const validate = (): string | null => {
    if (!board.title.trim()) return 'Board title is required.';
    if (board.questions.length === 0) return 'Add at least one question.';
    for (const [qi, q] of board.questions.entries()) {
      if (!q.prompt.trim()) return `Question ${qi + 1} needs a prompt.`;
      const filled = q.answers.filter((a) => a.text.trim());
      if (filled.length < 2) return `Question ${qi + 1} needs at least 2 answers.`;
      for (const a of filled) {
        if (!a.points || a.points < 1) {
          return `Each answer on question ${qi + 1} needs points ≥ 1.`;
        }
      }
    }
    const hasFastMoney = board.fastMoneyQuestions.some(
      (question) =>
        question.prompt.trim() ||
        question.answers.some((answer) => answer.text.trim()),
    );
    if (hasFastMoney) {
      for (const [qi, question] of board.fastMoneyQuestions.entries()) {
        if (!question.prompt.trim()) {
          return `Fast Money question ${qi + 1} needs a prompt.`;
        }
        const answers = question.answers.filter((answer) => answer.text.trim());
        if (answers.length < 2) {
          return `Fast Money question ${qi + 1} needs at least 2 answers.`;
        }
        if (answers.some((answer) => answer.points < 1)) {
          return `Each Fast Money answer on question ${qi + 1} needs points ≥ 1.`;
        }
      }
    }
    return null;
  };

  const handleSave = (andPlay = false) => {
    const err = validate();
    if (err) {
      setError(err);
      setMessage(null);
      return;
    }
    // Drop blank answers, sort by points desc for classic board order
    const cleaned: SurveyBoard = {
      ...board,
      questions: board.questions.map((q) => ({
        ...q,
        answers: q.answers
          .filter((a) => a.text.trim())
          .map((a) => ({
            ...a,
            text: a.text.trim(),
            points: Number(a.points) || 0,
            revealed: false,
          }))
          .sort((a, b) => b.points - a.points),
      })),
      fastMoneyQuestions: board.fastMoneyQuestions.map((question) => ({
        ...question,
        prompt: question.prompt.trim(),
        answers: question.answers
          .filter((answer) => answer.text.trim())
          .map((answer) => ({
            ...answer,
            text: answer.text.trim(),
            points: Number(answer.points) || 0,
            revealed: false,
          }))
          .sort((a, b) => b.points - a.points),
      })),
    };
    upsertBoard(cleaned);
    setBoard(cleaned);
    setError(null);
    setMessage('Board saved.');
    if (andPlay) {
      setActiveBoardId(cleaned.id);
      dispatch({ type: 'LOAD_BOARD', board: cleaned });
      navigate('/play');
    }
  };

  const handleImport = async (file: File) => {
    try {
      const text = await file.text();
      const imported = importBoardJson(text);
      setBoard(imported);
      setActiveQ(0);
      setMessage('Board imported. Save to keep it.');
      setError(null);
    } catch {
      setError('Could not import board JSON.');
    }
  };

  const handleExport = () => {
    const blob = new Blob([exportBoardJson(board)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${board.title.replace(/\s+/g, '-').toLowerCase() || 'survey'}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Box sx={{ minHeight: '100vh', py: 3 }}>
      <Container maxWidth="md">
        <Stack direction="row" alignItems="center" spacing={1} mb={3}>
          <IconButton onClick={() => navigate('/')} aria-label="Back">
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h4" color="primary" sx={{ flex: 1 }}>
            Board Creator
          </Typography>
          <Button startIcon={<SaveIcon />} variant="outlined" onClick={() => handleSave(false)}>
            Save
          </Button>
          <Button variant="contained" onClick={() => handleSave(true)}>
            Save & Play
          </Button>
        </Stack>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}
        {message && (
          <Alert severity="success" sx={{ mb: 2 }} onClose={() => setMessage(null)}>
            {message}
          </Alert>
        )}

        <Paper
          elevation={0}
          sx={{
            p: 3,
            mb: 3,
            background: 'rgba(13,33,68,0.9)',
            border: '2px solid rgba(245,200,66,0.35)',
          }}
        >
          <TextField
            fullWidth
            label="Board Title"
            value={board.title}
            onChange={(e) => setBoard((b) => ({ ...b, title: e.target.value }))}
            sx={{ mb: 2 }}
          />
          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
            <Button component="label" variant="outlined" size="small">
              Import JSON
              <input
                hidden
                type="file"
                accept="application/json,.json"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) void handleImport(f);
                  e.target.value = '';
                }}
              />
            </Button>
            <Button variant="outlined" size="small" onClick={handleExport}>
              Export JSON
            </Button>
          </Stack>
        </Paper>

        <Stack direction="row" spacing={1} mb={3}>
          <Button
            variant={editorMode === 'rounds' ? 'contained' : 'outlined'}
            onClick={() => setEditorMode('rounds')}
          >
            Main Game Rounds
          </Button>
          <Button
            variant={editorMode === 'fastMoney' ? 'contained' : 'outlined'}
            onClick={() => setEditorMode('fastMoney')}
          >
            Fast Money
          </Button>
        </Stack>

        {editorMode === 'rounds' && (
          <>
        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap mb={2}>
          {board.questions.map((q, i) => (
            <Button
              key={q.id}
              size="small"
              variant={i === activeQ ? 'contained' : 'outlined'}
              onClick={() => setActiveQ(i)}
            >
              Q{i + 1}
            </Button>
          ))}
          <Button
            size="small"
            startIcon={<AddIcon />}
            onClick={() => {
              setBoard((b) => ({
                ...b,
                questions: [...b.questions, createEmptyQuestion()],
              }));
              setActiveQ(board.questions.length);
            }}
          >
            Add Question
          </Button>
          {board.questions.length > 1 && (
            <Button
              size="small"
              color="error"
              onClick={() => {
                setBoard((b) => ({
                  ...b,
                  questions: b.questions.filter((_, i) => i !== activeQ),
                }));
                setActiveQ((i) => Math.max(0, i - 1));
              }}
            >
              Delete Question
            </Button>
          )}
        </Stack>

        {question && (
          <Paper
            elevation={0}
            sx={{
              p: 3,
              background: 'rgba(13,33,68,0.9)',
              border: '2px solid rgba(245,200,66,0.35)',
            }}
          >
            <TextField
              fullWidth
              label="Survey Question"
              value={question.prompt}
              onChange={(e) => updateQuestion((q) => ({ ...q, prompt: e.target.value }))}
              sx={{ mb: 2 }}
              multiline
            />
            <Typography variant="subtitle2" color="primary.light" mb={1}>
              Answers & Points · Total {totalPoints}
            </Typography>
            <Stack spacing={1.5}>
              {question.answers.map((answer, idx) => (
                <Stack key={answer.id} direction={{ xs: 'column', sm: 'row' }} spacing={1}>
                  <TextField
                    fullWidth
                    label={`Answer ${idx + 1}`}
                    value={answer.text}
                    onChange={(e) => updateAnswer(answer.id, { text: e.target.value })}
                  />
                  <TextField
                    label="Points"
                    type="number"
                    value={answer.points}
                    onChange={(e) =>
                      updateAnswer(answer.id, { points: Math.max(0, Number(e.target.value) || 0) })
                    }
                    sx={{ width: { sm: 120 } }}
                    inputProps={{ min: 0 }}
                  />
                  <IconButton
                    aria-label="Remove answer"
                    onClick={() =>
                      updateQuestion((q) => ({
                        ...q,
                        answers: q.answers.filter((a) => a.id !== answer.id),
                      }))
                    }
                    disabled={question.answers.length <= 2}
                  >
                    <DeleteIcon />
                  </IconButton>
                </Stack>
              ))}
            </Stack>
            {question.answers.length < MAX_ANSWERS && (
              <Button
                sx={{ mt: 2 }}
                startIcon={<AddIcon />}
                onClick={() =>
                  updateQuestion((q) => ({
                    ...q,
                    answers: [...q.answers, createEmptyAnswer(q.answers.length)],
                  }))
                }
              >
                Add Answer
              </Button>
            )}
          </Paper>
        )}
          </>
        )}

        {editorMode === 'fastMoney' && fastMoneyQuestion && (
          <>
            <Alert severity="info" sx={{ mb: 2 }}>
              Configure all five Fast Money questions. Each answer is matched
              case-insensitively during play and awards its configured points.
            </Alert>
            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap mb={2}>
              {board.fastMoneyQuestions.map((item, index) => (
                <Button
                  key={item.id}
                  size="small"
                  variant={index === activeFastMoneyQ ? 'contained' : 'outlined'}
                  onClick={() => setActiveFastMoneyQ(index)}
                >
                  FM {index + 1}
                </Button>
              ))}
            </Stack>
            <Paper
              elevation={0}
              sx={{
                p: 3,
                background: 'rgba(13,33,68,0.9)',
                border: '2px solid rgba(245,200,66,0.35)',
              }}
            >
              <TextField
                fullWidth
                label={`Fast Money Question ${activeFastMoneyQ + 1}`}
                value={fastMoneyQuestion.prompt}
                onChange={(event) =>
                  updateFastMoneyQuestion((item) => ({
                    ...item,
                    prompt: event.target.value,
                  }))
                }
                sx={{ mb: 2 }}
              />
              <Typography variant="subtitle2" color="primary.light" mb={1}>
                Accepted answers and survey points
              </Typography>
              <Stack spacing={1.5}>
                {fastMoneyQuestion.answers.map((answer, index) => (
                  <Stack
                    key={answer.id}
                    direction={{ xs: 'column', sm: 'row' }}
                    spacing={1}
                  >
                    <TextField
                      fullWidth
                      label={`Answer ${index + 1}`}
                      value={answer.text}
                      onChange={(event) =>
                        updateFastMoneyAnswer(answer.id, {
                          text: event.target.value,
                        })
                      }
                    />
                    <TextField
                      label="Points"
                      type="number"
                      value={answer.points}
                      onChange={(event) =>
                        updateFastMoneyAnswer(answer.id, {
                          points: Math.max(0, Number(event.target.value) || 0),
                        })
                      }
                      sx={{ width: { sm: 120 } }}
                      inputProps={{ min: 0 }}
                    />
                    <IconButton
                      aria-label="Remove Fast Money answer"
                      disabled={fastMoneyQuestion.answers.length <= 2}
                      onClick={() =>
                        updateFastMoneyQuestion((item) => ({
                          ...item,
                          answers: item.answers.filter(
                            (candidate) => candidate.id !== answer.id,
                          ),
                        }))
                      }
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Stack>
                ))}
              </Stack>
              {fastMoneyQuestion.answers.length < MAX_ANSWERS && (
                <Button
                  sx={{ mt: 2 }}
                  startIcon={<AddIcon />}
                  onClick={() =>
                    updateFastMoneyQuestion((item) => ({
                      ...item,
                      answers: [
                        ...item.answers,
                        createEmptyAnswer(item.answers.length),
                      ],
                    }))
                  }
                >
                  Add Answer
                </Button>
              )}
            </Paper>
          </>
        )}
      </Container>
    </Box>
  );
}
