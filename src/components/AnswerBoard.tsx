import { Box, Typography, keyframes } from '@mui/material';
import type { Answer } from '../types/game';
import { useGame } from '../context/GameContext';

const flipIn = keyframes`
  0% { transform: rotateX(90deg); opacity: 0.2; }
  100% { transform: rotateX(0deg); opacity: 1; }
`;

interface Props {
  answers: Answer[];
  onReveal?: (id: string) => void;
  interactive?: boolean;
}

export default function AnswerBoard({ answers, onReveal, interactive = false }: Props) {
  const filled = answers.filter((a) => a.text.trim());
  // Pad to even layout of up to 8 slots for classic look
  const slots = [...filled];
  while (slots.length < Math.max(filled.length, 4) && slots.length < 8) {
    slots.push({
      id: `empty-${slots.length}`,
      text: '',
      points: 0,
      revealed: false,
    });
  }

  const mid = Math.ceil(slots.length / 2);
  const left = slots.slice(0, mid);
  const right = slots.slice(mid);

  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
        gap: { xs: 1.5, md: 2 },
        width: '100%',
        perspective: 1000,
      }}
    >
      {[left, right].map((col, colIdx) => (
        <Box key={colIdx} sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
          {col.map((answer, rowIdx) => {
            const number = colIdx * mid + rowIdx + 1;
            const isEmpty = !answer.text.trim();
            return (
              <AnswerSlot
                key={answer.id}
                number={number}
                answer={answer}
                isEmpty={isEmpty}
                interactive={interactive && !isEmpty}
                onReveal={onReveal}
              />
            );
          })}
        </Box>
      ))}
    </Box>
  );
}

function AnswerSlot({
  number,
  answer,
  isEmpty,
  interactive,
  onReveal,
}: {
  number: number;
  answer: Answer;
  isEmpty: boolean;
  interactive: boolean;
  onReveal?: (id: string) => void;
}) {
  const { unlock } = useGame();

  const handleClick = () => {
    if (!interactive || answer.revealed || isEmpty) return;
    unlock();
    onReveal?.(answer.id);
  };

  return (
    <Box
      onClick={handleClick}
      role={interactive ? 'button' : undefined}
      sx={{
        position: 'relative',
        height: { xs: 64, md: 78 },
        borderRadius: 1.5,
        border: '3px solid #F5C842',
        background: answer.revealed
          ? 'linear-gradient(180deg, #1E5AD0 0%, #0F2F7A 100%)'
          : 'linear-gradient(180deg, #0D2A5C 0%, #071A3A 100%)',
        boxShadow: answer.revealed
          ? '0 0 24px rgba(245,200,66,0.35), inset 0 0 20px rgba(255,255,255,0.08)'
          : 'inset 0 0 20px rgba(0,0,0,0.4)',
        display: 'flex',
        alignItems: 'center',
        cursor: interactive && !answer.revealed && !isEmpty ? 'pointer' : 'default',
        overflow: 'hidden',
        transition: 'transform 0.15s ease',
        '&:hover':
          interactive && !answer.revealed && !isEmpty
            ? { transform: 'scale(1.015)', borderColor: '#FFE08A' }
            : undefined,
        animation: answer.revealed ? `${flipIn} 0.45s ease-out` : 'none',
        opacity: isEmpty ? 0.35 : 1,
      }}
    >
      {!answer.revealed && !isEmpty && (
        <Box
          sx={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Box
            sx={{
              width: { xs: 40, md: 48 },
              height: { xs: 40, md: 48 },
              borderRadius: '50%',
              background: 'linear-gradient(180deg, #FFE08A, #C9951A)',
              color: '#0A1B3D',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontFamily: '"Bebas Neue", sans-serif',
              fontSize: { xs: '1.6rem', md: '2rem' },
              boxShadow: '0 3px 0 #8A6510',
            }}
          >
            {number}
          </Box>
        </Box>
      )}

      {answer.revealed && (
        <>
          <Typography
            sx={{
              flex: 1,
              px: 2,
              fontFamily: '"Bebas Neue", sans-serif',
              fontSize: { xs: '1.35rem', md: '1.85rem' },
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
              color: '#fff',
              textShadow: '0 2px 0 #000',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {answer.text}
          </Typography>
          <Box
            sx={{
              minWidth: { xs: 56, md: 72 },
              height: '100%',
              background: 'linear-gradient(180deg, #F5C842, #C9951A)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderLeft: '3px solid #FFE08A',
            }}
          >
            <Typography
              sx={{
                fontFamily: '"Bebas Neue", sans-serif',
                fontSize: { xs: '1.6rem', md: '2.1rem' },
                color: '#0A1B3D',
                lineHeight: 1,
              }}
            >
              {answer.points}
            </Typography>
          </Box>
        </>
      )}

      {isEmpty && (
        <Box sx={{ width: '100%', textAlign: 'center' }}>
          <Typography sx={{ color: 'rgba(255,255,255,0.25)', letterSpacing: 4 }}>—</Typography>
        </Box>
      )}
    </Box>
  );
}
