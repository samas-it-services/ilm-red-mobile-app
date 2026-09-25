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
import { CreditCard, ExternalLink, Receipt, Wallet, AlertCircle } from "lucide-react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";
import * as WebBrowser from "expo-web-browser";

import { useTheme } from "@/providers/ThemeProvider";
import type { ThemeColors } from "@/constants/colors";
import { ILM_WEB_URL } from "@/constants/config";
import {
  dollars, formatDollars, topUpStatusLabel,
  useCreditAccount, useMyPayments, useMyTopUps, usePaymentMethods, useRefreshBilling,
  type CreditAccount, type MyPayment, type TopUp,
} from "@/hooks/useBilling";
import { ZelleTopUp } from "@/components/billing/ZelleTopUp";

const openWebBilling = () => WebBrowser.openBrowserAsync(`${ILM_WEB_URL}/premium`);

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

function PaymentRow({ p, colors }: { p: MyPayment; colors: ThemeColors }) {
  return (
    <View style={[styles.row, { borderColor: colors.border }]}>
      <Receipt size={18} color={colors.muted} />
      <View style={{ flex: 1 }}>
        <Text style={[styles.rowTitle, { color: colors.foreground }]}>${dollars(p.amount)} · {p.provider}</Text>
        <Text style={{ color: colors.muted, fontSize: 12 }}>{new Date(p.created_at).toLocaleDateString()} · {p.status}</Text>
      </View>
      <Text style={{ color: colors.foreground, fontSize: 13 }}>{Number(p.credits_granted).toFixed(2)} credits</Text>
    </View>
  );
}

export default function BillingScreen() {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const account = useCreditAccount();
  const topUps = useMyTopUps();
  const payments = useMyPayments();
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
  rowTitle: { fontSize: 15, fontWeight: "600" },
  foot: { fontSize: 12, marginTop: 8 },
  webLink: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 12 },
});
