import { TextStyle } from 'react-native';

export const typography: Record<string, TextStyle> = {
  h1: {
    fontSize: 24,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  h2: {
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  title: {
    fontSize: 17,
    fontWeight: '600',
    letterSpacing: -0.2,
  },
  subtitle: {
    fontSize: 15,
    fontWeight: '500',
    letterSpacing: -0.1,
  },
  body: {
    fontSize: 13,
    fontWeight: '400',
  },
  caption: {
    fontSize: 11,
    fontWeight: '400',
    letterSpacing: 0.1,
  },
  button: {
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
};
