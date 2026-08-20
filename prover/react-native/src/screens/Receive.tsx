/** Receive — address + QR, in Prism's card idiom. */
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { colors as C, font, radius, space } from '../theme';

export default function Receive({ address, registered, onBack, onCopy }: {
  address: string; registered: boolean; onBack: () => void; onCopy: () => void;
}) {
  return (
    <View style={{ flex: 1, backgroundColor: C.background }}>
      <View style={s.header}>
        <Pressable onPress={onBack} style={s.back} hitSlop={10}>
          <Text style={{ color: '#fff', fontSize: 20, lineHeight: 22 }}>‹</Text>
        </Pressable>
        <Text style={s.headerTitle}>Receive</Text>
        <View style={{ width: 32 }} />
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 32 }}>
        <View style={[s.card, { alignItems: 'center', paddingVertical: space.xxl }]}>
          {/* address is set async — QRCode throws "No input text" on an empty value */}
          <View style={[s.qrFrame, { width: 220, height: 220, alignItems: 'center', justifyContent: 'center' }]}>
            {address ? (
              <QRCode value={address} size={196} backgroundColor="#ffffff" color="#000000" />
            ) : (
              <ActivityIndicator color={C.textSecondary} />
            )}
          </View>
          <Text style={s.caption}>Scan to get this wallet's address</Text>
        </View>

        <View style={s.card}>
          <Text style={s.fieldLabel}>Your address</Text>
          <Text style={s.address}>{address || '…'}</Text>
          <Pressable onPress={onCopy} style={s.copy}>
            <Text style={s.copyText}>Copy address</Text>
          </Pressable>
        </View>

        <View style={[s.card, { backgroundColor: registered ? C.statusSuccessBg : C.statusFailedBg }]}>
          <Text style={[s.note, { color: registered ? C.statusSuccessFg : C.statusFailedFg }]}>
            {registered
              ? 'Registered with eERC. Senders can transfer to you confidentially — amounts stay encrypted on-chain.'
              : 'Not registered yet. Create a private account first, or transfers to you will be rejected.'}
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const s = {
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
            paddingHorizontal: space.lg, paddingTop: 64, paddingBottom: space.md } as const,
  back: { width: 32, height: 32, borderRadius: 999, backgroundColor: C.surfaceInverse,
          alignItems: 'center', justifyContent: 'center' } as const,
  headerTitle: { fontFamily: font.semibold, fontSize: 17, color: C.textPrimary } as const,
  card: { backgroundColor: C.card, borderRadius: radius.card, marginHorizontal: space.lg,
          marginTop: space.sm, padding: space.lg } as const,
  qrFrame: { backgroundColor: '#fff', padding: space.md, borderRadius: radius.inner } as const,
  caption: { fontFamily: font.regular, fontSize: 12.5, color: C.textSecondary,
             marginTop: space.md } as const,
  fieldLabel: { fontFamily: font.medium, fontSize: 12, color: C.contentMuted } as const,
  address: { fontFamily: font.regular, fontSize: 14, color: C.textPrimary, marginTop: 8,
             lineHeight: 21 } as const,
  copy: { backgroundColor: C.background, borderRadius: 999, paddingVertical: 12,
          alignItems: 'center', marginTop: space.lg } as const,
  copyText: { fontFamily: font.semibold, fontSize: 14, color: C.textPrimary } as const,
  note: { fontFamily: font.regular, fontSize: 12.5, lineHeight: 18 } as const,
};
