// The billing agreement step. Shown before a member's first payment, and again when Finance has
// published a newer version. The member reads it, ticks "I agree", and the app records the
// acceptance through the API (surface "mobile", with the app version) before the top-up is made.

import React, { useState } from "react";
import { Modal, View, Text, ScrollView, TouchableOpacity, ActivityIndicator, StyleSheet } from "react-native";
import { Check, ExternalLink, X } from "lucide-react-native";
import * as WebBrowser from "expo-web-browser";

import type { ThemeColors } from "@/constants/colors";
import { ILM_WEB_URL } from "@/constants/config";
import { problemText, useBillingAgreement, useTopUpActions } from "@/hooks/useBilling";

/** Plain rendering of the agreement's Markdown: headings bold, list items bulleted, markers removed. */
function MarkdownText({ body, colors }: { body: string; colors: ThemeColors }) {
  const blocks = body.split(/\n{2,}/);
  return (
    <View style={{ gap: 10 }}>
      {blocks.map((b, i) => {
        const text = b.replace(/\*\*(.+?)\*\*/g, "$1").replace(/\[(.+?)\]\((.+?)\)/g, "$1");
        if (/^#{1,6}\s/.test(text)) {
          return <Text key={i} style={[styles.h, { color: colors.foreground }]}>{text.replace(/^#{1,6}\s/, "")}</Text>;
        }
        const lines = text.split("\n").map((l) => l.replace(/^\s*([-*]|\d+\.)\s+/, "• "));
        return <Text key={i} style={[styles.p, { color: colors.foreground }]}>{lines.join("\n")}</Text>;
      })}
    </View>
  );
}

export function AgreementSheet({
  visible, onClose, onAccepted, colors,
}: { visible: boolean; onClose: () => void; onAccepted: () => void; colors: ThemeColors }) {
  const q = useBillingAgreement(visible);
  const { acceptAgreement } = useTopUpActions();
  const [ticked, setTicked] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const doc = q.data?.agreement ?? null;

  const accept = async () => {
    if (!doc) { onAccepted(); return; }
    setError(null);
    try {
      await acceptAgreement.mutateAsync(doc.version);
      setTicked(false);
      onAccepted();
    } catch (e) {
      setError(problemText(e, "Could not record your agreement. Please try again."));
    }
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={[styles.sheet, { backgroundColor: colors.background }]}>
        <View style={styles.top}>
          <Text style={[styles.title, { color: colors.foreground }]} numberOfLines={2}>
            {doc?.title ?? "Billing agreement"}
          </Text>
          <TouchableOpacity onPress={onClose} accessibilityLabel="Close" hitSlop={12}>
            <X size={24} color={colors.muted} />
          </TouchableOpacity>
        </View>
        {doc && <Text style={[styles.meta, { color: colors.muted }]}>Version {doc.version}</Text>}

        {q.isLoading ? (
          <ActivityIndicator style={{ marginTop: 24 }} color={colors.primary} />
        ) : (
          <ScrollView style={styles.body} contentContainerStyle={{ paddingBottom: 24 }}>
            {doc?.summary ? (
              <View style={[styles.summary, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <Text style={{ color: colors.foreground }}>{doc.summary}</Text>
              </View>
            ) : null}
            {doc ? <MarkdownText body={doc.body_md} colors={colors} /> : (
              <Text style={{ color: colors.muted }}>There is no billing agreement to accept right now.</Text>
            )}
            <TouchableOpacity
              style={styles.link}
              onPress={() => WebBrowser.openBrowserAsync(`${ILM_WEB_URL}/billing-agreement`)}
              accessibilityRole="link"
            >
              <ExternalLink size={14} color={colors.primary} />
              <Text style={{ color: colors.primary }}>Open on ilm.red</Text>
            </TouchableOpacity>
          </ScrollView>
        )}

        <TouchableOpacity
          style={styles.tick}
          onPress={() => setTicked((v) => !v)}
          accessibilityRole="checkbox"
          accessibilityState={{ checked: ticked }}
        >
          <View style={[styles.box, { borderColor: colors.primary, backgroundColor: ticked ? colors.primary : "transparent" }]}>
            {ticked && <Check size={14} color="#FFF" />}
          </View>
          <Text style={[styles.tickText, { color: colors.foreground }]}>
            I have read and agree to the billing agreement{doc ? ` (version ${doc.version})` : ""}.
          </Text>
        </TouchableOpacity>
        {error && <Text style={[styles.error, { color: colors.destructive }]}>{error}</Text>}
        <TouchableOpacity
          style={[styles.button, { backgroundColor: colors.buttonBg, opacity: ticked && !acceptAgreement.isPending ? 1 : 0.5 }]}
          disabled={!ticked || acceptAgreement.isPending}
          onPress={accept}
        >
          {acceptAgreement.isPending ? <ActivityIndicator color="#FFF" /> : <Text style={styles.buttonText}>Agree and continue</Text>}
        </TouchableOpacity>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  sheet: { flex: 1, padding: 20, paddingTop: 24 },
  top: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", gap: 12 },
  title: { fontSize: 20, fontWeight: "700", flex: 1 },
  meta: { marginTop: 4, fontSize: 13 },
  body: { flex: 1, marginTop: 16 },
  summary: { borderWidth: 1, borderRadius: 10, padding: 12, marginBottom: 12 },
  h: { fontSize: 16, fontWeight: "700", marginTop: 6 },
  p: { fontSize: 14, lineHeight: 21 },
  link: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 16 },
  tick: { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 12 },
  box: { width: 22, height: 22, borderRadius: 5, borderWidth: 2, alignItems: "center", justifyContent: "center" },
  tickText: { flex: 1, fontSize: 14 },
  error: { fontSize: 13, marginBottom: 8 },
  button: { height: 50, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  buttonText: { color: "#FFF", fontSize: 16, fontWeight: "600" },
});
