import auth, { FirebaseAuthTypes } from "@react-native-firebase/auth";
import { GoogleSignin } from "@react-native-google-signin/google-signin";
import Constants from "expo-constants";

const googleExtra = (Constants.expoConfig?.extra as any)?.google ?? {};
const GOOGLE_WEB_CLIENT_ID: string | undefined = googleExtra.webClientId;
const GOOGLE_IOS_CLIENT_ID: string | undefined = googleExtra.iosClientId;
const GOOGLE_ANDROID_CLIENT_ID: string | undefined = googleExtra.androidClientId;

let googleConfigured = false;
function ensureGoogleConfigured() {
  if (googleConfigured) return true;
  if (!GOOGLE_WEB_CLIENT_ID) return false;
  GoogleSignin.configure({
    webClientId: GOOGLE_WEB_CLIENT_ID,
    iosClientId: GOOGLE_IOS_CLIENT_ID,
    offlineAccess: true,
    forceCodeForRefreshToken: true,
  });
  googleConfigured = true;
  return true;
}

export const isFirebaseConfigured = true;

export const isGoogleSignInConfigured = Boolean(GOOGLE_WEB_CLIENT_ID);

export function mapFirebaseUser(
  user: FirebaseAuthTypes.User | null,
): import("@/shared/types").AuthUser | null {
  if (!user) return null;
  return {
    uid: user.uid,
    email: user.email,
    displayName: user.displayName,
    photoURL: user.photoURL,
  };
}

export async function signInWithEmail(
  email: string,
  password: string,
): Promise<FirebaseAuthTypes.User> {
  const credential = await auth().signInWithEmailAndPassword(email, password);
  return credential.user;
}

export async function signUpWithEmail(
  email: string,
  password: string,
  displayName?: string,
): Promise<FirebaseAuthTypes.User> {
  const credential = await auth().createUserWithEmailAndPassword(email, password);
  if (displayName) {
    await credential.user.updateProfile({ displayName });
  }
  return credential.user;
}

export async function signInWithGoogle(): Promise<FirebaseAuthTypes.User> {
  if (!ensureGoogleConfigured()) {
    throw new Error(
      "Google Sign-In is not configured. Set EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID in your .env file.",
    );
  }

  await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });

  const userInfo = await GoogleSignin.signIn();
  if (userInfo.type === "cancelled") {
    throw new Error("Sign in was cancelled.");
  }

  const idToken = userInfo.data?.idToken;
  if (!idToken) {
    throw new Error("Google Sign-In failed: no ID token returned.");
  }

  const googleCredential = auth.GoogleAuthProvider.credential(idToken);
  const userCredential = await auth().signInWithCredential(googleCredential);
  return userCredential.user;
}

export async function signOutFirebase(): Promise<void> {
  if (isGoogleSignInConfigured) {
    try {
      const currentUser = GoogleSignin.getCurrentUser();
      if (currentUser) {
        await GoogleSignin.signOut();
      }
    } catch {
    }
  }
  await auth().signOut();
}

export function onAuthStateChanged(
  cb: (user: import("@/shared/types").AuthUser | null) => void,
): () => void {
  return auth().onAuthStateChanged((user) => cb(mapFirebaseUser(user)));
}
