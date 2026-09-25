// Search history settings (search release). Off until the member turns it on. On: searches from
// the website, this app and assistants they allowed are kept 90 days, at most 500, visible only to
// them. Turning it off asks what to do with what is saved; "delete" is the default.

import React from "react";
import { View, Text, Switch, TouchableOpacity, Alert, StyleSheet, ActivityIndicator } from "react-native";
import { History, Trash2 } from "lucide-react-native";

import { useTheme } from "@/providers/ThemeProvider";
import {
  useSearchHistoryEnabled,
  useSetSearchHistory,
  useMySearches,
  useClearSearches,
  useDeleteSearch,
  isRtl,
} from "@/hooks/useSearch";

const SOURCE: Record<string, string> = { web: "Website", app: "App", api: "API", assistant: "Assistant" };

export function SearchHistorySettings() {
  const { colors } = useTheme();
  const enabled = useSearchHistoryEnabled(true);
  const on = enabled.data === true;
  const setPref = useSetSearchHistory();
  const list = useMySearches(on, 10);
  const clearAll = useClearSearches();
  const delOne = useDeleteSearch();
  const failed = () => Alert.alert("Search history", "Could not update search history. Please try again.");

  const toggle = (next: boolean) => {
    if (next) { setPref.mutate({ on: true }, { onError: failed }); return; }
    Alert.alert("Turn off search history?", "Nothing new will be saved. What about the searches already saved?", [
      { text: "Cancel", style: "cancel" },
      { text: "Turn off, keep them", onPress: () => setPref.mutate({ on: false, keep: true }, { onError: failed }) },
      { text: "Turn off and delete", style: "destructive", onPress: () => setPref.mutate({ on: false }, { onError: failed }) },
    ]);
  };

  const rows = list.data?.data ?? [];

  return (
    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={styles.titleRow}>
        <History size={18} color={colors.foreground} />
        <Text style={[styles.title, { color: colors.foreground }]}>Search history</Text>
      </View>
      <Text style={[styles.intro, { color: colors.muted }]}>
        Keep a list of what you search, on the website, in this app and in assistants you allow, so you can find it
        again. Only you can see it. Kept 90 days.
      </Text>

      <View style={styles.switchRow}>
        <Text style={[styles.label, { color: colors.foreground }]}>Keep my search history</Text>
        {enabled.isLoading || setPref.isPending ? (
          <ActivityIndicator color={colors.primary} />
        ) : (
          <Switch value={on} onValueChange={toggle} accessibilityLabel="Keep my search history" />
        )}
      </View>

      {!on && !enabled.isLoading && (
        <Text style={[styles.note, { color: colors.muted }]}>Search history is off. Nothing you search is saved.</Text>
      )}

      {on && (
        <View style={styles.list}>
          {list.isLoading && <ActivityIndicator color={colors.primary} />}
          {!list.isLoading && rows.length === 0 && (
            <Text style={[styles.note, { color: colors.muted }]}>Nothing saved yet.</Text>
          )}
          {rows.map((e) => (
            <View key={e.id} style={[styles.row, { borderBottomColor: colors.border }]}>
              <View style={{ flex: 1 }}>
                <Text
                  style={[styles.query, { color: colors.foreground, textAlign: isRtl(e.query) ? "right" : "left" }]}
                  numberOfLines={1}
                >
                  {e.query}
                </Text>
                <Text style={[styles.meta, { color: colors.muted }]} numberOfLines={1}>
                  {[
                    new Date(e.created_at).toLocaleDateString(),
                    SOURCE[e.source] ?? e.source,
                    e.assistant ? `via ${e.assistant}` : null,
                    e.book ? `in ${e.book.title}` : null,
                    e.result_count != null ? `${e.result_count} results` : null,
                  ]
                    .filter(Boolean)
                    .join(" · ")}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => delOne.mutate(e.id, { onError: failed })}
                accessibilityLabel="Delete"
                style={styles.iconButton}
              >
                <Trash2 size={16} color={colors.muted} />
              </TouchableOpacity>
            </View>
          ))}
          {rows.length > 0 && (
            <TouchableOpacity onPress={() => clearAll.mutate(undefined, { onError: failed })} style={styles.clearButton}>
              <Text style={{ color: colors.primary, fontWeight: "600" }}>Delete all</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderWidth: 1, borderRadius: 12, padding: 16, marginTop: 24, gap: 10 },
  titleRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  title: { fontSize: 17, fontWeight: "600" },
  intro: { fontSize: 13, lineHeight: 19 },
  switchRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12 },
  label: { fontSize: 15, fontWeight: "500", flex: 1 },
  note: { fontSize: 13 },
  list: { gap: 2 },
  row: { flexDirection: "row", alignItems: "center", paddingVertical: 8, borderBottomWidth: StyleSheet.hairlineWidth, gap: 8 },
  query: { fontSize: 15, fontWeight: "500" },
  meta: { fontSize: 12, marginTop: 2 },
  iconButton: { padding: 6 },
  clearButton: { alignSelf: "flex-end", paddingVertical: 8 },
});
