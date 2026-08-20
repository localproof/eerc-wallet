/**
 * Wallet dashboard — Core-wallet LAYOUT (left-aligned balance, 4 action tiles,
 * tab bar, list rows) rendered in PRISM's design language (light #F2F2F2 ground,
 * white rounded-24 cards, brand orange, GoogleSansFlex).
 */
import { useState } from 'react';
import { ActivityIndicator, Linking, Pressable, ScrollView, Text, View } from 'react-native';
import { colors as C, font, radius, space } from '../theme';
import { CONFIG } from '../config';
import { groupByDay, timeLabel, type Activity } from '../activity';

type Tab = 'assets' | 'activity';

export default function Wallet({
  address, balance, consistent, pub, gas, registered, busy,
  onReceive, onSend, onFaucet, onRegister, onRefresh, onCopy, activity,
}: {
  address: string; balance: string; consistent: boolean; pub: string; gas: string;
  registered: boolean; ready: boolean; busy: string | null;
  onReceive: () => void; onSend: () => void; onFaucet: () => void;
  onRegister: () => void; onRefresh: () => void; onCopy: () => void; activity: Activity[];
}) {
  const [tab, setTab] = useState<Tab>('assets');

  return (
    <ScrollView style={{ flex: 1, backgroundColor: C.background }}
                contentContainerStyle={{ paddingBottom: 40 }}>

      {/* header */}
      <View style={{ paddingTop: 64, paddingHorizontal: space.lg }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Text style={{ fontFamily: font.extrabold, fontSize: 24, color: C.textPrimary,
                           letterSpacing: -0.4 }}>
              Private
            </Text>
            <Text style={{ fontSize: 13, color: C.textSecondary }}>▾</Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Pressable onPress={onRefresh} disabled={!!busy} hitSlop={8}
                       style={({ pressed }) => [{ width: 34, height: 34, borderRadius: 999,
                         backgroundColor: C.headerButton ?? C.pillNeutralBg,
                         alignItems: 'center', justifyContent: 'center' },
                         (pressed || !!busy) && { opacity: 0.5 }]}>
              {busy ? <ActivityIndicator size="small" color={C.textSecondary} />
                    : <Text style={{ fontSize: 15, color: C.textPrimary }}>↻</Text>}
            </Pressable>
          </View>
        </View>

      </View>

      {/* balance — left aligned */}
      <View style={{ paddingHorizontal: space.lg, marginTop: space.xl }}>
        <View style={{ flexDirection: 'row', alignSelf: 'stretch', alignItems: 'flex-end' }}>
          <Text style={{ fontFamily: font.extrabold, fontSize: 46, lineHeight: 54,
                         color: C.textPrimary, letterSpacing: -1.5 }}>
            {balance}
          </Text>
          <Text style={{ fontFamily: font.semibold, fontSize: 24, lineHeight: 42,
                         color: C.textSecondary, marginLeft: 8 }}>
            {CONFIG.confidentialSymbol}
          </Text>
        </View>
        {/* only surface a status line when something needs attention */}
        {(!registered || !consistent) && (
          <Text style={{ fontFamily: font.regular, fontSize: 14, color: C.destructive, marginTop: 2 }}>
            {!registered ? 'No private account yet' : 'Balance inconsistent — refresh'}
          </Text>
        )}
      </View>

      {/* action tiles — Prism cards, brand orange for the primary action */}
      <View style={{ flexDirection: 'row', gap: 8, paddingHorizontal: space.lg, marginTop: space.xl }}>
        {registered ? (
          <>
            <Tile glyph="↓" label="Receive" onPress={onReceive} />
            <Tile glyph="↗" label="Send" onPress={onSend} primary />
            <Tile glyph="≡" label="Faucet" onPress={onFaucet} busy={busy === 'faucet'} />
          </>
        ) : (
          <>
            <Tile glyph="✦" label="Create" onPress={onRegister} primary busy={busy === 'register'} />
            <Tile glyph="↓" label="Receive" onPress={onReceive} />
            <Tile glyph="⧉" label="Copy" onPress={onCopy} />
          </>
        )}
      </View>

      {/* tabs */}
      <View style={{ flexDirection: 'row', gap: space.xl, paddingHorizontal: space.lg,
                     marginTop: space.xxl }}>
        {(['assets', 'activity'] as Tab[]).map((t) => (
          <Pressable key={t} onPress={() => setTab(t)}>
            <Text style={{ fontFamily: tab === t ? font.semibold : font.regular, fontSize: 17,
                           color: tab === t ? C.textPrimary : C.contentMuted }}>
              {t === 'assets' ? 'Assets' : 'Activity'}
            </Text>
            <View style={{ height: 2.5, borderRadius: 2, marginTop: 8,
                           backgroundColor: tab === t ? C.textPrimary : 'transparent' }} />
          </Pressable>
        ))}
      </View>

      {/* content — Prism list card */}
      {/* network context sits with the assets it describes, not in the header */}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7, alignSelf: 'flex-start',
                     marginHorizontal: space.lg, marginTop: space.lg,
                     backgroundColor: C.card, borderRadius: radius.pill,
                     paddingHorizontal: 12, paddingVertical: 7 }}>
        <View style={{ width: 7, height: 7, borderRadius: 999,
                       backgroundColor: registered ? C.success : C.contentMuted }} />
        <Text style={{ fontFamily: font.medium, fontSize: 12.5, color: C.textTertiary }}>
          Avalanche Fuji C-Chain
        </Text>
      </View>

      <View style={{ marginHorizontal: space.lg, marginTop: space.sm, backgroundColor: C.card,
                     borderRadius: radius.card, overflow: 'hidden' }}>
        {tab === 'assets' ? (
          <>
            <Row title={`Confidential ${CONFIG.tokenSymbol}`} sub="encrypted balance"
                 value={balance} unit={CONFIG.confidentialSymbol} accent />
            <Row title={`Public ${CONFIG.tokenSymbol}`} sub="visible on-chain"
                 value={pub} unit={CONFIG.tokenSymbol} />
            <Row title="AVAX" sub="gas" value={gas === '—' ? gas : Number(gas).toFixed(4)}
                 unit="AVAX" last />
          </>
        ) : activity.length === 0 ? (
          <View style={{ padding: space.xl, alignItems: 'center' }}>
            <Text style={{ fontFamily: font.regular, fontSize: 14, color: C.textSecondary }}>
              No activity yet.
            </Text>
          </View>
        ) : (
          groupByDay(activity).map(([day, items]) => (
            <View key={day}>
              <Text style={{ fontFamily: font.medium, fontSize: 12, color: C.contentMuted,
                             paddingHorizontal: space.lg, paddingTop: space.md, paddingBottom: 4 }}>
                {day}
              </Text>
              {items.map((it, i) => {
                const url = it.hash ? `${CONFIG.explorer}/tx/${it.hash}` : null;
                return (
                  <Pressable key={`${it.ts}-${i}`} disabled={!url}
                             onPress={() => url && Linking.openURL(url)}
                             style={({ pressed }) => [{ flexDirection: 'row', alignItems: 'center',
                               gap: 12, paddingHorizontal: space.lg, paddingVertical: 14,
                               borderTopWidth: 1, borderTopColor: C.divider },
                               pressed && { backgroundColor: C.cardActive }]}>
                    <View style={{ width: 38, height: 38, borderRadius: 999,
                                   backgroundColor: it.failed ? C.failedLight
                                     : it.kind === 'send' ? C.background : C.successLight,
                                   alignItems: 'center', justifyContent: 'center' }}>
                      <Text style={{ fontSize: 15, color: it.failed ? C.destructive
                                       : it.kind === 'send' ? C.textSecondary : C.success }}>
                        {it.failed ? '!' : it.kind === 'send' ? '↗' : '↓'}
                      </Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontFamily: font.medium, fontSize: 15,
                                     color: it.failed ? C.destructive : C.textPrimary }}>
                        {it.failed ? `${it.title} failed` : it.title}
                      </Text>
                      <Text numberOfLines={1} style={{ fontFamily: font.regular, fontSize: 12.5,
                                     color: C.textSecondary, marginTop: 2 }}>
                        {it.sub} · {timeLabel(it.ts)}
                      </Text>
                    </View>
                    {it.amount && !it.failed && (
                      <Text style={{ fontFamily: font.semibold, fontSize: 14.5,
                                     color: it.kind === 'send' ? C.textPrimary : C.success }}>
                        {it.amount}
                      </Text>
                    )}
                    {url && <Text style={{ fontSize: 15, color: C.contentMuted, marginLeft: 6 }}>›</Text>}
                  </Pressable>
                );
              })}
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );
}

const Tile = ({ glyph, label, onPress, primary, busy }: {
  glyph: string; label: string; onPress: () => void; primary?: boolean; busy?: boolean;
}) => (
  <Pressable onPress={onPress} disabled={busy}
             style={({ pressed }) => [{
               flex: 1, backgroundColor: primary ? C.brand : C.card, borderRadius: 18,
               paddingVertical: 15, alignItems: 'center', gap: 7,
             }, (pressed || busy) && { opacity: 0.6 }]}>
    <Text style={{ fontSize: 19, color: primary ? C.textOnPrimary : C.textPrimary }}>{glyph}</Text>
    <Text style={{ fontFamily: font.medium, fontSize: 13,
                   color: primary ? C.textOnPrimary : C.textPrimary }}>
      {busy ? '…' : label}
    </Text>
  </Pressable>
);

const Row = ({ title, sub, value, unit, accent, last }: {
  title: string; sub: string; value: string; unit: string; accent?: boolean; last?: boolean;
}) => (
  <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: space.lg,
                 paddingVertical: 15, borderBottomWidth: last ? 0 : 1, borderBottomColor: C.divider }}>
    <View style={{ width: 38, height: 38, borderRadius: 999, marginRight: 12,
                   backgroundColor: accent ? '#FFE9DC' : C.background,
                   alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{ fontSize: 15, color: accent ? C.brand : C.textSecondary }}>
        {accent ? '◆' : '◇'}
      </Text>
    </View>
    <View style={{ flex: 1 }}>
      <Text style={{ fontFamily: font.medium, fontSize: 15.5, color: C.textPrimary }}>{title}</Text>
      <Text style={{ fontFamily: font.regular, fontSize: 12.5, color: C.textSecondary, marginTop: 2 }}>
        {sub}
      </Text>
    </View>
    <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 5 }}>
      <Text style={{ fontFamily: font.semibold, fontSize: 15.5, color: C.textPrimary }}>{value}</Text>
      <Text style={{ fontFamily: font.regular, fontSize: 12, color: C.textSecondary }}>{unit}</Text>
    </View>
  </View>
);
