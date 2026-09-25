// The Zelle QR code, drawn on the device from the text the bank's own code carries (qr_payload from
// the API). A recipient change in Finance's payment-method settings changes the code everywhere, with
// no image to re-upload. A Zelle QR code carries only the recipient, never an amount or a memo, which
// is why the screen shows both separately.

import React, { useMemo } from "react";
import { View, Text, StyleSheet } from "react-native";
import { SvgXml } from "react-native-svg";
import { renderSVG } from "uqr";

export function ZelleQr({ payload, name, size = 180 }: { payload: string; name: string; size?: number }) {
  const xml = useMemo(() => {
    if (!payload) return null;
    try {
      return renderSVG(payload, { border: 1, pixelSize: 6, whiteColor: "#ffffff", blackColor: "#111111" });
    } catch {
      return null;
    }
  }, [payload]);
  if (!xml) return null;
  return (
    <View style={styles.box} accessibilityRole="image" accessibilityLabel={`Zelle QR code for ${name}`}>
      <SvgXml xml={xml} width={size} height={size} />
      <Text style={styles.name}>{name}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  box: { alignItems: "center", backgroundColor: "#FFFFFF", borderRadius: 12, padding: 12, alignSelf: "center" },
  name: { marginTop: 6, fontSize: 13, fontWeight: "700", color: "#111111", letterSpacing: 0.5 },
});
