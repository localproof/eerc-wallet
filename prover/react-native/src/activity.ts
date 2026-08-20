/**
 * Activity entries — what the user did, not how it was done.
 * Progress lines ("proving…", "approving…") belong in the BusyModal; this is history.
 */
export type ActivityKind = 'send' | 'faucet' | 'register';

export interface Activity {
  kind: ActivityKind;
  title: string;
  /** counterparty / context line */
  sub: string;
  /** signed amount, e.g. '-12.34 cUSDC'; omitted for register */
  amount?: string;
  hash?: string;
  ts: number;
  failed?: boolean;
}

export const shortAddr = (a: string) => `${a.slice(0, 6)}…${a.slice(-4)}`;

export const dayLabel = (ts: number) =>
  new Date(ts).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });

export const timeLabel = (ts: number) =>
  new Date(ts).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });

/** Groups entries under date headers, newest first. */
export const groupByDay = (items: Activity[]): [string, Activity[]][] => {
  const out: [string, Activity[]][] = [];
  for (const it of items) {
    const key = dayLabel(it.ts);
    const last = out[out.length - 1];
    if (last && last[0] === key) last[1].push(it);
    else out.push([key, [it]]);
  }
  return out;
};
