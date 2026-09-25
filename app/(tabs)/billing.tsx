// Billing tab: credits, adding funds, top-ups and receipts, all from api.ilm.red.
//
// Adding funds:
//   Android: the full Zelle flow in the app (amount, billing agreement, QR code, "I've sent it").
//   iOS:     a link to Premium > Billing on ilm.red. App Store rules require in-app purchase for
//            digital credits bought inside an iOS app; linking out to the website is allowed.

import React from "react";
import {
  View, Text, ScrollView, TouchableOpacity, RefreshControl, StyleSheet, ActivityIndicator, Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { CreditCard, ExternalLink, KeyRound, Receipt, Wallet, AlertCircle } from "lucide-react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";
import * as WebBrowser from "expo-web-browser";

import { useTheme } from "@/providers/ThemeProvider";
import type { ThemeColors } from "@/constants/colors";
import { ILM_WEB_URL } from "@/constants/config";
import {
  dollars, formatDollars, topUpStatusLabel,
  useCreditAccount, useMyApiKeys, useMyPaymentReceipt, useMyPayments, useMyTopUps, usePaymentMethods, useRefreshBilling,
  type CreditAccount, type MyApiKey, type MyPayment, type TopUp,
} from "@/hooks/useBilling";
import { ZelleTopUp } from "@/components/billing/ZelleTopUp";

const openWebBilling = () => WebBrowser.openBrowserAsync(`${ILM_WEB_URL}/premium`);
const openWebKeys = () => WebBrowser.openBrowserAsync(`${ILM_WEB_URL}/developers/keys`);

function BalanceCard({ account, colors }: { account: CreditAccount; colors: ThemeColors }) {
  const pctLeft = account.monthlyLimit > 0 ? Math.max(0, Math.min(100, (account.allowanceLeft / account.monthlyLimit) * 100)) : 0;
  return (
    <Animated.View entering={FadeInDown.duration(400)}>
      <LinearGradient colors={[colors.primary, "#7C3AED"]} style={styles.balanceCard} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
        <View style={styles.balanceIcon}><CreditCard size={22} color="#FFF" /></View>
        <Text style={styles.balanceLabel}>You can spend</Text>
        <Text style={styles.balanceAmount}>{formatDollars(account.spendable)}</Text>
        <View style={styles.meterTrack}><View style={[styles.meterFill, { width: `${pctLeft}%` }]} /></View>
        <Text style={styles.balanceSub}>
          {formatDollars(account.allowanceLeft)} of {formatDollars(account.monthlyLimit)} monthly allowance left
        </Text>
        {account.purchased > 0 && <Text style={styles.balanceSub}>plus {formatDollars(account.purchased)} you added</Text>}
        {account.locked > 0 && <Text style={styles.balanceSub}>{formatDollars(account.locked)} held for a refund request</Text>}
        {account.periodEnd && (
          <Text style={styles.balanceSub}>Allowance resets {new Date(account.periodEnd).toLocaleDateString()}</Text>
        )}
      </LinearGradient>
    </Animated.View>
  );
}

function Section({ title, children, colors }: { title: string; children: React.ReactNode; colors: ThemeColors }) {
  return (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { color: colors.foreground }]}>{title}</Text>
      {children}
    </View>
  );
}

