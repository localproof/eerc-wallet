/** Send — mirrors Prism's on-chain-send.tsx: bg-background, rounded-[24px] cards, pill fields. */
import { useState } from 'react';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import CapsuleButton from '../ui/CapsuleButton';
import { colors as C, font, radius, space } from '../theme';
import { CONFIG } from '../config';

export default function Send({ balance, busy, ready, onBack, onSend }: {
  balance: string; busy: string | null; ready: boolean;
  onBack: () => void; onSend: (to: string, amount: string) => void;
}) {
  const [to, setTo] = useState('');
  const [amount, setAmount] = useState('');
  const num = Number(amount || 0);
  const max = Number(balance === '—' ? 0 : balance);
  const over = num > max;
  const valid = /^0x[a-fA-F0-9]{40}$/.test(to.trim()) && num > 0 && !over;

  return (
    <View style={{ flex: 1, backgroundColor: C.background }}>
      <View style={s.header}>
        <Pressable onPress={onBack} style={s.back} hitSlop={10}>
          <Text style={{ color: '#fff', fontSize: 20, lineHeight: 22 }}>‹</Text>
        </Pressable>
        <Text style={s.headerTitle}>Send privately</Text>
        <View style={{ width: 32 }} />
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 32 }} keyboardShouldPersistTaps="handled">
        <View style={s.card}>
          <Text style={s.fieldLabel}>To</Text>
          <TextInput style={s.field} placeholder="0x…" placeholderTextColor={C.contentMuted}
                     autoCapitalize="none" autoCorrect={false} value={to} onChangeText={setTo} />
        </View>

        <View style={s.card}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text style={s.fieldLabel}>Amount</Text>
            <Pressable onPress={() => setAmount(String(max))} style={s.pill}>
              <Text style={s.pillText}>Max {balance}</Text>
            </Pressable>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 8 }}>
            <TextInput style={s.amount} placeholder="0.00" placeholderTextColor={C.contentMuted}
                       keyboardType="decimal-pad" value={amount} onChangeText={setAmount} />
            <Text style={s.amountUnit}>{CONFIG.confidentialSymbol}</Text>
          </View>
          {over && <Text style={s.error}>More than your balance</Text>}
        </View>

        <View style={[s.card, { backgroundColor: 'transparent', paddingVertical: 0 }]}>
          <Text style={s.note}>
            The amount and both balances stay encrypted on-chain. The proof is generated
            on this device — your key never leaves the phone.
          </Text>
        </View>

        <View style={{ paddingHorizontal: space.lg, marginTop: space.sm }}>
          <CapsuleButton
            label={busy === 'send' ? 'Proving…' : over ? 'Not enough balance' : 'Prove & send'}
            glyph="↗" variant={over ? 'danger' : 'primary'} height={52}
            loading={busy === 'send'} disabled={!valid || !ready || !!busy}
            onPress={() => onSend(to.trim(), amount.trim())} />
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
  fieldLabel: { fontFamily: font.medium, fontSize: 12, color: C.contentMuted,
                letterSpacing: -0.2 } as const,
  field: { fontFamily: font.regular, fontSize: 16, color: C.textPrimary, padding: 0,
           marginTop: 6 } as const,
  amount: { flex: 1, fontFamily: font.semibold, fontSize: 34, color: C.textPrimary, padding: 0,
            marginTop: 4, letterSpacing: -1 } as const,
  amountUnit: { fontFamily: font.medium, fontSize: 15, color: C.textSecondary } as const,
  pill: { backgroundColor: C.pillNeutralBg, borderRadius: 30, paddingHorizontal: 10,
          paddingVertical: 4 } as const,
  pillText: { fontFamily: font.medium, fontSize: 12, color: C.textPrimary } as const,
  error: { fontFamily: font.regular, fontSize: 12, color: C.destructive, marginTop: 6 } as const,
  note: { fontFamily: font.regular, fontSize: 12.5, color: C.textSecondary, lineHeight: 18,
          paddingHorizontal: 4, marginTop: space.md } as const,
};
