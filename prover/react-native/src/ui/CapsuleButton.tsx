/**
 * Ported from Prism's components/Button/CapsuleButton.tsx.
 * Reanimated cross-fade and haptics dropped (bare RN, no reanimated here);
 * the resting visuals — gradient stops, border, shadows, icon circle — match.
 */
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';

type Variant = 'default' | 'primary' | 'danger';

/** Prism's LIGHT stops (it flips them per theme; this app is light). */
const gradientFor = (v: Variant): string[] => {
  switch (v) {
    case 'danger': return ['#ff5959', '#fc0606'];
    case 'primary': return ['#ffd4a3', '#ff6a00'];
    default: return ['#c7c7c7', '#ffffff'];
  }
};

export default function CapsuleButton({
  label, glyph, variant = 'default', height = 44, loading = false, disabled = false, onPress,
}: {
  label: string; glyph: string; variant?: Variant; height?: number;
  loading?: boolean; disabled?: boolean; onPress?: () => void;
}) {
  const isPrimary = variant === 'primary';
  const isDanger = variant === 'danger';
  const labelColor = isDanger || isPrimary ? '#ffffff' : '#434343';
  const circleBg = '#ffffff';
  const glyphColor = isDanger ? '#fc0606' : isPrimary ? '#FF6A00' : '#171717';
  const d = height - 12;

  return (
    <Pressable onPress={onPress} disabled={disabled || loading} style={{ width: '100%' }}>
      {({ pressed }) => (
        <View style={[s.capsule, { height }, (pressed || disabled) && { opacity: 0.6 }]}>
          <LinearGradient colors={gradientFor(variant)} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 1 }}
                          style={StyleSheet.absoluteFill} />
          <View style={[s.iconCircle, { width: d, height: d, backgroundColor: circleBg }]}>
            {loading ? <ActivityIndicator size="small" color={glyphColor} />
                     : <Text style={{ fontSize: d * 0.5, color: glyphColor }}>{glyph}</Text>}
          </View>
          <Text numberOfLines={1} style={[s.label, { color: labelColor,
            fontSize: label.length <= 14 ? 15 : label.length <= 17 ? 13 : 12 }]}>{label}</Text>
        </View>
      )}
    </Pressable>
  );
}

const s = StyleSheet.create({
  capsule: {
    flexDirection: 'row', alignItems: 'center', borderRadius: 40, overflow: 'hidden',
    borderWidth: 0.816, borderColor: '#fff', paddingHorizontal: 5,
    shadowColor: '#000', shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.16, shadowRadius: 10, elevation: 4,
  },
  iconCircle: {
    borderRadius: 29, alignItems: 'center', justifyContent: 'center', backgroundColor: '#ffffff',
    shadowColor: '#000', shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2, shadowRadius: 12, elevation: 3,
  },
  label: { flex: 1, textAlign: 'center', fontFamily: 'GoogleSansFlex-SemiBold' },
});
