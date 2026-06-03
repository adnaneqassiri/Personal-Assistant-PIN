import { useState } from 'react';
import { Platform, Pressable, TextInput, View, Text } from 'react-native';
import { ArrowUp, Plus, Square } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, fonts } from '@/constants/theme';

type Props = {
  disabled?: boolean;
  streaming?: boolean;
  onSend: (text: string) => void;
};

export function Composer({ disabled, streaming, onSend }: Props) {
  const insets = useSafeAreaInsets();
  const [value, setValue] = useState('');
  const [focused, setFocused] = useState(false);

  const isEmpty = value.trim().length === 0;
  const showCounter = value.length > 1800;
  const sendDisabled = isEmpty && !streaming;

  const submit = () => {
    if (sendDisabled) return;
    if (streaming) {
      onSend('__stop__');
      return;
    }
    onSend(value.trim());
    setValue('');
  };

  return (
    <View
      style={{
        backgroundColor: colors.bg,
        paddingTop: 8,
        paddingHorizontal: 12,
        paddingBottom: 12 + insets.bottom,
      }}
      pointerEvents={disabled ? 'none' : 'auto'}
    >
      {/* Top fade so the chat content seems to slide behind the composer */}
      <LinearGradient
        colors={['rgba(0,0,0,0)', colors.bg]}
        style={{
          position: 'absolute',
          top: -16,
          left: 0,
          right: 0,
          height: 24,
        }}
        pointerEvents="none"
      />

      <View
        style={{
          flexDirection: 'row',
          alignItems: 'flex-end',
          gap: 6,
          backgroundColor: colors.bgSurface,
          borderWidth: 1,
          borderColor: focused ? colors.primary : colors.bgBorder,
          borderRadius: 28,
          paddingLeft: 8,
          paddingRight: 8,
          paddingVertical: 8,
          minHeight: 56,
          shadowColor: focused ? colors.primary : '#000',
          shadowOffset: { width: 0, height: focused ? 6 : 2 },
          shadowOpacity: focused ? 0.22 : 0.45,
          shadowRadius: focused ? 18 : 10,
          elevation: focused ? 8 : 3,
          opacity: disabled ? 0.5 : 1,
        }}
      >
        <Pressable
          disabled
          accessibilityLabel="Pièce jointe"
          style={{
            width: 40,
            height: 40,
            borderRadius: 20,
            alignItems: 'center',
            justifyContent: 'center',
            opacity: 0.32,
          }}
        >
          <Plus size={20} color={colors.textSecondary} strokeWidth={1.75} />
        </Pressable>

        <View style={{ flex: 1, paddingTop: 6, paddingBottom: 6, paddingHorizontal: 4 }}>
          <TextInput
            value={value}
            onChangeText={setValue}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            placeholder="Pose ta question à ton coach"
            placeholderTextColor={colors.textTertiary}
            multiline
            maxLength={2000}
            editable={!disabled}
            style={{
              fontSize: 15,
              fontFamily: fonts.sans,
              color: colors.text,
              lineHeight: 22,
              maxHeight: 120,
              padding: 0,
              margin: 0,
              ...(Platform.OS === 'web' ? ({ outlineStyle: 'none' } as object) : {}),
            }}
          />
          {showCounter && (
            <Text
              style={{
                position: 'absolute',
                bottom: -4,
                right: 0,
                fontFamily: fonts.mono,
                fontSize: 10,
                color: colors.textTertiary,
                fontVariant: ['tabular-nums'],
              }}
            >
              {value.length} / 2000
            </Text>
          )}
        </View>

        <Pressable
          onPress={submit}
          disabled={sendDisabled}
          accessibilityLabel={streaming ? 'Stop' : 'Envoyer'}
          style={({ pressed }) => ({
            width: 40,
            height: 40,
            borderRadius: 20,
            alignItems: 'center',
            justifyContent: 'center',
            transform: [{ scale: pressed && !sendDisabled ? 0.92 : 1 }],
          })}
        >
          {sendDisabled ? (
            <View
              style={{
                width: 40,
                height: 40,
                borderRadius: 20,
                backgroundColor: colors.bgElevated,
                borderWidth: 1,
                borderColor: colors.bgBorder,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <ArrowUp size={18} color={colors.textTertiary} strokeWidth={2.5} />
            </View>
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
                shadowColor: colors.primary,
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.4,
                shadowRadius: 10,
                elevation: 6,
              }}
            >
              {streaming ? (
                <Square size={14} color="#FFFFFF" strokeWidth={2.5} fill="#FFFFFF" />
              ) : (
                <ArrowUp size={20} color="#FFFFFF" strokeWidth={2.5} />
              )}
            </LinearGradient>
          )}
        </Pressable>
      </View>
    </View>
  );
}
