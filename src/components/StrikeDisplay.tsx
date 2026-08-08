import { Box, keyframes } from '@mui/material';
import { MAX_STRIKES } from '../types/game';
import { useGame } from '../context/GameContext';

const flashIn = keyframes`
  0% { transform: scale(0.4) rotate(-12deg); opacity: 0; }
  60% { transform: scale(1.15) rotate(4deg); opacity: 1; }
  100% { transform: scale(1) rotate(0deg); opacity: 1; }
`;

export default function StrikeDisplay() {
  const { state } = useGame();
  const strikes = state.round.strikes;

  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'center',
        gap: 2,
        minHeight: 72,
        alignItems: 'center',
      }}
    >
      {Array.from({ length: MAX_STRIKES }).map((_, i) => {
        const active = i < strikes;
        return (
          <Box
            key={i}
            sx={{
              width: { xs: 52, md: 68 },
              height: { xs: 52, md: 68 },
              borderRadius: 1.5,
              border: '3px solid',
              borderColor: active ? '#FF5252' : 'rgba(255,255,255,0.2)',
              background: active
                ? 'radial-gradient(circle at 30% 30%, #FF8A80, #B71C1C)'
                : 'rgba(0,0,0,0.25)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: active ? '0 0 20px rgba(229,57,53,0.6)' : 'none',
              animation: active ? `${flashIn} 0.35s ease-out` : 'none',
            }}
          >
            {active && (
              <Box
                component="span"
                sx={{
                  color: '#fff',
                  fontFamily: '"Bebas Neue", sans-serif',
                  fontSize: { xs: '2rem', md: '2.6rem' },
                  lineHeight: 1,
                  textShadow: '0 2px 0 #000',
                }}
              >
                X
              </Box>
            )}
          </Box>
        );
      })}
    </Box>
  );
}
