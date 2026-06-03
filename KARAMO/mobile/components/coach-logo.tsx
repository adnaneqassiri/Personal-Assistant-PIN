import Svg, { Circle, Defs, LinearGradient, Path, RadialGradient, Stop } from 'react-native-svg';

export function CoachLogo({ size = 64 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 120 120" fill="none">
      <Defs>
        <LinearGradient id="cg" x1="10" y1="10" x2="110" y2="110" gradientUnits="userSpaceOnUse">
          <Stop offset="0" stopColor="#4A53FF" />
          <Stop offset="0.5" stopColor="#33C0B8" />
          <Stop offset="1" stopColor="#41FF31" />
        </LinearGradient>
        <RadialGradient id="ccore" cx="60" cy="60" r="6" gradientUnits="userSpaceOnUse">
          <Stop offset="0" stopColor="#5DFF52" />
          <Stop offset="1" stopColor="#33C0B8" />
        </RadialGradient>
      </Defs>
      <Path d="M 54.77 10.27 A 50 50 0 0 1 98.86 28.53 L 72.43 49.93 A 16 16 0 0 0 58.33 44.09 Z" fill="url(#cg)" opacity={1} />
      <Path d="M 91.47 21.14 A 50 50 0 0 1 109.73 65.23 L 75.91 61.67 A 16 16 0 0 0 70.07 47.57 Z" fill="url(#cg)" opacity={0.92} />
      <Path d="M 109.73 54.77 A 50 50 0 0 1 91.47 98.86 L 70.07 72.43 A 16 16 0 0 0 75.91 58.33 Z" fill="url(#cg)" opacity={0.78} />
      <Path d="M 98.86 91.47 A 50 50 0 0 1 54.77 109.73 L 58.33 75.91 A 16 16 0 0 0 72.43 70.07 Z" fill="url(#cg)" opacity={0.62} />
      <Path d="M 65.23 109.73 A 50 50 0 0 1 21.14 91.47 L 47.57 70.07 A 16 16 0 0 0 61.67 75.91 Z" fill="url(#cg)" opacity={0.55} />
      <Path d="M 28.53 98.86 A 50 50 0 0 1 10.27 54.77 L 44.09 58.33 A 16 16 0 0 0 49.93 72.43 Z" fill="url(#cg)" opacity={0.68} />
      <Path d="M 10.27 65.23 A 50 50 0 0 1 28.53 21.14 L 49.93 47.57 A 16 16 0 0 0 44.09 61.67 Z" fill="url(#cg)" opacity={0.85} />
      <Path d="M 21.14 28.53 A 50 50 0 0 1 65.23 10.27 L 61.67 44.09 A 16 16 0 0 0 47.57 49.93 Z" fill="url(#cg)" opacity={0.97} />
      <Circle cx="60" cy="60" r="14" fill="#0A0A0F" />
      <Circle cx="60" cy="60" r="6" fill="url(#ccore)" />
    </Svg>
  );
}
