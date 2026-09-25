// Add funds by Zelle (Android). Pick an amount, agree to the billing agreement if one is in force,
// then send the money from the member's own bank app and tap "I've sent it". Nothing is credited on
// the device: Finance confirms the money arrived and the member is emailed.
//
// Credits are the amount sent less sales tax, shown line by line (California state, Santa Clara
// County, City of Milpitas). Refunds on Zelle top-ups are credits only, and the screen says so
// before anyone sends money.

import React, { useMemo, useState } from "react";
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, Share, StyleSheet, Alert } from "react-native";
import { Share2 } from "lucide-react-native";
import * as Haptics from "expo-haptics";

import type { ThemeColors } from "@/constants/colors";
import { ApiProblem } from "@/lib/ilmApi";
import { creditsAfterTax, pct, splitTax, type TaxComponent } from "@/lib/tax";
import {
  dollars, isOpenTopUp, problemText, useTopUpActions,
  type PaymentMethod, type TopUp,
} from "@/hooks/useBilling";
import { ZelleQr } from "./ZelleQr";
import { AgreementSheet } from "./AgreementSheet";

const PACKAGES = [5, 20, 50, 100];

function CopyRow({ label, value, shown, big, colors }: { label: string; value: string; shown?: string; big?: boolean; colors: ThemeColors }) {
  return (
    <View style={[styles.copyRow, { borderColor: colors.border }]}>
      <View style={{ flex: 1 }}>
        <Text style={[styles.copyLabel, { color: colors.muted }]}>{label}</Text>
        <Text selectable style={[big ? styles.copyBig : styles.copyValue, { color: big ? colors.primary : colors.foreground }]}>
          {shown ?? value}
        </Text>
      </View>
      <TouchableOpacity
        onPress={() => Share.share({ message: value })}
        accessibilityLabel={`Copy or share ${label}`}
        style={[styles.shareBtn, { borderColor: colors.border }]}
      >
        <Share2 size={16} color={colors.foreground} />
      </TouchableOpacity>
    </View>
  );
}

function TaxLines({ lines, colors }: { lines: { code: string; label: string; rate: number; amount: string }[]; colors: ThemeColors }) {
  return (
    <View style={{ gap: 2 }}>
      {lines.map((l) => (
        <View key={l.code} style={styles.taxRow}>
          <Text style={[styles.taxText, { color: colors.muted }]}>{l.label} ({pct(l.rate)})</Text>
          <Text style={[styles.taxText, { color: colors.muted }]}>${l.amount}</Text>
        </View>
      ))}
    </View>
  );
}

