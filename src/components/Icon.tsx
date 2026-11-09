import Svg, { Path } from 'react-native-svg';

import { theme } from '../theme';

const paths = {
  check: 'm5 12 4 4L19 6',
  close: 'm6 6 12 12M6 18 18 6',
  down: 'm6 9 6 6 6-6',
  up: 'm6 15 6-6 6 6',
  arrow: 'M5 12h14m-6-6 6 6-6 6',
  search: 'M21 21l-4.3-4.3M19 11a8 8 0 1 1-16 0 8 8 0 0 1 16 0',
  filters: 'M4 7h9m4 0h3M4 17h3m4 0h9M13 4v6M7 14v6',
  play: 'm9 5 11 7-11 7V5Z',
} as const;

export type IconName = keyof typeof paths;

export function Icon({ name, size = 20, color = theme.colors.ink }: {
  name: IconName;
  size?: number;
  color?: string;
}) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" accessible={false}>
      <Path d={paths[name]} stroke={color} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}
