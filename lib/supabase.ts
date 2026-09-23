// Supabase Auth for the mobile app — sign-in plumbing only.
//
// API-first: the app never reads or writes tables through this client. It exists to sign the member
// in (Google, Apple) and keep the session fresh; every data call goes to api.ilm.red through
// lib/ilmApi.ts with the session's access token. Same Supabase project and sign-in as ilm.red.

import "react-native-url-polyfill/auto";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { AppState, Platform } from "react-native";
import { createClient } from "@supabase/supabase-js";
import { SUPABASE_URL, SUPABASE_ANON_KEY } from "@/constants/config";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
    flowType: "pkce",
  },
});

// Refresh the token only while the app is in the foreground (Supabase's React Native guidance).
if (Platform.OS !== "web") {
  AppState.addEventListener("change", (state) => {
    if (state === "active") supabase.auth.startAutoRefresh();
    else supabase.auth.stopAutoRefresh();
  });
}

/** The current access token for api.ilm.red, or null when signed out. */
export async function getSessionToken(): Promise<string | null> {
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token ?? null;
}
