import { Pressable, Text, View } from 'react-native';
import { BellOff, SearchX } from 'lucide-react-native';
import { colors, fonts } from '@/constants/theme';

export type EmptyVariant = 'first-day' | 'filter' | 'search';

type Props = {
  variant: EmptyVariant;
  query?: string;
  onResetFilters?: () => void;
};

export function AlertEmpty({ variant, query, onResetFilters }: Props) {
  const config = (() => {
    if (variant === 'first-day') {
      return {
        Icon: BellOff,
        title: 'Aucune alerte',
        body: "On t'enverra une notif dès qu'une situation l'exige.",
        cta: null as string | null,
      };
    }
    if (variant === 'filter') {
      return {
        Icon: SearchX,
        title: 'Rien dans cette catégorie',
        body: 'Essaie un autre filtre.',
        cta: 'Réinitialiser les filtres',
      };
    }
    return {
      Icon: SearchX,
      title: `Aucun résultat pour « ${query ?? ''} »`,
      body: "Essaie d'autres mots-clés.",
      cta: null,
    };
  })();

  const Ic = config.Icon;

  return (
    <View
      style={{
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
        paddingHorizontal: 32,
        paddingVertical: 40,
      }}
    >
      <Ic size={48} color={colors.textTertiary} strokeWidth={1.5} />
      <Text
        style={{
          fontSize: 17,
          fontFamily: fonts.sansSemiBold,
          color: colors.text,
          letterSpacing: -0.17,
          textAlign: 'center',
          marginTop: 4,
        }}
      >
        {config.title}
      </Text>
      <Text
        style={{
          fontSize: 14,
          fontFamily: fonts.sans,
          color: colors.textSecondary,
          textAlign: 'center',
          maxWidth: 260,
          lineHeight: 21,
        }}
      >
        {config.body}
      </Text>
      {config.cta && (
        <Pressable
          onPress={onResetFilters}
          hitSlop={8}
          style={{ marginTop: 8, paddingVertical: 8, paddingHorizontal: 12 }}
        >
          <Text
            style={{
              fontSize: 14,
              fontFamily: fonts.sansMedium,
              color: colors.primary,
            }}
          >
            {config.cta}
          </Text>
        </Pressable>
      )}
    </View>
  );
}
