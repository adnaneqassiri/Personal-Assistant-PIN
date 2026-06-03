import { Pressable, Text, View } from 'react-native';
import { Check, Sparkles, Undo2, XCircle } from 'lucide-react-native';
import Animated, { SlideInDown } from 'react-native-reanimated';
import { Btn } from '@/components/btn';
import { colors, fonts } from '@/constants/theme';

type Props = {
  actioned: boolean;
  showSuccessToast: boolean;
  onMarkActioned: () => void;
  onAskCoach?: () => void;
  onIgnore?: () => void;
  insetsBottom: number;
};

export function ActionStack({
  actioned,
  showSuccessToast,
  onMarkActioned,
  onAskCoach,
  onIgnore,
  insetsBottom,
}: Props) {
  return (
    <View style={{ marginTop: 32, marginHorizontal: 24, gap: 12 }}>
      <Btn
        variant="primary"
        onPress={onMarkActioned}
        leading={
          actioned ? (
            <Undo2 size={20} color="#FFFFFF" strokeWidth={2} />
          ) : (
            <Check size={20} color="#FFFFFF" strokeWidth={2.5} />
          )
        }
      >
        {actioned ? "Désactiver l'action" : 'Marquer comme actionnée'}
      </Btn>

      <Pressable
        onPress={onAskCoach}
        accessibilityRole="button"
        style={({ pressed }) => ({
          width: '100%',
          height: 56,
          borderRadius: 16,
          backgroundColor: colors.bg,
          borderWidth: 1,
          borderColor: pressed ? 'rgba(255,255,255,0.28)' : 'rgba(255,255,255,0.18)',
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 12,
          transform: [{ scale: pressed ? 0.98 : 1 }],
        })}
      >
        <Sparkles size={20} color={colors.text} strokeWidth={1.75} />
        <Text
          style={{
            fontSize: 16,
            fontFamily: fonts.sansSemiBold,
            color: colors.text,
            letterSpacing: -0.16,
          }}
        >
          Demande à mon coach
        </Text>
      </Pressable>

      <Pressable
        onPress={onIgnore}
        accessibilityRole="button"
        style={({ pressed }) => ({
          width: '100%',
          height: 48,
          borderRadius: 12,
          backgroundColor: pressed ? 'rgba(255,59,92,0.08)' : 'transparent',
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
        })}
      >
        <XCircle size={18} color={colors.error} strokeWidth={1.75} />
        <Text
          style={{
            fontSize: 14,
            fontFamily: fonts.sansMedium,
            color: colors.error,
          }}
        >
          Ignorer cette alerte
        </Text>
      </Pressable>

      {showSuccessToast && (
        <Animated.View
          entering={SlideInDown.duration(200)}
          style={{
            position: 'absolute',
            bottom: insetsBottom + 24,
            left: 0,
            right: 0,
            backgroundColor: 'rgba(65,255,49,0.14)',
            borderWidth: 1,
            borderColor: 'rgba(65,255,49,0.32)',
            borderRadius: 12,
            paddingVertical: 12,
            paddingHorizontal: 14,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 10,
          }}
        >
          <Check size={18} color={colors.accent} strokeWidth={2.5} />
          <Text
            style={{
              fontSize: 13,
              fontFamily: fonts.sansMedium,
              color: colors.accent,
            }}
          >
            Alerte actionnée
          </Text>
        </Animated.View>
      )}
    </View>
  );
}
