import { Platform, Pressable, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Image } from 'expo-image';
import { colors, fonts } from '@/constants/theme';
import { USER } from '@/constants/profile-mock';
import { useAuth } from '@/lib/auth-context';

export function UserCard() {
  const { user } = useAuth();

  const name = user?.name ?? USER.name;
  const email = user?.email ?? USER.email;
  const initials = user?.initials ?? USER.initials;
  const picture = user?.picture;

  return (
    <View
      style={{
        paddingTop: 32,
        paddingHorizontal: 24,
        paddingBottom: 8,
        alignItems: 'center',
      }}
    >
      <View
        style={Platform.select({
          ios: {
            shadowColor: '#4A53FF',
            shadowOffset: { width: 0, height: 8 },
            shadowOpacity: 0.32,
            shadowRadius: 24,
          },
          android: { elevation: 8 },
          default: {},
        })}
      >
        {picture ? (
          <Image
            source={{ uri: picture }}
            style={{ width: 96, height: 96, borderRadius: 48 }}
            contentFit="cover"
            transition={150}
          />
        ) : (
          <LinearGradient
            colors={['#4A53FF', '#41FF31']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{
              width: 96,
              height: 96,
              borderRadius: 48,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Text
              style={{
                fontSize: 36,
                fontFamily: fonts.sansBold,
                color: '#FFFFFF',
                letterSpacing: -0.72,
              }}
            >
              {initials}
            </Text>
          </LinearGradient>
        )}
      </View>
      <Text
        style={{
          fontSize: 22,
          fontFamily: fonts.sansSemiBold,
          color: colors.text,
          letterSpacing: -0.22,
          marginTop: 16,
        }}
      >
        {name}
      </Text>
      <Text
        style={{
          fontSize: 14,
          fontFamily: fonts.sans,
          color: colors.textSecondary,
          marginTop: 4,
        }}
      >
        {email}
      </Text>
      <Pressable
        disabled
        style={{
          marginTop: 12,
          paddingVertical: 8,
          paddingHorizontal: 12,
          opacity: 0.4,
        }}
      >
        <Text
          style={{
            fontSize: 13,
            fontFamily: fonts.sansMedium,
            color: colors.primary,
          }}
        >
          Modifier le profil
        </Text>
      </Pressable>
    </View>
  );
}