function SendPanel({ topUp, colors }: { topUp: TopUp; colors: ThemeColors }) {
  const { markSent, cancel } = useTopUpActions();
  const [sender, setSender] = useState(topUp.sender_name ?? "");
  const [conf, setConf] = useState(topUp.member_confirmation ?? "");
  const na = topUp.next_action;
  if (!na || na.type !== "bank_transfer") return null;
  const amount = dollars(topUp.amount);
  const memo = na.memo ?? topUp.reference ?? "";
  const lines = ((topUp as { tax_lines?: { code: string; label: string; rate: number; amount: { amount_minor: number } }[] }).tax_lines ?? [])
    .map((l) => ({ ...l, amount: dollars(l.amount) }));

  const sent = async () => {
    try {
      await markSent.mutateAsync({ id: topUp.id, senderName: sender, confirmation: conf });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert("Thanks", "We check the bank every business day and will email you when the credits are added.");
    } catch (e) {
      Alert.alert("Could not save", problemText(e, "Something went wrong. Please try again."));
    }
  };
  const doCancel = () =>
    Alert.alert("Cancel this top-up?", "Only cancel if you have not sent the money.", [
      { text: "Keep it", style: "cancel" },
      { text: "Cancel top-up", style: "destructive", onPress: () => cancel.mutate(topUp.id) },
    ]);

  return (
    <View style={{ gap: 14 }}>
      <Text style={[styles.h2, { color: colors.foreground }]}>
        Send ${amount} by Zelle for {topUp.credits.toFixed(2)} credits
      </Text>
      {topUp.expires_at && topUp.status === "awaiting_payment" && (
        <Text style={{ color: colors.muted, fontSize: 12 }}>
          Reference held until {new Date(topUp.expires_at).toLocaleDateString()}
        </Text>
      )}
      <ZelleQr payload={na.qr_payload ?? ""} name={na.display_name ?? ""} />
      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <CopyRow label="Send to" value={na.recipient ?? ""} colors={colors} />
        <View style={[styles.copyRow, { borderColor: colors.border }]}>
          <View>
            <Text style={[styles.copyLabel, { color: colors.muted }]}>Name your bank shows</Text>
            <Text style={[styles.copyValue, { color: colors.foreground }]}>{na.display_name}</Text>
          </View>
        </View>
        <CopyRow label="Amount" value={amount} shown={`$${amount}`} colors={colors} />
        <CopyRow label="Memo (required)" value={memo} big colors={colors} />
      </View>
      {lines.length > 0 && <TaxLines lines={lines} colors={colors} />}
      <View style={{ gap: 4 }}>
        <Text style={{ color: colors.foreground }}>1. Open your bank app and choose Zelle.</Text>
        <Text style={{ color: colors.foreground }}>2. Send ${amount} to {na.recipient}. Check the name reads {na.display_name}.</Text>
        <Text style={{ color: colors.foreground }}>3. Put {memo} in the memo so we know it is yours.</Text>
        <Text style={{ color: colors.foreground }}>4. Come back and tap "I've sent it".</Text>
      </View>
      <View style={[styles.note, { borderColor: colors.warning, backgroundColor: `${colors.warning}1A` }]}>
        <Text style={{ color: colors.foreground }}>
          Zelle payments cannot be pulled back by your bank once sent. Only send to {na.recipient}, and only the amount shown.
        </Text>
      </View>
      <View style={[styles.note, { borderColor: colors.primary, backgroundColor: `${colors.primary}14` }]}>
        <Text style={{ color: colors.foreground }}>
          Top-ups are refunded as ilm.red credits only. We do not send money back to your bank.
        </Text>
      </View>
      <TextInput
        style={[styles.input, { borderColor: colors.inputBorder, backgroundColor: colors.inputBg, color: colors.foreground }]}
        placeholder="Name on your bank account"
        placeholderTextColor={colors.muted}
        value={sender}
        onChangeText={setSender}
        maxLength={120}
        autoComplete="name"
      />
      <TextInput
        style={[styles.input, { borderColor: colors.inputBorder, backgroundColor: colors.inputBg, color: colors.foreground }]}
        placeholder="Bank confirmation number (optional)"
        placeholderTextColor={colors.muted}
        value={conf}
        onChangeText={setConf}
        maxLength={120}
        autoCapitalize="characters"
      />
      <TouchableOpacity style={[styles.button, { backgroundColor: colors.buttonBg }]} onPress={sent} disabled={markSent.isPending}>
        {markSent.isPending ? <ActivityIndicator color="#FFF" /> : (
          <Text style={styles.buttonText}>{topUp.status === "sent" ? "Save these details" : "I've sent it"}</Text>
        )}
      </TouchableOpacity>
      <TouchableOpacity onPress={doCancel} disabled={cancel.isPending} style={styles.linkBtn}>
        <Text style={{ color: colors.muted }}>Cancel this top-up</Text>
      </TouchableOpacity>
    </View>
  );
}

