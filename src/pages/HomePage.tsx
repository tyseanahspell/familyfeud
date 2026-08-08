import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  Container,
  Paper,
  Stack,
  TextField,
  Typography,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Divider,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import EditIcon from '@mui/icons-material/Edit';
import AddIcon from '@mui/icons-material/Add';
import { useGame } from '../context/GameContext';
import {
  deleteBoard,
  loadBoards,
  loadTeamNames,
  saveTeamNames,
  setActiveBoardId,
  upsertBoard,
  importBoardJson,
} from '../utils/storage';
import type { SurveyBoard } from '../types/game';
import { playSound } from '../utils/sounds';

export default function HomePage() {
  const navigate = useNavigate();
  const { dispatch, unlock, state } = useGame();
  const names = loadTeamNames();
  const [teamA, setTeamA] = useState(names.teamA);
  const [teamB, setTeamB] = useState(names.teamB);
  const [boards, setBoards] = useState<SurveyBoard[]>([]);

  useEffect(() => {
    setBoards(loadBoards());
  }, []);

  const persistTeams = () => {
    saveTeamNames(teamA, teamB);
    dispatch({ type: 'SET_TEAM_NAMES', teamA, teamB });
  };

  const startBoard = (board: SurveyBoard) => {
    unlock();
    persistTeams();
    setActiveBoardId(board.id);
    dispatch({ type: 'LOAD_BOARD', board });
    playSound('theme', state.soundEnabled);
    navigate('/play');
  };

  const loadSample = async () => {
    try {
      const res = await fetch('/sample-board.json');
      const json = await res.text();
      const board = importBoardJson(json);
      board.title = 'Sample Family Night Survey';
      setBoards(upsertBoard(board));
    } catch {
      // ignore
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        py: { xs: 4, md: 8 },
        background:
          'radial-gradient(ellipse at 50% 0%, #1A4A9A 0%, #071428 50%, #030912 100%)',
        position: 'relative',
        overflow: 'hidden',
        '&::before': {
          content: '""',
          position: 'absolute',
          inset: 0,
          backgroundImage:
            'repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(245,200,66,0.03) 3px, rgba(245,200,66,0.03) 4px)',
          pointerEvents: 'none',
        },
      }}
    >
      <Container maxWidth="md" sx={{ position: 'relative', zIndex: 1 }}>
        <Box textAlign="center" mb={5}>
          <Typography
            variant="h1"
            sx={{
              fontSize: { xs: '3.5rem', md: '6rem' },
              background: 'linear-gradient(180deg, #FFE08A 0%, #F5C842 40%, #C9951A 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              textShadow: 'none',
              filter: 'drop-shadow(0 4px 0 #5C4010)',
              lineHeight: 0.95,
              mb: 1,
            }}
          >
            FAMILY FEUD
          </Typography>
          <Typography
            variant="h6"
            sx={{
              color: 'rgba(247,243,232,0.75)',
              letterSpacing: '0.35em',
              textTransform: 'uppercase',
              fontFamily: '"Oswald", sans-serif',
            }}
          >
            Live Game Show Board
          </Typography>
        </Box>

        <Paper
          elevation={0}
          sx={{
            p: { xs: 2.5, md: 3.5 },
            mb: 3,
            background: 'linear-gradient(180deg, rgba(18,58,122,0.9), rgba(7,20,40,0.95))',
            border: '2px solid rgba(245,200,66,0.4)',
            borderRadius: 3,
          }}
        >
          <Typography variant="h5" color="primary" gutterBottom>
            Team Names
          </Typography>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <TextField
              fullWidth
              label="Family A"
              value={teamA}
              onChange={(e) => setTeamA(e.target.value)}
              onBlur={persistTeams}
            />
            <TextField
              fullWidth
              label="Family B"
              value={teamB}
              onChange={(e) => setTeamB(e.target.value)}
              onBlur={persistTeams}
            />
          </Stack>
        </Paper>

        <Paper
          elevation={0}
          sx={{
            p: { xs: 2.5, md: 3.5 },
            background: 'linear-gradient(180deg, rgba(18,58,122,0.9), rgba(7,20,40,0.95))',
            border: '2px solid rgba(245,200,66,0.4)',
            borderRadius: 3,
          }}
        >
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            justifyContent="space-between"
            alignItems={{ xs: 'stretch', sm: 'center' }}
            spacing={2}
            mb={2}
          >
            <Typography variant="h5" color="primary">
              Survey Boards
            </Typography>
            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
              <Button variant="outlined" onClick={() => void loadSample()}>
                Load Sample
              </Button>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => {
                  persistTeams();
                  navigate('/create');
                }}
              >
                Create Board
              </Button>
            </Stack>
          </Stack>

          {boards.length === 0 ? (
            <Typography color="text.secondary">
              No boards yet. Create a survey or load the sample board to get started.
            </Typography>
          ) : (
            <List disablePadding>
              {boards.map((board, idx) => (
                <Box key={board.id}>
                  {idx > 0 && <Divider sx={{ borderColor: 'rgba(255,255,255,0.08)' }} />}
                  <ListItem sx={{ px: 0 }}>
                    <ListItemText
                      primary={board.title}
                      secondary={`${board.questions.length} question${board.questions.length === 1 ? '' : 's'} · Updated ${new Date(board.updatedAt).toLocaleDateString()}`}
                    />
                    <ListItemSecondaryAction>
                      <IconButton
                        edge="end"
                        aria-label="edit"
                        onClick={() => navigate(`/create/${board.id}`)}
                        sx={{ mr: 0.5 }}
                      >
                        <EditIcon />
                      </IconButton>
                      <IconButton
                        edge="end"
                        aria-label="delete"
                        onClick={() => setBoards(deleteBoard(board.id))}
                        sx={{ mr: 0.5 }}
                      >
                        <DeleteIcon />
                      </IconButton>
                      <IconButton
                        edge="end"
                        color="primary"
                        aria-label="play"
                        onClick={() => startBoard(board)}
                      >
                        <PlayArrowIcon />
                      </IconButton>
                    </ListItemSecondaryAction>
                  </ListItem>
                </Box>
              ))}
            </List>
          )}
        </Paper>
      </Container>
    </Box>
  );
}
