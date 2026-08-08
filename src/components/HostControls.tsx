import {
  Box,
  Button,
  ButtonGroup,
  Divider,
  Drawer,
  FormControlLabel,
  IconButton,
  Stack,
  Switch,
  TextField,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import VolumeUpIcon from '@mui/icons-material/VolumeUp';
import VolumeOffIcon from '@mui/icons-material/VolumeOff';
import { useGame } from '../context/GameContext';
import type { TeamId } from '../types/game';
import { otherTeam } from '../types/game';

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function HostControls({ open, onClose }: Props) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { state, dispatch, currentQuestion, unlock } = useGame();
  const { round, teams, board, soundEnabled } = state;

  const answers = (currentQuestion?.answers ?? []).filter((a) => a.text.trim());
  const unrevealed = answers.filter((a) => !a.revealed);
  const stealingTeam = round.controllingTeam ? otherTeam(round.controllingTeam) : null;

  const content = (
    <Box sx={{ p: 2, width: { xs: '100%', md: 360 }, maxWidth: '100%' }}>
      <Stack direction="row" alignItems="center" justifyContent="space-between" mb={1}>
        <Typography variant="h5" color="primary">
          Host Controls
        </Typography>
        <IconButton onClick={onClose} size="small" aria-label="Close host panel">
          <CloseIcon />
        </IconButton>
      </Stack>

      <FormControlLabel
        control={
          <Switch
            checked={soundEnabled}
            onChange={() => {
              unlock();
              dispatch({ type: 'TOGGLE_SOUND' });
            }}
            color="primary"
          />
        }
        label={
          <Stack direction="row" spacing={1} alignItems="center">
            {soundEnabled ? <VolumeUpIcon fontSize="small" /> : <VolumeOffIcon fontSize="small" />}
            <span>Sound Effects</span>
          </Stack>
        }
      />

      <Divider sx={{ my: 2, borderColor: 'rgba(245,200,66,0.25)' }} />

      <Typography variant="overline" color="primary.light">
        Survey Question
      </Typography>
      <TextField
        select
        fullWidth
        size="small"
        SelectProps={{ native: true }}
        value={round.questionIndex}
        onChange={(e) => dispatch({ type: 'SET_QUESTION', index: Number(e.target.value) })}
        sx={{ mb: 2, mt: 0.5 }}
      >
        {(board?.questions ?? []).map((q, i) => (
          <option key={q.id} value={i}>
            {i + 1}. {q.prompt.slice(0, 48) || 'Untitled'}
          </option>
        ))}
      </TextField>

      <Typography variant="body2" sx={{ mb: 2, color: 'text.secondary', fontStyle: 'italic' }}>
        {currentQuestion?.prompt || 'No question loaded'}
      </Typography>

      <Typography variant="overline" color="primary.light">
        Phase: {round.phase.replace('_', ' ')}
      </Typography>

      <Divider sx={{ my: 2, borderColor: 'rgba(245,200,66,0.25)' }} />

      <Typography variant="subtitle2" gutterBottom>
        Face-Off / Control
      </Typography>
      <ButtonGroup fullWidth variant="contained" sx={{ mb: 1.5 }}>
        {teams.map((t) => (
          <Button
            key={t.id}
            color={round.controllingTeam === t.id ? 'primary' : 'secondary'}
            onClick={() => {
              unlock();
              dispatch({ type: 'SET_FACEOFF_WINNER', team: t.id });
            }}
          >
            {t.name}
          </Button>
        ))}
      </ButtonGroup>

      <Stack direction="row" spacing={1} mb={2}>
        <Button
          fullWidth
          variant="outlined"
          color="error"
          onClick={() => {
            unlock();
            dispatch({ type: 'ADD_STRIKE' });
          }}
        >
          Strike ({round.strikes}/3)
        </Button>
        <Button
          fullWidth
          variant="outlined"
          onClick={() => dispatch({ type: 'CLEAR_STRIKES' })}
        >
          Clear X
        </Button>
      </Stack>

      {round.phase === 'steal' && stealingTeam && (
        <Box
          sx={{
            p: 1.5,
            mb: 2,
            borderRadius: 1,
            border: '2px solid #F5C842',
            background: 'rgba(245,200,66,0.08)',
          }}
        >
          <Typography variant="subtitle2" color="primary" gutterBottom>
            Steal — {teams.find((t) => t.id === stealingTeam)?.name}
          </Typography>
          <Stack spacing={1}>
            {unrevealed.map((a) => (
              <Button
                key={a.id}
                size="small"
                variant="contained"
                onClick={() => {
                  unlock();
                  dispatch({
                    type: 'RESOLVE_STEAL',
                    success: true,
                    answerId: a.id,
                  });
                }}
              >
                Resolve with hidden answer #{answers.indexOf(a) + 1}
              </Button>
            ))}
            <Button
              size="small"
              variant="outlined"
              color="error"
              onClick={() => {
                unlock();
                dispatch({ type: 'RESOLVE_STEAL', success: false });
              }}
            >
              Steal Failed
            </Button>
          </Stack>
        </Box>
      )}

      <Typography variant="subtitle2" gutterBottom>
        Reveal Answers
      </Typography>
      <Stack spacing={0.75} mb={2}>
        {answers.map((a, i) => (
          <Button
            key={a.id}
            size="small"
            variant={a.revealed ? 'outlined' : 'contained'}
            color={a.revealed ? 'inherit' : 'primary'}
            onClick={() => {
              unlock();
              if (a.revealed) dispatch({ type: 'HIDE_ANSWER', answerId: a.id });
              else dispatch({ type: 'REVEAL_ANSWER', answerId: a.id });
            }}
          >
            {i + 1}. {a.revealed ? `Hide: ${a.text} (${a.points})` : 'Reveal hidden answer'}
          </Button>
        ))}
      </Stack>

      <Stack spacing={1} mb={2}>
        <Button
          variant="contained"
          disabled={!round.controllingTeam || round.roundPoints === 0}
          onClick={() => {
            unlock();
            if (round.controllingTeam) {
              dispatch({ type: 'AWARD_ROUND', team: round.controllingTeam });
            }
          }}
        >
          Award Round to Control Team
        </Button>
        <Button
          variant="outlined"
          onClick={() => {
            unlock();
            dispatch({ type: 'REVEAL_ALL_REMAINING' });
          }}
        >
          Reveal Remaining
        </Button>
        <Button
          variant="outlined"
          color="warning"
          onClick={() => dispatch({ type: 'RESET_ROUND_REVEALS' })}
        >
          Reset This Round
        </Button>
        {round.phase === 'control' && round.strikes < 3 && (
          <Button
            variant="outlined"
            onClick={() => {
              unlock();
              dispatch({ type: 'START_STEAL' });
            }}
          >
            Force Steal Opportunity
          </Button>
        )}
      </Stack>

      <Divider sx={{ my: 2, borderColor: 'rgba(245,200,66,0.25)' }} />

      <Typography variant="subtitle2" gutterBottom>
        Score Adjust
      </Typography>
      {teams.map((t) => (
        <Stack key={t.id} direction="row" spacing={1} alignItems="center" mb={1}>
          <Typography sx={{ flex: 1, minWidth: 0 }} noWrap>
            {t.name}
          </Typography>
          <Button size="small" onClick={() => dispatch({ type: 'ADJUST_SCORE', team: t.id as TeamId, delta: -50 })}>
            -50
          </Button>
          <TextField
            size="small"
            type="number"
            value={t.score}
            onChange={(e) =>
              dispatch({
                type: 'SET_SCORE',
                team: t.id as TeamId,
                score: Number(e.target.value) || 0,
              })
            }
            sx={{ width: 88 }}
          />
          <Button size="small" onClick={() => dispatch({ type: 'ADJUST_SCORE', team: t.id as TeamId, delta: 50 })}>
            +50
          </Button>
        </Stack>
      ))}
      <Button fullWidth variant="text" color="warning" onClick={() => dispatch({ type: 'RESET_SCORES' })}>
        Reset Scores
      </Button>
    </Box>
  );

  if (isMobile) {
    return (
      <Drawer anchor="right" open={open} onClose={onClose}>
        {content}
      </Drawer>
    );
  }

  return (
    <Drawer
      variant="persistent"
      anchor="right"
      open={open}
      PaperProps={{
        sx: {
          width: 360,
          background: 'linear-gradient(180deg, #0D2144 0%, #071428 100%)',
          borderLeft: '2px solid rgba(245,200,66,0.35)',
        },
      }}
    >
      {content}
    </Drawer>
  );
}
