// Accounts are created by signing in with Google or Apple, the same as on ilm.red, so there is no
// separate registration form any more. Old links to this screen land on sign-in.
import { Redirect } from "expo-router";

export default function RegisterScreen() {
  return <Redirect href="/(auth)/login" />;
}
