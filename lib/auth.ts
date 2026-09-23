// Sign-in for the mobile app: Google everywhere, Apple on iPhone. Same accounts as ilm.red.
//
// Google (and Apple outside iOS) runs Supabase's OAuth flow in the system browser with PKCE and
// comes back to ilmred://auth-callback. Apple on iOS uses the native sheet and hands Supabase the
// identity token. Who the member is comes from GET /v1/me and /v1/me/entitlements.

import * as WebBrowser from "expo-web-browser";
import * as Linking from "expo-linking";
import * as AppleAuthentication from "expo-apple-authentication";
import { Platform } from "react-native";
import { supabase } from "@/lib/supabase";
import { ilmApi } from "@/lib/ilmApi";
import type { User } from "@/types/api";

WebBrowser.maybeCompleteAuthSession();

/** Where the browser returns after sign-in: ilmred://auth-callback (exp://…/--/auth-callback in Expo Go). */
export const AUTH_REDIRECT = Linking.createURL("auth-callback");

export class SignInCancelled extends Error {
  constructor() {
    super("Sign-in was cancelled");
    this.name = "SignInCancelled";
  }
}

async function signInWithBrowser(provider: "google" | "apple"): Promise<void> {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider,
    options: { redirectTo: AUTH_REDIRECT, skipBrowserRedirect: true },
  });
  if (error || !data?.url) throw error ?? new Error("Could not start sign-in");

  const result = await WebBrowser.openAuthSessionAsync(data.url, AUTH_REDIRECT);
  if (result.type !== "success") throw new SignInCancelled();

  const { queryParams } = Linking.parse(result.url);
  const failure = queryParams?.error_description ?? queryParams?.error;
  if (failure) throw new Error(String(failure));
  const code = queryParams?.code;
  if (typeof code !== "string") throw new Error("Sign-in did not return a code");
  const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
  if (exchangeError) throw exchangeError;
}

export const signInWithGoogle = () => signInWithBrowser("google");

/** True where the native Apple sheet is available (iOS 13+). */
export const appleSignInAvailable = () =>
  Platform.OS === "ios" ? AppleAuthentication.isAvailableAsync() : Promise.resolve(false);

export async function signInWithApple(): Promise<void> {
  if (Platform.OS !== "ios") return signInWithBrowser("apple");
  let credential: AppleAuthentication.AppleAuthenticationCredential;
  try {
    credential = await AppleAuthentication.signInAsync({
      requestedScopes: [
        AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
        AppleAuthentication.AppleAuthenticationScope.EMAIL,
      ],
    });
  } catch (e: unknown) {
    if ((e as { code?: string })?.code === "ERR_REQUEST_CANCELED") throw new SignInCancelled();
    throw e;
  }
  if (!credential.identityToken) throw new Error("Apple did not return an identity token");
  const { error } = await supabase.auth.signInWithIdToken({
    provider: "apple",
    token: credential.identityToken,
  });
  if (error) throw error;
}

export async function signOut(): Promise<void> {
  await supabase.auth.signOut();
}

/** Who the signed-in member is, from the API, in the shape the screens already use. */
export async function fetchCurrentUser(): Promise<User> {
  const [me, ent] = await Promise.all([
    ilmApi.call("me", "getMe"),
    ilmApi.call("me", "getMyEntitlements"),
  ]);
  return {
    id: me.id,
    email: me.email,
    email_verified: true,
    username: me.username ?? "",
    display_name: me.display_name,
    avatar_url: me.avatar_url ?? null,
    bio: me.bio ?? null,
    roles: ent.roles,
    preferences: {
      theme: "system",
      language: me.interface_lang,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone ?? "UTC",
      notifications: { email: true, push: false },
    },
    created_at: me.created_at,
    last_login_at: null,
  };
}
