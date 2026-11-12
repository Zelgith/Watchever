import Svg, { Path } from 'react-native-svg';

import { theme } from '../theme';

const paths = {
  check: 'm5 12 4 4L19 6',
  plus: 'M12 5v14M5 12h14',
  profile: 'M20 21a8 8 0 0 0-16 0M16 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0',
  close: 'm6 6 12 12M6 18 18 6',
  down: 'm6 9 6 6 6-6',
  up: 'm6 15 6-6 6 6',
  arrow: 'M5 12h14m-6-6 6 6-6 6',
  back: 'M19 12H5m6 6-6-6 6-6',
  search: 'M21 21l-4.3-4.3M19 11a8 8 0 1 1-16 0 8 8 0 0 1 16 0',
  play: 'm9 5 11 7-11 7V5Z',
  refresh: 'M20 7V3l-3 3a8 8 0 0 0-13 6M4 17v4l3-3a8 8 0 0 0 13-6M20 3h-5M4 21h5',
  star: 'm12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2-5.6-3-5.6 3 1.1-6.2L3 9.6l6.2-.9L12 3Z',
} as const;

export type IconName = keyof typeof paths;

export function Icon({ name, size = 20, color = theme.colors.ink, filled = false }: {
  name: IconName;
  size?: number;
  color?: string;
  filled?: boolean;
}) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" accessible={false}>
      <Path d={paths[name]} fill={filled ? color : 'none'} stroke={color} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}
