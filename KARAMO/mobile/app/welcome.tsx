import { useRef, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Eye, BellRing, Sparkles } from 'lucide-react-native';
import { CoachLogo } from '@/components/coach-logo';
import { ScreenFrame } from '@/components/screen-frame';
import { Btn, LinkBtn } from '@/components/btn';
import { colors, radius, space, type } from '@/constants/theme';

const FEATURES = [
  {
    Ic: Eye,
    color: '#4A53FF',
    t: 'Il observe',
    b: 'Le boîtier capte vision, audio et localisation en continu.',
  },
  {
    Ic: BellRing,
    color: '#FF3B5C',
    t: 'Il alerte',
    b: "Tu reçois une notification dès qu'une situation l'exige.",
  },
  {
    Ic: Sparkles,
    color: '#9D5CFF',
    t: 'Il répond',
    b: "Pose-lui n'importe quelle question sur ta journée.",
  },
];

const CARD_W = 240;
const CARD_GAP = 12;

export default function Welcome() {
  const [active, setActive] = useState(0);
  const trackRef = useRef<ScrollView>(null);

  return (
    <ScreenFrame>
      <View style={{ height: 48 }} />
      <CoachLogo size={56} />
      <View style={{ height: 40 }} />
      <Text style={{ ...type.h1, fontSize: 30, color: colors.text }}>
        {'Ton coach personnel,\n'}
        <Text style={{ color: colors.primary }}>qui te voit vraiment.</Text>
      </Text>
      <View style={{ height: 16 }} />
      <Text style={{ ...type.bodyLarge, fontSize: 16, color: colors.textSecondary }}>
        {"L'assistant qui observe ton environnement, détecte les bons moments d'agir, et répond à tes questions sur ta journée."}
      </Text>
      <View style={{ flex: 1, minHeight: 16 }} />
      <View style={{ marginHorizontal: -24 }}>
        <ScrollView
          ref={trackRef}
          horizontal
          showsHorizontalScrollIndicator={false}
          decelerationRate="fast"
          snapToInterval={CARD_W + CARD_GAP}
          snapToAlignment="start"
          contentContainerStyle={{ paddingHorizontal: 24, gap: CARD_GAP, paddingVertical: 4 }}
          onScroll={(e) => {
            const i = Math.round(e.nativeEvent.contentOffset.x / (CARD_W + CARD_GAP));
            setActive(Math.min(2, Math.max(0, i)));
          }}
          scrollEventThrottle={16}
        >
          {FEATURES.map((f, i) => (
            <View
              key={i}
              style={{
                width: CARD_W,
                height: 156,
                backgroundColor: colors.bgSurface,
                borderWidth: 1,
                borderColor: colors.bgBorder,
                borderRadius: radius.lg,
                padding: 18,
                gap: 10,
              }}
            >
              <f.Ic size={28} color={f.color} strokeWidth={1.5} />
              <Text style={{ ...type.h3, fontSize: 17, color: colors.text }}>{f.t}</Text>
              <Text style={{ ...type.bodySmall, color: colors.textSecondary, marginTop: 'auto' }}>
                {f.b}
              </Text>
            </View>
          ))}
        </ScrollView>
        <View style={{ flexDirection: 'row', gap: 8, justifyContent: 'center', marginTop: 16 }}>
          {FEATURES.map((_, i) => (
            <View
              key={i}
              style={{
                width: i === active ? 18 : 6,
                height: 6,
                borderRadius: 3,
                backgroundColor: i === active ? colors.primary : colors.bgBorder,
              }}
            />
          ))}
        </View>
      </View>
      <View style={{ height: space.s5 }} />
      <Btn onPress={() => router.push('/login')}>Commencer</Btn>
      <View style={{ height: space.s2 }} />
      <LinkBtn onPress={() => router.push('/login')}>{"J'ai déjà un compte"}</LinkBtn>
    </ScreenFrame>
  );
}
