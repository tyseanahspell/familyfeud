import { useState, type FormEvent } from 'react';
import {
  Alert,
  Box,
  Button,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import CloseIcon from '@mui/icons-material/Close';
import { useGame } from '../context/GameContext';

function normalizeAnswer(value: string): string {
  return value.trim().replace(/\s+/g, ' ').toLocaleLowerCase();
}

export default function BoardHostControls() {
  const { state, currentQuestion, dispatch, unlock } = useGame();
  const [guess, setGuess] = useState('');
  const [feedback, setFeedback] = useState<'correct' | 'incorrect' | null>(null);

  const submitGuess = (event: FormEvent) => {
    event.preventDefault();
    const normalizedGuess = normalizeAnswer(guess);
    if (!normalizedGuess || !currentQuestion) return;

    const match = currentQuestion.answers.find(
      (answer) =>
        !answer.revealed && normalizeAnswer(answer.text) === normalizedGuess,
    );

    unlock();
    if (state.round.phase === 'steal') {
      dispatch({
        type: 'RESOLVE_STEAL',
        success: Boolean(match),
        answerId: match?.id,
      });
    } else if (match) {
      dispatch({ type: 'REVEAL_ANSWER', answerId: match.id });
    } else {
      dispatch({ type: 'ADD_STRIKE' });
    }

    setFeedback(match ? 'correct' : 'incorrect');
    setGuess('');
  };

  const markIncorrect = () => {
    unlock();
    if (state.round.phase === 'steal') {
      dispatch({ type: 'RESOLVE_STEAL', success: false });
    } else {
      dispatch({ type: 'ADD_STRIKE' });
    }
    setFeedback('incorrect');
  };

  return (
    <Box
      sx={{
        p: { xs: 1.5, md: 2 },
        border: '2px solid rgba(245,200,66,0.45)',
        borderRadius: 2,
        background: 'rgba(7,20,40,0.86)',
      }}
    >
      <Typography variant="overline" color="primary.light">
        Host Console
      </Typography>
      <Box component="form" onSubmit={submitGuess}>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
          <TextField
            fullWidth
            autoComplete="off"
            label="Type the contestant's answer"
            value={guess}
            onChange={(event) => {
              setGuess(event.target.value);
              setFeedback(null);
            }}
            inputProps={{ 'aria-label': 'Contestant answer' }}
          />
          <Button
            type="submit"
            variant="contained"
            startIcon={<SearchIcon />}
            disabled={!guess.trim()}
          >
            Check
          </Button>
          <Button
            variant="outlined"
            color="error"
            startIcon={<CloseIcon />}
            onClick={markIncorrect}
          >
            Miss
          </Button>
        </Stack>
      </Box>

      {feedback && (
        <Alert
          severity={feedback === 'correct' ? 'success' : 'error'}
          sx={{ mt: 1.5, py: 0 }}
          onClose={() => setFeedback(null)}
        >
          {feedback === 'correct'
            ? 'Correct answer — revealed on the board.'
            : state.round.phase === 'reveal_remaining'
              ? 'Steal missed — points awarded to the controlling team.'
              : 'No match — strike added.'}
        </Alert>
      )}

      <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap mt={1.5}>
        {state.teams.map((team) => (
          <Button
            key={team.id}
            size="small"
            variant={
              state.round.controllingTeam === team.id ? 'contained' : 'outlined'
            }
            onClick={() => {
              unlock();
              dispatch({ type: 'SET_FACEOFF_WINNER', team: team.id });
            }}
          >
            Control: {team.name}
          </Button>
        ))}
        {state.round.controllingTeam && state.round.roundPoints > 0 && (
          <Button
            size="small"
            variant="outlined"
            onClick={() =>
              dispatch({
                type: 'AWARD_ROUND',
                team: state.round.controllingTeam!,
              })
            }
          >
            Award {state.round.roundPoints} points
          </Button>
        )}
        <Button
          size="small"
          variant="text"
          onClick={() => dispatch({ type: 'CLEAR_STRIKES' })}
        >
          Clear strikes
        </Button>
      </Stack>
    </Box>
  );
}
