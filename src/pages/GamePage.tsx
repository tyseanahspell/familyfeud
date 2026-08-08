import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AppBar,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Stack,
  TextField,
  Toolbar,
  Typography,
} from '@mui/material';
import HomeIcon from '@mui/icons-material/Home';
import SettingsIcon from '@mui/icons-material/Settings';
import BoltIcon from '@mui/icons-material/Bolt';
import Scoreboard from '../components/Scoreboard';
import StrikeDisplay from '../components/StrikeDisplay';
import AnswerBoard from '../components/AnswerBoard';
import HostControls from '../components/HostControls';
import FastMoneyBoard from '../components/FastMoneyBoard';
import { useGame } from '../context/GameContext';
import { MAX_FAST_MONEY_QUESTIONS } from '../types/game';

export default function GamePage() {
  const navigate = useNavigate();
  const { state, dispatch, currentQuestion, unlock } = useGame();
  const [hostOpen, setHostOpen] = useState(state.hostPanelOpen);
  const [fmDialog, setFmDialog] = useState(false);
  const [fmPrompts, setFmPrompts] = useState<string[]>(
    Array.from({ length: MAX_FAST_MONEY_QUESTIONS }, () => ''),
  );

  const phaseLabel = useMemo(() => {
    switch (state.round.phase) {
      case 'faceoff':
        return 'Face-Off';
      case 'control':
        return 'In Control';
      case 'steal':
        return 'Steal';
      case 'reveal_remaining':
        return 'Reveal Remaining';
      case 'round_over':
        return 'Round Complete';
      default:
        return '';
    }
  }, [state.round.phase]);

  if (!state.board) {
    return (
      <Box sx={{ p: 4, textAlign: 'center' }}>
        <Typography variant="h4" gutterBottom>
          No board loaded
        </Typography>
        <Button variant="contained" onClick={() => navigate('/')}>
          Go Home
        </Button>
      </Box>
    );
  }

  const startFastMoney = () => {
    const prompts = fmPrompts.map((p) => p.trim()).filter(Boolean);
    if (prompts.length < 3) return;
    unlock();
    dispatch({ type: 'INIT_FAST_MONEY', prompts });
    setFmDialog(false);
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        background:
          'radial-gradient(ellipse at 50% 20%, #15408A 0%, #071428 55%, #030912 100%)',
      }}
    >
      <AppBar
        position="sticky"
        elevation={0}
        sx={{
          background: 'rgba(7,20,40,0.92)',
          borderBottom: '2px solid rgba(245,200,66,0.35)',
          backdropFilter: 'blur(8px)',
        }}
      >
        <Toolbar sx={{ gap: 1 }}>
          <IconButton color="inherit" onClick={() => navigate('/')} aria-label="Home">
            <HomeIcon />
          </IconButton>
          <Typography variant="h6" sx={{ flex: 1, color: 'primary.main' }} noWrap>
            {state.board.title}
          </Typography>
          <Button
            color="inherit"
            startIcon={<BoltIcon />}
            onClick={() => {
              // Prefill from unused board questions if available
              const remaining = state.board!.questions
                .slice(state.round.questionIndex + 1)
                .map((q) => q.prompt)
                .filter(Boolean);
              if (remaining.length) {
                setFmPrompts((prev) =>
                  prev.map((p, i) => p || remaining[i] || ''),
                );
              }
              setFmDialog(true);
            }}
          >
            Fast Money
          </Button>
          <IconButton
            color="inherit"
            onClick={() => setHostOpen((o) => !o)}
            aria-label="Host controls"
          >
            <SettingsIcon />
          </IconButton>
        </Toolbar>
      </AppBar>

      <Box
        sx={{
          flex: 1,
          px: { xs: 1.5, md: 3 },
          py: { xs: 2, md: 3 },
          mr: { md: hostOpen ? '360px' : 0 },
          transition: 'margin 0.25s ease',
        }}
      >
        {state.mode === 'fast_money' ? (
          <FastMoneyBoard />
        ) : (
          <Stack spacing={3} maxWidth={1100} mx="auto">
            <Scoreboard />
            <StrikeDisplay />

            <Box textAlign="center">
              <Typography
                variant="overline"
                sx={{ color: 'primary.light', letterSpacing: 3 }}
              >
                {phaseLabel}
                {state.round.controllingTeam &&
                  ` · ${state.teams.find((t) => t.id === state.round.controllingTeam)?.name}`}
              </Typography>
              <Typography
                variant="h4"
                sx={{
                  mt: 0.5,
                  px: 2,
                  fontSize: { xs: '1.35rem', md: '1.85rem' },
                  color: '#F7F3E8',
                  textShadow: '0 2px 8px rgba(0,0,0,0.45)',
                }}
              >
                {currentQuestion?.prompt}
              </Typography>
            </Box>

            <AnswerBoard
              answers={currentQuestion?.answers ?? []}
              interactive
              onReveal={(id) => {
                unlock();
                dispatch({ type: 'REVEAL_ANSWER', answerId: id });
              }}
            />

            {state.round.phase === 'steal' && (
              <Box
                sx={{
                  textAlign: 'center',
                  py: 1.5,
                  px: 2,
                  borderRadius: 2,
                  border: '2px solid #F5C842',
                  background: 'rgba(245,200,66,0.12)',
                }}
              >
                <Typography variant="h5" color="primary">
                  STEAL!
                </Typography>
                <Typography color="text.secondary">
                  Use Host Controls to resolve the steal attempt.
                </Typography>
              </Box>
            )}
          </Stack>
        )}
      </Box>

      <HostControls open={hostOpen} onClose={() => setHostOpen(false)} />

      <Dialog open={fmDialog} onClose={() => setFmDialog(false)} fullWidth maxWidth="sm">
        <DialogTitle>Start Fast Money</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" mb={2}>
            Enter 3–5 rapid-fire survey questions for Fast Money.
          </Typography>
          <Stack spacing={1.5}>
            {fmPrompts.map((p, i) => (
              <TextField
                key={i}
                label={`Question ${i + 1}`}
                fullWidth
                value={p}
                onChange={(e) =>
                  setFmPrompts((prev) => prev.map((x, idx) => (idx === i ? e.target.value : x)))
                }
              />
            ))}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setFmDialog(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={startFastMoney}
            disabled={fmPrompts.filter((p) => p.trim()).length < 3}
          >
            Begin
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
