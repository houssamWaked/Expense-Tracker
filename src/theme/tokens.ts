export type ResolvedTheme = 'light' | 'dark' | 'sand' | 'sage' | 'midnight' | 'ocean';
export type ThemeName = 'system' | ResolvedTheme;
export type BalanceCardStyle = 'classic' | 'visa' | 'mastercard' | 'amex';

export type ThemeColors = {
  paper: string;
  surface: string;
  ink: string;
  softInk: string;
  muted: string;
  line: string;
  darkLine: string;
  acid: string;
  acidSoft: string;
  coral: string;
  green: string;
  blue: string;
  white: string;
  black: string;
  panel: string;
  onPanel: string;
  panelMuted: string;
  panelLine: string;
  gridline: string;
  track: string;
  placeholder: string;
  handle: string;
  scrim: string;
  divider: string;
  chart: string;
};

const lightTheme: ThemeColors = {
    paper: '#F1F0E9', surface: '#FAF9F4', ink: '#20231D', softInk: '#54584F', muted: '#898D82',
    line: '#DADBD1', darkLine: '#3C4138', acid: '#D8F36A', acidSoft: '#EAF5B8', coral: '#DD7359',
    green: '#4E806C', blue: '#738E9C', white: '#FFFFFF', black: '#151813', panel: '#20231D',
    onPanel: '#FAF9F4', panelMuted: '#A2A79C', panelLine: '#3C4138', gridline: '#E8E8DF',
    track: '#E4E5DC', placeholder: '#A5A79D', handle: '#B9BAAF', scrim: 'rgba(20,23,19,0.48)',
    divider: 'rgba(32,35,29,0.25)', chart: '#B5B7AA',
};

const darkTheme: ThemeColors = {
    paper: '#151813', surface: '#20231D', ink: '#F1F0E9', softInk: '#C2C5BB', muted: '#93988D',
    line: '#343930', darkLine: '#454B41', acid: '#D8F36A', acidSoft: '#394126', coral: '#F08268',
    green: '#81B99E', blue: '#94AFBF', white: '#FFFFFF', black: '#0E100D', panel: '#272B24',
    onPanel: '#F1F0E9', panelMuted: '#B6BBAF', panelLine: '#454B41', gridline: '#343930',
    track: '#343930', placeholder: '#767C70', handle: '#545A50', scrim: 'rgba(0,0,0,0.62)',
    divider: 'rgba(20,23,19,0.25)', chart: '#656B60',
};

export const themes: Record<ResolvedTheme, ThemeColors> = {
  light: lightTheme,
  dark: darkTheme,
  sand: { ...lightTheme, paper: '#F3EBDD', surface: '#FBF5E9', ink: '#382D22', softInk: '#665747', muted: '#91806D', line: '#DFD0BA', darkLine: '#6B5944', acid: '#D7A94B', acidSoft: '#F0E1BD', coral: '#BD6348', green: '#58735B', blue: '#667C95', panel: '#46382A', onPanel: '#FFF8EA', panelMuted: '#D5C5AD', panelLine: '#6B5944', gridline: '#E8DDCC', track: '#E5D8C3', placeholder: '#A79783', handle: '#C1AF98', scrim: 'rgba(44,31,18,0.52)', divider: 'rgba(56,45,34,0.25)', chart: '#B9A384' },
  sage: { ...lightTheme, paper: '#E7EFE4', surface: '#F5F9F2', ink: '#1F3829', softInk: '#4C6655', muted: '#7C9282', line: '#CADACB', darkLine: '#385A43', acid: '#79AC82', acidSoft: '#D7E9D8', coral: '#C86559', green: '#39775A', blue: '#5F8490', panel: '#203A2B', onPanel: '#F4FFF5', panelMuted: '#B2CBB6', panelLine: '#385A43', gridline: '#DCE8DB', track: '#D4E2D3', placeholder: '#8FA493', handle: '#A9BCA9', scrim: 'rgba(18,39,25,0.55)', divider: 'rgba(31,56,41,0.25)', chart: '#8EAB91' },
  midnight: { ...darkTheme, paper: '#10101A', surface: '#1A1928', ink: '#F2EFFF', softInk: '#C9C4DD', muted: '#9A94B7', line: '#353149', darkLine: '#4A4264', acid: '#B49CFF', acidSoft: '#342D4A', coral: '#FF8C9A', green: '#77D4B0', blue: '#8BAAFF', panel: '#242038', onPanel: '#F2EFFF', panelMuted: '#C1BADA', panelLine: '#4A4264', gridline: '#29273A', track: '#353149', placeholder: '#7D7894', handle: '#55506A', scrim: 'rgba(5,4,12,0.74)', divider: 'rgba(225,217,255,0.2)', chart: '#726A94' },
  ocean: { ...darkTheme, paper: '#09232A', surface: '#10333C', ink: '#E9FAFA', softInk: '#B6D6D8', muted: '#7FA9AD', line: '#20505A', darkLine: '#27636B', acid: '#55D9D0', acidSoft: '#17464B', coral: '#FF927A', green: '#65C49A', blue: '#6AC1D0', panel: '#123D48', onPanel: '#E9FAFA', panelMuted: '#A9D1D2', panelLine: '#27636B', gridline: '#19434D', track: '#20505A', placeholder: '#72959A', handle: '#38656B', scrim: 'rgba(1,15,18,0.76)', divider: 'rgba(193,244,244,0.2)', chart: '#4E8E98' },
};

export const balanceCardStyles: Record<BalanceCardStyle, { label: 'classicCard' | 'visaCard' | 'mastercardCard' | 'amexCard'; panel: string | null; text: string | null; muted: string | null; accent: string; mark: string }> = {
  classic: { label: 'classicCard', panel: null, text: null, muted: null, accent: '#D8F36A', mark: 'PW' },
  visa: { label: 'visaCard', panel: '#143B75', text: '#FFFFFF', muted: '#C1D7F1', accent: '#75B9FF', mark: 'VISA' },
  mastercard: { label: 'mastercardCard', panel: '#171B24', text: '#FFFFFF', muted: '#C4C7CE', accent: '#F2A64A', mark: 'MC' },
  amex: { label: 'amexCard', panel: '#147C9A', text: '#FFFFFF', muted: '#D4F1F7', accent: '#A9E7F1', mark: 'AMEX' },
};

export const categoryColors: Record<string, string> = {
  'Food & Drinks': '#D67856', Shopping: '#897FAD', Transport: '#648C87', Home: '#728999',
  Health: '#A86E79', Entertainment: '#B78F43', Travel: '#5F8A72', Bills: '#737B83',
  Other: '#90816D', Income: '#4E806C', Salary: '#4E806C', Freelance: '#648C87',
  Investment: '#897FAD', Gift: '#B78F43', 'Other income': '#737B83',
};

export const categorySwatches = Object.values(categoryColors).filter((color, index, list) => list.indexOf(color) === index);
