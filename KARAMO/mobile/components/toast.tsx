import { Text, View } from 'react-native';
import { AlertTriangle } from 'lucide-react-native';
import { type } from '@/constants/theme';

export function Toast({ kind = 'error', message }: { kind?: 'error' | 'warn'; message: string }) {
  const palette =
    kind === 'warn'
      ? { bg: 'rgba(255,176,32,0.12)', border: 'rgba(255,176,32,0.30)', fg: '#FFB840' }
      : { bg: 'rgba(255,59,92,0.14)', border: 'rgba(255,59,92,0.32)', fg: '#FF6B85' };

  return (
    <View
      style={{
        position: 'absolute',
        top: 64,
        left: 16,
        right: 16,
        zIndex: 200,
        backgroundColor: palette.bg,
        borderWidth: 1,
        borderColor: palette.border,
        paddingVertical: 12,
        paddingHorizontal: 14,
        borderRadius: 12,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
      }}
    >
      <AlertTriangle size={18} color={palette.fg} strokeWidth={1.5} />
      <Text style={{ ...type.bodySmall, color: palette.fg, flex: 1 }}>{message}</Text>
    </View>
  );
}
