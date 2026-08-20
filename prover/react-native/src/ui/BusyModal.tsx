/**
 * Blocking progress modal. Every eERC action here is multi-step and slow
 * (on-device proving + one or more Fuji txs), so the user gets told what is
 * happening rather than watching a frozen button.
 */
import { ActivityIndicator, Modal, Text, View } from 'react-native';
import { colors as C, font, radius, space } from '../theme';

const TITLES: Record<string, string> = {
  register: 'Creating private account',
  faucet: 'Getting test funds',
  send: 'Sending privately',
  refresh: 'Refreshing',
};

export default function BusyModal({ busy, step }: { busy: string | null; step: string | null }) {
  return (
    <Modal visible={!!busy} transparent animationType="fade" statusBarTranslucent>
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.35)',
                     alignItems: 'center', justifyContent: 'center', padding: space.xl }}>
        <View style={{ width: '100%', maxWidth: 320, backgroundColor: C.card,
                       borderRadius: radius.card, padding: space.xl, alignItems: 'center' }}>
          <ActivityIndicator size="large" color={C.brand} />
          <Text style={{ fontFamily: font.semibold, fontSize: 17, color: C.textPrimary,
                         marginTop: space.lg, textAlign: 'center' }}>
            {TITLES[busy ?? ''] ?? 'Working'}
          </Text>
          <Text numberOfLines={2} style={{ fontFamily: font.regular, fontSize: 13.5,
                       color: C.textSecondary, marginTop: 6, textAlign: 'center', lineHeight: 19 }}>
            {step ?? 'Please wait…'}
          </Text>
          {busy === 'send' && (
            <Text style={{ fontFamily: font.regular, fontSize: 12, color: C.contentMuted,
                           marginTop: space.md, textAlign: 'center' }}>
              The proof is generated on this device.
            </Text>
          )}
        </View>
      </View>
    </Modal>
  );
}
