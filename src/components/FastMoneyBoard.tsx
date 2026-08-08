import { useEffect, useState } from 'react';
import {
  Box,
  Button,
  Stack,
  TextField,
  Typography,
  Paper,
} from '@mui/material';
import { useGame } from '../context/GameContext';

export default function FastMoneyBoard() {
  const { state, dispatch, unlock } = useGame();
  const fm = state.fastMoney;
  const [hostPointsInput, setHostPointsInput] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!fm?.isRunning) return;
    const id = window.setInterval(() => dispatch({ type: 'FM_TICK' }), 1000);
    return () => window.clearInterval(id);
  }, [fm?.isRunning, dispatch]);

  if (!fm) {
    return (
      <Typography color="text.secondary">Fast Money is not initialized.</Typography>
    );
  }

  const playerKey = fm.currentPlayer === 1 ? 'player1' : 'player2';
  const player = fm[playerKey];
  const combined = fm.player1.totalPoints + fm.player2.totalPoints;
  const won = combined >= fm.targetScore;

  return (
    <Box>
      <Stack
        direction={{ xs: 'column', md: 'row' }}
        justifyContent="space-between"
        alignItems={{ xs: 'stretch', md: 'center' }}
        spacing={2}
        mb={3}
      >
        <Box>
          <Typography variant="h3" color="primary">
            Fast Money
          </Typography>
          <Typography color="text.secondary">
            Target {fm.targetScore} · Combined {combined}
          </Typography>
        </Box>
        <Paper
          elevation={0}
          sx={{
            px: 3,
            py: 1.5,
            textAlign: 'center',
            background: 'linear-gradient(180deg, #2A1A08, #1A1005)',
            border: '3px solid #F5C842',
          }}
        >
          <Typography variant="overline" color="primary.light">
            Player {fm.currentPlayer} Time
          </Typography>
          <Typography variant="h2" color={player.timeRemaining <= 5 ? 'error.main' : 'primary.main'}>
            {player.timeRemaining}s
          </Typography>
        </Paper>
      </Stack>

      <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap mb={3}>
        <Button
          variant="contained"
          disabled={fm.isRunning || player.timeRemaining === 0}
          onClick={() => {
            unlock();
            dispatch({ type: 'FM_SET_RUNNING', running: true });
          }}
        >
          Start Timer
        </Button>
        <Button
          variant="outlined"
          disabled={!fm.isRunning}
          onClick={() => dispatch({ type: 'FM_SET_RUNNING', running: false })}
        >
          Pause
        </Button>
        {fm.currentPlayer === 1 && (
          <Button
            variant="outlined"
            onClick={() => {
              unlock();
              dispatch({ type: 'FM_SWITCH_PLAYER' });
            }}
          >
            Switch to Player 2
          </Button>
        )}
        <Button
          variant="outlined"
          onClick={() => dispatch({ type: 'FM_SET_SHOWING', showing: !fm.showingAnswers })}
        >
          {fm.showingAnswers ? 'Hide Scoring' : 'Show Scoring'}
        </Button>
        <Button
          variant="contained"
          color="secondary"
          onClick={() => {
            unlock();
            dispatch({ type: 'FM_COMPLETE' });
          }}
        >
          Finish Fast Money
        </Button>
      </Stack>

      <Typography variant="h5" mb={2} color="primary.light">
        Player {fm.currentPlayer} — Enter Answers
      </Typography>

      <Stack spacing={1.5} mb={4}>
        {fm.questionPrompts.map((prompt, i) => (
          <Paper
            key={`q-${i}`}
            elevation={0}
            sx={{
              p: 2,
              background: 'rgba(13,42,92,0.7)',
              border: '2px solid rgba(245,200,66,0.35)',
            }}
          >
            <Typography variant="subtitle2" color="primary" gutterBottom>
              {i + 1}. {prompt}
            </Typography>
            <TextField
              fullWidth
              size="small"
              placeholder="Answer"
              value={player.answers[i]?.text ?? ''}
              onChange={(e) =>
                dispatch({
                  type: 'FM_SET_ANSWER',
                  player: fm.currentPlayer,
                  index: i,
                  text: e.target.value,
                })
              }
              disabled={fm.showingAnswers}
            />
          </Paper>
        ))}
      </Stack>

      {fm.showingAnswers && (
        <Box mb={4}>
          <Typography variant="h5" color="primary" mb={2}>
            Host Scoring
          </Typography>
          {[1, 2].map((pNum) => {
            const p = pNum === 1 ? fm.player1 : fm.player2;
            return (
              <Box key={pNum} mb={3}>
                <Typography variant="h6" gutterBottom>
                  Player {pNum} — {p.totalPoints} pts
                </Typography>
                <Stack spacing={1}>
                  {p.answers.map((ans, i) => {
                    const key = `${pNum}-${i}`;
                    return (
                      <Stack
                        key={key}
                        direction={{ xs: 'column', sm: 'row' }}
                        spacing={1}
                        alignItems={{ sm: 'center' }}
                      >
                        <Typography sx={{ flex: 1 }}>
                          {fm.questionPrompts[i]}: <strong>{ans.text || '—'}</strong>
                          {ans.revealed && ans.matched && ` (${ans.points})`}
                        </Typography>
                        <Button
                          size="small"
                          variant="outlined"
                          onClick={() => {
                            unlock();
                            dispatch({
                              type: 'FM_REVEAL_ANSWER',
                              player: pNum as 1 | 2,
                              index: i,
                            });
                          }}
                        >
                          Reveal
                        </Button>
                        <TextField
                          size="small"
                          type="number"
                          placeholder="Pts"
                          value={hostPointsInput[key] ?? (ans.points || '')}
                          onChange={(e) =>
                            setHostPointsInput((prev) => ({ ...prev, [key]: e.target.value }))
                          }
                          sx={{ width: 90 }}
                        />
                        <Button
                          size="small"
                          variant="contained"
                          onClick={() => {
                            unlock();
                            const pts = Number(hostPointsInput[key] ?? ans.points) || 0;
                            dispatch({
                              type: 'FM_SET_POINTS',
                              player: pNum as 1 | 2,
                              index: i,
                              points: pts,
                              matched: pts > 0,
                            });
                            dispatch({
                              type: 'FM_REVEAL_ANSWER',
                              player: pNum as 1 | 2,
                              index: i,
                            });
                          }}
                        >
                          Score
                        </Button>
                        <Button
                          size="small"
                          color="error"
                          variant="outlined"
                          onClick={() => {
                            unlock();
                            dispatch({
                              type: 'FM_SET_POINTS',
                              player: pNum as 1 | 2,
                              index: i,
                              points: 0,
                              matched: false,
                            });
                            dispatch({
                              type: 'FM_REVEAL_ANSWER',
                              player: pNum as 1 | 2,
                              index: i,
                            });
                          }}
                        >
                          0
                        </Button>
                      </Stack>
                    );
                  })}
                </Stack>
              </Box>
            );
          })}
        </Box>
      )}

      {fm.isComplete && (
        <Paper
          elevation={0}
          sx={{
            p: 3,
            textAlign: 'center',
            border: '3px solid #F5C842',
            background: won
              ? 'linear-gradient(180deg, #1B5E20, #0D3B12)'
              : 'linear-gradient(180deg, #4A1212, #2A0A0A)',
          }}
        >
          <Typography variant="h3" color="primary" gutterBottom>
            {won ? 'Fast Money Won!' : 'So Close!'}
          </Typography>
          <Typography variant="h4" mb={2}>
            Combined Score: {combined}
          </Typography>
          {won && (
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} justifyContent="center">
              {state.teams.map((t) => (
                <Button
                  key={t.id}
                  variant="contained"
                  onClick={() => {
                    unlock();
                    dispatch({ type: 'FM_AWARD_TO_TEAM', team: t.id });
                  }}
                >
                  Award {combined} to {t.name}
                </Button>
              ))}
            </Stack>
          )}
          {!won && (
            <Button variant="outlined" onClick={() => dispatch({ type: 'SET_MODE', mode: 'main' })}>
              Back to Main Game
            </Button>
          )}
        </Paper>
      )}
    </Box>
  );
}