export function ZelleTopUp({
  method, topUps, agreementRequired, colors,
}: { method: PaymentMethod; topUps: TopUp[]; agreementRequired: boolean; colors: ThemeColors }) {
  const { create } = useTopUpActions();
  const min = method.min.amount_minor / 100;
  const max = Math.floor(method.max.amount_minor / 100);
  const choices = useMemo(() => PACKAGES.filter((p) => p >= min && p <= max), [min, max]);
  const [selected, setSelected] = useState<number | null>(choices.includes(20) ? 20 : choices[0] ?? null);
  const [custom, setCustom] = useState("");
  const [agreeOpen, setAgreeOpen] = useState(false);
  const [needsAgreement, setNeedsAgreement] = useState(agreementRequired);
  const components = (method as { tax_components?: TaxComponent[] }).tax_components;

  const open = topUps.find((t) => t.method === method.method && isOpenTopUp(t) && t.status === "awaiting_payment");
  const amount = custom.trim() !== "" ? Number(custom) : selected;
  const valid = amount != null && Number.isInteger(amount) && amount >= min && amount <= max;

  const make = async () => {
    if (!valid || amount == null) return;
    try {
      await create.mutateAsync({ method: method.method, amountMinor: amount * 100 });
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch (e) {
      if (e instanceof ApiProblem && e.slug === "agreement_required") { setNeedsAgreement(true); setAgreeOpen(true); return; }
      Alert.alert("Could not start the top-up", problemText(e, "Something went wrong. Please try again."));
    }
  };
  const start = () => {
    if (!valid) { Alert.alert("Amount", `Enter whole dollars from $${min} to $${max}.`); return; }
    if (needsAgreement) { setAgreeOpen(true); return; }
    void make();
  };

  if (open) return <SendPanel topUp={open} colors={colors} />;
  if (max < min) {
    return <Text style={{ color: colors.muted }}>You have added as much as you can this month. Your limit resets with your next billing period.</Text>;
  }

  const preview = valid && amount != null
    ? splitTax(components, amount, method.tax_rate).map((l) => ({ ...l, amount: l.amount.toFixed(2) }))
    : [];

  return (
    <View style={{ gap: 14 }}>
      <View style={styles.grid}>
        {choices.map((p) => {
          const on = selected === p && custom.trim() === "";
          return (
            <TouchableOpacity
              key={p}
              onPress={() => { setSelected(p); setCustom(""); }}
              accessibilityRole="button"
              accessibilityState={{ selected: on }}
              style={[styles.pkg, { borderColor: on ? colors.primary : colors.border, backgroundColor: on ? `${colors.primary}14` : colors.card }]}
            >
              <Text style={[styles.pkgAmount, { color: colors.foreground }]}>${p}</Text>
              <Text style={{ color: colors.muted, fontSize: 12 }}>{creditsAfterTax(p, method.tax_rate)} credits</Text>
            </TouchableOpacity>
          );
        })}
      </View>
      <TextInput
        style={[styles.input, { borderColor: colors.inputBorder, backgroundColor: colors.inputBg, color: colors.foreground }]}
        placeholder={`Other amount, $${min} to $${max}`}
        placeholderTextColor={colors.muted}
        keyboardType="number-pad"
        value={custom}
        onChangeText={(v) => setCustom(v.replace(/[^0-9]/g, ""))}
      />
      {preview.length > 0 && amount != null && (
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border, padding: 12 }]}>
          <TaxLines lines={preview} colors={colors} />
          <View style={[styles.taxRow, { marginTop: 6 }]}>
            <Text style={[styles.total, { color: colors.foreground }]}>You get</Text>
            <Text style={[styles.total, { color: colors.foreground }]}>{creditsAfterTax(amount, method.tax_rate)} credits</Text>
          </View>
        </View>
      )}
      <TouchableOpacity
        style={[styles.button, { backgroundColor: colors.buttonBg, opacity: valid ? 1 : 0.5 }]}
        onPress={start}
        disabled={create.isPending}
      >
        {create.isPending ? <ActivityIndicator color="#FFF" /> : <Text style={styles.buttonText}>Pay ${amount ?? ""} with Zelle</Text>}
      </TouchableOpacity>
      <Text style={{ color: colors.muted, fontSize: 12 }}>
        From your own bank app, no card needed. Needs a US bank account. Sold by saMas IT Services. Tax is taken once, when you pay; spending your credits on AI is never taxed again. Top-ups are refunded as credits only, never back to your bank.
      </Text>
      <AgreementSheet
        visible={agreeOpen}
        colors={colors}
        onClose={() => setAgreeOpen(false)}
        onAccepted={() => { setAgreeOpen(false); setNeedsAgreement(false); void make(); }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  h2: { fontSize: 18, fontWeight: "700" },
  card: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 12 },
  copyRow: { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 10, borderBottomWidth: StyleSheet.hairlineWidth },
  copyLabel: { fontSize: 12 },
  copyValue: { fontSize: 16, fontWeight: "700" },
  copyBig: { fontSize: 20, fontWeight: "800", letterSpacing: 2, fontFamily: "monospace" },
  shareBtn: { borderWidth: 1, borderRadius: 8, padding: 8 },
  taxRow: { flexDirection: "row", justifyContent: "space-between", gap: 8 },
  taxText: { fontSize: 13 },
  total: { fontSize: 14, fontWeight: "700" },
  note: { borderWidth: 1, borderRadius: 10, padding: 12 },
  input: { height: 48, borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, fontSize: 16 },
  button: { height: 50, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  buttonText: { color: "#FFF", fontSize: 16, fontWeight: "600" },
  linkBtn: { alignItems: "center", paddingVertical: 8 },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  pkg: { width: "47%", borderWidth: 2, borderRadius: 12, padding: 12 },
  pkgAmount: { fontSize: 20, fontWeight: "700" },
});
