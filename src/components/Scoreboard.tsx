import { Box, Typography, keyframes } from '@mui/material';
import { useGame } from '../context/GameContext';

const pulse = keyframes`
  0%, 100% { transform: scale(1); box-shadow: 0 0 0 rgba(245,200,66,0); }
  50% { transform: scale(1.02); box-shadow: 0 0 24px rgba(245,200,66,0.35); }
`;

export default function Scoreboard() {
  const { state } = useGame();
  const { teams, round } = state;
  const controlling = round.controllingTeam;

  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: { xs: '1fr', md: '1fr auto 1fr' },
        gap: 2,
        alignItems: 'stretch',
        width: '100%',
      }}
    >
      {teams.map((team, idx) => {
        const isLeft = idx === 0;
        const isControl = controlling === team.id;
        return (
          <Box
            key={team.id}
            sx={{
              order: { xs: idx === 0 ? 1 : 3, md: idx === 0 ? 1 : 3 },
              background: isControl
                ? 'linear-gradient(180deg, #1E5AD0 0%, #0F2F7A 100%)'
                : 'linear-gradient(180deg, #163A7A 0%, #0A1F45 100%)',
              border: '3px solid',
              borderColor: isControl ? 'primary.main' : 'rgba(245,200,66,0.35)',
              borderRadius: 2,
              px: 2,
              py: 1.5,
              textAlign: 'center',
              animation: isControl ? `${pulse} 2s ease-in-out infinite` : 'none',
              direction: isLeft ? 'ltr' : 'ltr',
            }}
          >
            <Typography
              variant="h5"
              sx={{
                color: 'primary.main',
                textShadow: '0 2px 0 #000',
                lineHeight: 1.1,
              }}
            >
              {team.name}
            </Typography>
            <Typography
              variant="h2"
              sx={{
                color: '#fff',
                fontSize: { xs: '2.5rem', md: '3.5rem' },
                lineHeight: 1,
                textShadow: '0 3px 0 #000, 0 0 20px rgba(245,200,66,0.3)',
              }}
            >
              {team.score}
            </Typography>
          </Box>
        );
      })}

      <Box
        sx={{
          order: { xs: 2, md: 2 },
          minWidth: { md: 160 },
          background: 'linear-gradient(180deg, #2A1A08 0%, #1A1005 100%)',
          border: '3px solid #F5C842',
          borderRadius: 2,
          px: 2,
          py: 1.5,
          textAlign: 'center',
          boxShadow: '0 0 30px rgba(245,200,66,0.25)',
        }}
      >
        <Typography variant="overline" sx={{ color: 'primary.light', letterSpacing: 2 }}>
          Round
        </Typography>
        <Typography
          variant="h2"
          sx={{
            color: 'primary.main',
            fontSize: { xs: '2.2rem', md: '3rem' },
            lineHeight: 1,
          }}
        >
          {round.roundPoints}
        </Typography>
      </Box>
    </Box>
  );
}
