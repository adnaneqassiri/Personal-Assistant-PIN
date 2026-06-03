import { Pressable, Text, View } from 'react-native';
import { Menu, Plus } from 'lucide-react-native';
import { colors, fonts } from '@/constants/theme';

type Props = {
  title: string;
  onMenu: () => void;
  onPlus: () => void;
};

export function ChatHeader({ title, onMenu, onPlus }: Props) {
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
        gap: 12,
      }}
    >
      <Pressable
        onPress={onMenu}
        accessibilityLabel="Conversations"
        style={({ pressed }) => ({
          width: 40,
          height: 40,
          borderRadius: 12,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: pressed ? 'rgba(255,255,255,0.04)' : 'transparent',
        })}
      >
        <Menu size={22} color={colors.text} strokeWidth={1.75} />
      </Pressable>
      <Text
        numberOfLines={1}
        style={{
          flex: 1,
          textAlign: 'center',
          fontSize: 16,
          fontFamily: fonts.sansSemiBold,
          color: colors.text,
          letterSpacing: -0.16,
        }}
      >
        {title}
      </Text>
      <Pressable
        onPress={onPlus}
        accessibilityLabel="Nouvelle conversation"
        style={({ pressed }) => ({
          width: 40,
          height: 40,
          borderRadius: 12,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: pressed ? 'rgba(74,83,255,0.10)' : 'transparent',
        })}
      >
        <Plus size={22} color={colors.primary} strokeWidth={2} />
      </Pressable>
    </View>
  );
}
