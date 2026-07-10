import { DefaultTheme, Theme } from '@react-navigation/native';
import { colors } from './colors';

export const navTheme: Theme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: colors.navy900,
    background: colors.background,
    card: colors.surface,
    text: colors.text,
    border: colors.border,
    notification: colors.orange500,
  },
};

export const CURRENCY = '৳';

export function formatCurrency(amount: number): string {
  const n = Number.isFinite(amount) ? amount : 0;
  return `${CURRENCY}${n.toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}`;
}
