import { Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BellRing, LayoutDashboard, MessageCircle, User } from 'lucide-react-native';
import { colors, fonts } from '@/constants/theme';
import type { TabId } from '@/constants/dashboard-mock';

type Props = {
  active: TabId;
  unread?: number;
  onTabPress?: (id: TabId) => void;
};

const TABS: { id: TabId; icon: typeof LayoutDashboard; label: string }[] = [
  { id: 'home',    icon: LayoutDashboard, label: 'Accueil' },
  { id: 'alerts',  icon: BellRing,        label: 'Alertes' },
  { id: 'chat',    icon: MessageCircle,   label: 'Coach' },
  { id: 'profile', icon: User,            label: 'Profil' },
];

export function TabBar({ active, unread = 0, onTabPress }: Props) {
  const insets = useSafeAreaInsets();

  return (
    <View
      style={{
        flexDirection: 'row',
        height: 64 + insets.bottom,
        paddingBottom: insets.bottom,
        backgroundColor: colors.bgSurface,
        borderTopWidth: 1,
        borderTopColor: colors.bgBorder,
      }}
    >
      {TABS.map(tab => {
        const Ic = tab.icon;
        const isActive = active === tab.id;
        const showBadge = tab.id === 'alerts' && unread > 0;

        return (
          <Pressable
            key={tab.id}
            onPress={() => onTabPress?.(tab.id)}
            accessibilityRole="tab"
            accessibilityState={{ selected: isActive }}
            style={{
              flex: 1,
              alignItems: 'center',
              justifyContent: 'center',
              paddingVertical: 8,
              paddingHorizontal: 4,
              gap: 4,
              position: 'relative',
            }}
          >
            {isActive && (
              <View
                style={{
                  position: 'absolute',
                  top: 0,
                  width: 24,
                  height: 3,
                  borderBottomLeftRadius: 3,
                  borderBottomRightRadius: 3,
                  backgroundColor: colors.primary,
                }}
              />
            )}
            <View>
              <Ic
                size={22}
                color={isActive ? colors.primary : colors.textTertiary}
                strokeWidth={1.75}
              />
              {showBadge && (
                <View
                  style={{
                    position: 'absolute',
                    top: -6,
                    right: -10,
                    minWidth: 16,
                    height: 16,
                    paddingHorizontal: 5,
                    borderRadius: 9999,
                    backgroundColor: colors.error,
                    borderWidth: 2,
                    borderColor: colors.bgSurface,
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
            </View>
            <Text
              style={{
                fontSize: 11,
                fontFamily: fonts.sansMedium,
                color: isActive ? colors.primary : colors.textTertiary,
                letterSpacing: 0.11,
              }}
            >
              {tab.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
