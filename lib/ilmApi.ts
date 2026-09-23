// The app's client for api.ilm.red, typed from the OpenAPI contracts.
//
//   const me = await ilmApi.call("me", "getMe");
//   try { … } catch (e) { if (e instanceof ApiProblem && e.slug === "premium_required") … }
//
// lib/api-client/ is a copy of packages/api-client from ilm-red-unbound. Do not edit it here:
// change the contract there, run `npm run api:spec`, then
// `node scripts/sync-api-client.mjs ../ilm-red-mobile-app/lib/api-client`.

import { Platform } from "react-native";
import Constants from "expo-constants";
import { createApiClient } from "@/lib/api-client";
import { ILM_API_URL, ILM_ADMIN_API_URL } from "@/constants/config";
import { getSessionToken } from "@/lib/supabase";

export { ApiProblem } from "@/lib/api-client";
export type { ResponseOf, RequestOf } from "@/lib/api-client";

export const ilmApi = createApiClient({
  publicBaseUrl: ILM_API_URL,
  staffBaseUrl: ILM_ADMIN_API_URL,
  getToken: getSessionToken,
  clientInfo: `${Platform.OS}/${Constants.expoConfig?.version ?? "0"}`,
});