function AddFunds({ colors, agreementRequired }: { colors: ThemeColors; agreementRequired: boolean }) {
  const methods = usePaymentMethods();
  const topUps = useMyTopUps();

  if (Platform.OS === "ios") {
    return (
      <TouchableOpacity style={[styles.linkCard, { backgroundColor: colors.card, borderColor: colors.border }]} onPress={openWebBilling}>
        <Wallet size={20} color={colors.primary} />
        <View style={{ flex: 1 }}>
          <Text style={[styles.linkTitle, { color: colors.foreground }]}>Add funds on ilm.red</Text>
          <Text style={{ color: colors.muted, fontSize: 13 }}>Opens Premium › Billing in your browser.</Text>
        </View>
        <ExternalLink size={16} color={colors.muted} />
      </TouchableOpacity>
    );
  }

  if (methods.isLoading || topUps.isLoading) return <ActivityIndicator color={colors.primary} />;
  const zelle = methods.data?.methods.find((m) => m.method === "zelle");
  if (!zelle) {
    return (
      <View style={[styles.linkCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <AlertCircle size={20} color={colors.muted} />
        <Text style={{ color: colors.muted, flex: 1 }}>Adding funds is not open yet. We will let you know when it is.</Text>
      </View>
    );
  }
  const required = Boolean(methods.data?.billing_agreement?.required ?? agreementRequired);
  return <ZelleTopUp method={zelle} topUps={topUps.data ?? []} agreementRequired={required} colors={colors} />;
}

function TopUpRow({ t, colors }: { t: TopUp; colors: ThemeColors }) {
  const bad = t.status === "rejected" || t.status === "failed";
  return (
    <View style={[styles.row, { borderColor: colors.border }]}>
      <View style={{ flex: 1 }}>
        <Text style={[styles.rowTitle, { color: colors.foreground }]}>${dollars(t.amount)} · {t.reference}</Text>
        <Text style={{ color: colors.muted, fontSize: 12 }}>{new Date(t.created_at).toLocaleDateString()}</Text>
        {t.decision_reason && bad ? <Text style={{ color: colors.destructive, fontSize: 12 }}>{t.decision_reason}</Text> : null}
      </View>
      <View style={{ alignItems: "flex-end" }}>
        <Text style={{ color: bad ? colors.destructive : t.status === "completed" ? colors.success : colors.muted, fontSize: 12, fontWeight: "600" }}>
          {topUpStatusLabel(t.status)}
        </Text>
        {t.status === "completed" && <Text style={{ color: colors.foreground, fontSize: 13 }}>{t.credits.toFixed(2)} credits</Text>}
      </View>
    </View>
  );
}

/** A receipt row; tap to see the receipt with its tax lines (getMyPayment). */
function PaymentRow({ p, colors }: { p: MyPayment; colors: ThemeColors }) {
  const [open, setOpen] = React.useState(false);
  const receipt = useMyPaymentReceipt(p.id, open);
  const r = receipt.data;
  return (
    <TouchableOpacity
      onPress={() => setOpen((v) => !v)}
      accessibilityRole="button"
      accessibilityState={{ expanded: open }}
      style={[styles.rowWrap, { borderColor: colors.border }]}
    >
      <View style={styles.rowInner}>
        <Receipt size={18} color={colors.muted} />
        <View style={{ flex: 1 }}>
          <Text style={[styles.rowTitle, { color: colors.foreground }]}>${dollars(p.amount)} · {p.provider}</Text>
          <Text style={{ color: colors.muted, fontSize: 12 }}>{new Date(p.created_at).toLocaleDateString()} · {p.status}</Text>
        </View>
        <Text style={{ color: colors.foreground, fontSize: 13 }}>{Number(p.credits_granted).toFixed(2)} credits</Text>
      </View>
      {open && (
        <View style={styles.receipt}>
          {receipt.isLoading || !r ? <ActivityIndicator size="small" color={colors.primary} /> : (
            <>
              <View style={styles.rl}><Text style={{ color: colors.foreground }}>Paid</Text><Text style={{ color: colors.foreground }}>${dollars(r.gross)}</Text></View>
              <View style={styles.rl}><Text style={{ color: colors.muted }}>Sales tax</Text><Text style={{ color: colors.muted }}>-${dollars(r.tax)}</Text></View>
              {(r.tax_lines ?? []).map((l) => (
                <View key={l.code} style={[styles.rl, { paddingLeft: 12 }]}>
                  <Text style={{ color: colors.muted, fontSize: 12 }}>{l.label} {Math.round(l.rate * 100000) / 1000}%</Text>
                  <Text style={{ color: colors.muted, fontSize: 12 }}>${dollars(l.amount)}</Text>
                </View>
              ))}
              <View style={styles.rl}><Text style={{ color: colors.foreground, fontWeight: "700" }}>Credits added</Text><Text style={{ color: colors.foreground, fontWeight: "700" }}>{Number(r.credited).toFixed(2)}</Text></View>
              <Text style={{ color: colors.muted, fontSize: 12, marginTop: 4 }}>Sold by saMas IT Services{r.confirmation ? ` · ${r.confirmation}` : ""}</Text>
            </>
          )}
        </View>
      )}
    </TouchableOpacity>
  );
}

function ApiKeyRow({ k, colors }: { k: MyApiKey; colors: ThemeColors }) {
  return (
    <View style={[styles.row, { borderColor: colors.border }]}>
      <KeyRound size={18} color={colors.muted} />
      <View style={{ flex: 1 }}>
        <Text style={[styles.rowTitle, { color: colors.foreground }]}>{k.name}</Text>
        <Text style={{ color: colors.muted, fontSize: 12 }}>
          {k.prefix}…{k.club_name ? ` · ${k.club_name}` : ""} · {k.requests_30d ?? 0} requests in 30 days
        </Text>
      </View>
      <View style={{ alignItems: "flex-end" }}>
        <Text style={{ color: colors.foreground, fontSize: 13 }}>{formatDollars(k.spend_month_usd ?? 0)}</Text>
        <Text style={{ color: colors.muted, fontSize: 11 }}>this month</Text>
      </View>
    </View>
  );
}

export default function BillingScreen() {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const account = useCreditAccount();
  const topUps = useMyTopUps();
  const payments = useMyPayments();
  const apiKeys = useMyApiKeys();
  const refresh = useRefreshBilling();
  const [refreshing, setRefreshing] = React.useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  };

  const acc = account.data?.account ?? null;
  const agreementRequired = Boolean(account.data?.agreement?.required);
  const history = (topUps.data ?? []).filter((t) => t.status !== "awaiting_payment");

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={{ paddingTop: insets.top, paddingBottom: insets.bottom + 100 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>Billing</Text>
      </View>

      <View style={styles.section}>
        {account.isLoading ? <ActivityIndicator color={colors.primary} /> : acc ? (
          <BalanceCard account={acc} colors={colors} />
        ) : (
          <View style={[styles.linkCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <AlertCircle size={20} color={colors.muted} />
            <Text style={{ color: colors.muted, flex: 1 }}>
              {account.isError ? "Could not load your credits. Pull down to try again." : "AI credits come with premium membership."}
            </Text>
          </View>
        )}
      </View>

      {acc && (
        <Section title="Add funds" colors={colors}>
          <AddFunds colors={colors} agreementRequired={agreementRequired} />
        </Section>
      )}

      {history.length > 0 && (
        <Section title="Your top-ups" colors={colors}>
          <View style={[styles.list, { backgroundColor: colors.card }]}>
            {history.map((t) => <TopUpRow key={t.id} t={t} colors={colors} />)}
          </View>
          <Text style={[styles.foot, { color: colors.muted }]}>Top-ups are refunded as credits only.</Text>
        </Section>
      )}

      {(apiKeys.data ?? []).length > 0 && (
        <Section title="API usage" colors={colors}>
          <View style={[styles.list, { backgroundColor: colors.card }]}>
            {(apiKeys.data ?? []).map((k) => <ApiKeyRow key={k.id} k={k} colors={colors} />)}
          </View>
          <Text style={[styles.foot, { color: colors.muted }]}>Work your keys start is paid from these credits.</Text>
          <TouchableOpacity onPress={openWebKeys} style={styles.webLink}>
            <Text style={{ color: colors.primary }}>Manage keys on ilm.red</Text>
            <ExternalLink size={14} color={colors.primary} />
          </TouchableOpacity>
        </Section>
      )}

      {(payments.data ?? []).length > 0 && (
        <Section title="Receipts" colors={colors}>
          <View style={[styles.list, { backgroundColor: colors.card }]}>
            {(payments.data ?? []).map((p) => <PaymentRow key={p.id} p={p} colors={colors} />)}
          </View>
          <TouchableOpacity onPress={openWebBilling} style={styles.webLink}>
            <Text style={{ color: colors.primary }}>Statements and invoices on ilm.red</Text>
            <ExternalLink size={14} color={colors.primary} />
          </TouchableOpacity>
        </Section>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 24, paddingVertical: 16 },
  headerTitle: { fontSize: 28, fontWeight: "bold" },
  section: { paddingHorizontal: 24, marginBottom: 24 },
  sectionTitle: { fontSize: 18, fontWeight: "600", marginBottom: 12 },
  balanceCard: { padding: 24, borderRadius: 20, gap: 4 },
  balanceIcon: { width: 44, height: 44, borderRadius: 12, backgroundColor: "rgba(255,255,255,0.2)", alignItems: "center", justifyContent: "center", marginBottom: 12 },
  balanceLabel: { color: "rgba(255,255,255,0.85)", fontSize: 14 },
  balanceAmount: { color: "#FFF", fontSize: 38, fontWeight: "800", marginBottom: 8 },
  meterTrack: { height: 6, borderRadius: 3, backgroundColor: "rgba(255,255,255,0.25)", overflow: "hidden", marginBottom: 6 },
  meterFill: { height: 6, backgroundColor: "#FFF" },
  balanceSub: { color: "rgba(255,255,255,0.85)", fontSize: 13 },
  linkCard: { flexDirection: "row", alignItems: "center", gap: 12, borderWidth: 1, borderRadius: 12, padding: 14 },
  linkTitle: { fontSize: 16, fontWeight: "600" },
  list: { borderRadius: 12, overflow: "hidden" },
  row: { flexDirection: "row", alignItems: "center", gap: 10, padding: 14, borderBottomWidth: StyleSheet.hairlineWidth },
  rowWrap: { padding: 14, borderBottomWidth: StyleSheet.hairlineWidth },
  rowInner: { flexDirection: "row", alignItems: "center", gap: 10 },
  receipt: { marginTop: 10, gap: 3 },
  rl: { flexDirection: "row", justifyContent: "space-between", gap: 8 },
  rowTitle: { fontSize: 15, fontWeight: "600" },
  foot: { fontSize: 12, marginTop: 8 },
  webLink: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 12 },
});
