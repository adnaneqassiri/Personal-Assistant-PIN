import { Pressable, Text, View } from 'react-native';
import { ChevronLeft } from 'lucide-react-native';
import { colors, fonts } from '@/constants/theme';

type Props = {
  title: string;
  onBack: () => void;
};

export function BackHeader({ title, onBack }: Props) {
  return (
    <View
      style={{
        height: 56,
        paddingVertical: 8,
        paddingHorizontal: 16,
        backgroundColor: colors.bg,
        borderBottomWidth: 1,
        borderBottomColor: colors.bgBorder,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
      }}
    >
      <Pressable
        onPress={onBack}
        accessibilityLabel="Retour"
        style={({ pressed }) => ({
          width: 40,
          height: 40,
          borderRadius: 12,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: pressed ? 'rgba(255,255,255,0.04)' : 'transparent',
        })}
      >
        <ChevronLeft size={22} color={colors.text} strokeWidth={1.75} />
      </Pressable>
      <Text
        style={{
          flex: 1,
          textAlign: 'center',
          fontSize: 17,
          fontFamily: fonts.sansSemiBold,
          color: colors.text,
          letterSpacing: -0.17,
        }}
      >
        {title}
      </Text>
      <View style={{ width: 40 }} />
    </View>
  );
}
