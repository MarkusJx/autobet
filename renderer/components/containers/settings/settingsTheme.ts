import {createTheme} from '@mui/material/styles';

const darkTheme = createTheme({
    palette: {
        mode: 'dark',
        primary: {
            main: '#90caf9',
            light: '#ffffff',
            dark: '#ffffff',
        },
        secondary: {
            main: '#001b2a',
        },
        background: {
            default: '#001620',
        },
        text: {
            primary: '#ffffff',
        },
    }
});

export default darkTheme;