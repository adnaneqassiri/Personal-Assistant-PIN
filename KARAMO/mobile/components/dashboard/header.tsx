import { Pressable, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Image } from 'expo-image';
import { BellRing } from 'lucide-react-native';
import { colors, fonts } from '@/constants/theme';

type Props = {
  unread?: number;
  onBellPress?: () => void;
  initial?: string;
  greeting?: string;
  name?: string;
  picture?: string;
};

export function DashboardHeader({
  unread = 0,
  onBellPress,
  initial = 'K',
  greeting = 'Bonjour',
  name = 'Karamo',
  picture,
}: Props) {
  return (
    <View
      style={{
        height: 64,
        paddingHorizontal: 24,
        backgroundColor: colors.bg,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottomWidth: 1,
        borderBottomColor: colors.bgBorder,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, minWidth: 0, flex: 1 }}>
        {picture ? (
          <Image
            source={{ uri: picture }}
            style={{ width: 40, height: 40, borderRadius: 20 }}
            contentFit="cover"
            transition={150}
          />
        ) : (
          <LinearGradient
            colors={['#4A53FF', '#9D5CFF']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{
              width: 40,
              height: 40,
              borderRadius: 20,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Text
              style={{
                fontSize: 15,
                fontFamily: fonts.sansSemiBold,
                color: '#FFFFFF',
                letterSpacing: -0.15,
              }}
            >
              {initial}
            </Text>
          </LinearGradient>
        )}
        <View style={{ flexDirection: 'column', gap: 1, minWidth: 0, flex: 1 }}>
          <Text
            style={{
              fontSize: 11,
              fontFamily: fonts.sansMedium,
              color: colors.textTertiary,
              letterSpacing: 0.88,
              textTransform: 'uppercase',
              lineHeight: 13,
            }}
          >
            {greeting}
          </Text>
          <Text
            numberOfLines={1}
            style={{
              fontSize: 17,
              fontFamily: fonts.sansSemiBold,
              color: '#FFFFFF',
              letterSpacing: -0.17,
              lineHeight: 20,
            }}
          >
            {name}
          </Text>
        </View>
      </View>

      <Pressable
        onPress={onBellPress}
        accessibilityLabel="Notifications"
        style={({ pressed }) => ({
          width: 40,
          height: 40,
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: 12,
          backgroundColor: pressed ? colors.bgSurface : 'transparent',
        })}
      >
        <BellRing size={22} color={colors.text} strokeWidth={1.75} />
        {unread > 0 && (
          <View
            style={{
              position: 'absolute',
              top: -2,
              right: -2,
              minWidth: 16,
              height: 16,
              paddingHorizontal: 5,
              borderRadius: 9999,
              backgroundColor: colors.error,
              borderWidth: 2,
              borderColor: colors.bg,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Text
              style={{
                fontSize: 10,
                fontFamily: fonts.sansBold,
                color: '#FFFFFF',
                fontVariant: ['tabular-nums'],
                lineHeight: 12,
              }}
            >
              {unread}
            </Text>
          </View>
        )}
      </Pressable>
    </View>
  );
}
