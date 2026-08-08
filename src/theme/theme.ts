import { createTheme } from '@mui/material/styles';

declare module '@mui/material/styles' {
  interface Palette {
    feud: {
      navy: string;
      royal: string;
      gold: string;
      goldDark: string;
      crimson: string;
      board: string;
      panel: string;
      glow: string;
    };
  }
  interface PaletteOptions {
    feud?: {
      navy?: string;
      royal?: string;
      gold?: string;
      goldDark?: string;
      crimson?: string;
      board?: string;
      panel?: string;
      glow?: string;
    };
  }
}

const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#F5C842',
      dark: '#C9951A',
      light: '#FFE08A',
      contrastText: '#0A1B3D',
    },
    secondary: {
      main: '#1E4DB7',
      dark: '#0F2F7A',
      light: '#4A7AE8',
    },
    error: {
      main: '#E53935',
    },
    success: {
      main: '#43A047',
    },
    background: {
      default: '#071428',
      paper: '#0D2144',
    },
    text: {
      primary: '#F7F3E8',
      secondary: '#C9D4EA',
    },
    feud: {
      navy: '#071428',
      royal: '#123A7A',
      gold: '#F5C842',
      goldDark: '#C9951A',
      crimson: '#D32F2F',
      board: '#0A1F45',
      panel: '#163A7A',
      glow: 'rgba(245, 200, 66, 0.45)',
    },
  },
  typography: {
    fontFamily: '"Oswald", "Arial Narrow", sans-serif',
    h1: {
      fontFamily: '"Bebas Neue", "Oswald", sans-serif',
      letterSpacing: '0.06em',
      fontWeight: 400,
    },
    h2: {
      fontFamily: '"Bebas Neue", "Oswald", sans-serif',
      letterSpacing: '0.05em',
    },
    h3: {
      fontFamily: '"Bebas Neue", "Oswald", sans-serif',
      letterSpacing: '0.04em',
    },
    h4: {
      fontFamily: '"Bebas Neue", "Oswald", sans-serif',
      letterSpacing: '0.03em',
    },
    button: {
      fontFamily: '"Oswald", sans-serif',
      fontWeight: 600,
      letterSpacing: '0.08em',
      textTransform: 'uppercase',
    },
    body1: {
      fontFamily: '"Source Sans 3", "Helvetica Neue", sans-serif',
    },
    body2: {
      fontFamily: '"Source Sans 3", "Helvetica Neue", sans-serif',
    },
  },
  shape: {
    borderRadius: 10,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          paddingInline: 20,
          paddingBlock: 10,
        },
        containedPrimary: {
          background: 'linear-gradient(180deg, #FFE08A 0%, #F5C842 45%, #C9951A 100%)',
          color: '#0A1B3D',
          boxShadow: '0 4px 0 #8A6510, 0 8px 20px rgba(0,0,0,0.35)',
          '&:hover': {
            background: 'linear-gradient(180deg, #FFF0B0 0%, #FFD45C 45%, #E0A820 100%)',
          },
        },
      },
    },
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          background:
            'radial-gradient(ellipse at top, #123A7A 0%, #071428 55%, #040C1A 100%)',
          minHeight: '100vh',
        },
      },
    },
  },
});

export default theme;
