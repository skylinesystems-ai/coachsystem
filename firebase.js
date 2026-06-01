const REQUIRED_KEYS = ["apiKey", "authDomain", "projectId", "appId"];
const COACH_USERS_COLLECTION = "coachUsers";
const COACH_PAYMENTS_COLLECTION = "coachPayments";

let firebaseApp = null;
let firebaseAuth = null;
let firebaseDb = null;
let firebaseAppCheck = null;
let firebaseDeps = null;
let firebaseStatus = {
  enabled: false,
  ready: false,
  signedIn: false,
  provider: "local",
  userId: null,
  email: null,
  reason: "Configuração não fornecida",
};

const statusListeners = new Set();

function getConfig() {
  return globalThis.FIREBASE_CONFIG || {};
}

function isValidConfig(config) {
  return REQUIRED_KEYS.every((key) => {
    const value = config?.[key];
    return typeof value === "string" && value.trim().length > 0 && !value.includes("YOUR_");
  });
}

function updateStatus(partial) {
  firebaseStatus = { ...firebaseStatus, ...partial };
  statusListeners.forEach((listener) => {
    try {
      listener(firebaseStatus);
    } catch {
      // Listener errors should not break auth flow.
    }
  });
  return firebaseStatus;
}

export function getFirebaseStatus() {
  return firebaseStatus;
}

export function onFirebaseStatusChange(listener) {
  statusListeners.add(listener);
  listener(firebaseStatus);
  return () => statusListeners.delete(listener);
}

export function getFirebaseUserId() {
  return firebaseAuth?.currentUser?.uid || null;
}

export function getFirebaseUserEmail() {
  return firebaseAuth?.currentUser?.email || null;
}

export function isFirebaseReady() {
  return Boolean(firebaseStatus.enabled && firebaseStatus.ready);
}

async function loadFirebaseModules() {
  const [appModule, appCheckModule, authModule, firestoreModule] = await Promise.all([
    import("https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js"),
    import("https://www.gstatic.com/firebasejs/10.12.5/firebase-app-check.js"),
    import("https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js"),
    import("https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js"),
  ]);

  return {
    initializeApp: appModule.initializeApp,
    initializeAppCheck: appCheckModule.initializeAppCheck,
    getAuth: authModule.getAuth,
    onAuthStateChanged: authModule.onAuthStateChanged,
    signInAnonymously: authModule.signInAnonymously,
    GoogleAuthProvider: authModule.GoogleAuthProvider,
    signInWithPopup: authModule.signInWithPopup,
    signOut: authModule.signOut,
    ReCaptchaV3Provider: appCheckModule.ReCaptchaV3Provider,
    getFirestore: firestoreModule.getFirestore,
    doc: firestoreModule.doc,
    getDoc: firestoreModule.getDoc,
    setDoc: firestoreModule.setDoc,
    serverTimestamp: firestoreModule.serverTimestamp,
  };
}

function setLocalMode(reason) {
  updateStatus({
    enabled: false,
    ready: false,
    signedIn: false,
    provider: "local",
    userId: null,
    email: null,
    reason,
  });
  return firebaseStatus;
}

export async function initCoachFirebase() {
  const config = getConfig();

  if (!isValidConfig(config)) {
    return setLocalMode("Firebase em modo local. Preencha `window.FIREBASE_CONFIG` para sincronizar.");
  }

  if (firebaseStatus.enabled && firebaseStatus.ready && firebaseAuth) {
    return firebaseStatus;
  }

  try {
    firebaseDeps = await loadFirebaseModules();
    firebaseApp = firebaseDeps.initializeApp(config);
    if (config.appCheckSiteKey && !String(config.appCheckSiteKey).includes("YOUR_")) {
      try {
        firebaseAppCheck = firebaseDeps.initializeAppCheck(firebaseApp, {
          provider: new firebaseDeps.ReCaptchaV3Provider(config.appCheckSiteKey),
          isTokenAutoRefreshEnabled: true,
        });
      } catch {
        firebaseAppCheck = null;
      }
    }
    firebaseAuth = firebaseDeps.getAuth(firebaseApp);
    firebaseDb = firebaseDeps.getFirestore(firebaseApp);

    updateStatus({
      enabled: true,
      ready: false,
      signedIn: false,
      provider: "firebase",
      userId: null,
      email: null,
      reason: "Firebase configurado. Aguardando autenticação...",
    });

    firebaseDeps.onAuthStateChanged(firebaseAuth, (user) => {
      if (user) {
        const provider = user.providerData?.[0]?.providerId || (user.isAnonymous ? "anonymous" : "firebase");
        updateStatus({
          enabled: true,
          ready: true,
          signedIn: true,
          provider,
          userId: user.uid,
          email: user.email || null,
          reason:
            provider === "google.com"
              ? `Conectado com Google como ${user.email || "usuário"}`
              : `Sincronizando com sessão anônima ${user.uid.slice(0, 8)}...`,
        });
      } else {
        updateStatus({
          enabled: true,
          ready: true,
          signedIn: false,
          provider: "firebase",
          userId: null,
          email: null,
          reason: "Firebase pronto, aguardando login.",
        });
      }
    });

    if (!firebaseAuth.currentUser) {
      try {
        await firebaseDeps.signInAnonymously(firebaseAuth);
      } catch (error) {
        return updateStatus({
          enabled: false,
          ready: false,
          signedIn: false,
          provider: "local",
          userId: null,
          email: null,
          reason: `Firebase configurado, mas falhou ao autenticar anonimamente: ${error.message}`,
        });
      }
    } else {
      const user = firebaseAuth.currentUser;
      const provider = user.providerData?.[0]?.providerId || (user.isAnonymous ? "anonymous" : "firebase");
      updateStatus({
        enabled: true,
        ready: true,
        signedIn: true,
        provider,
        userId: user.uid,
        email: user.email || null,
        reason:
          provider === "google.com"
            ? `Conectado com Google como ${user.email || "usuário"}`
            : `Sincronizando com sessão anônima ${user.uid.slice(0, 8)}...`,
      });
    }

    return firebaseStatus;
  } catch (error) {
    return setLocalMode(`Falha ao inicializar Firebase: ${error.message}`);
  }
}

export async function signInCoachWithGoogle() {
  if (!firebaseAuth || !firebaseDeps) {
    await initCoachFirebase();
  }

  if (!firebaseAuth || !firebaseDeps || !isValidConfig(getConfig())) {
    return firebaseStatus;
  }

  try {
    const provider = new firebaseDeps.GoogleAuthProvider();
    provider.setCustomParameters({ prompt: "select_account" });
    await firebaseDeps.signInWithPopup(firebaseAuth, provider);
    return firebaseStatus;
  } catch (error) {
    updateStatus({
      enabled: firebaseStatus.enabled,
      ready: firebaseStatus.ready,
      reason: `Falha no login com Google: ${error.message}`,
    });
    return firebaseStatus;
  }
}

export async function signOutCoach() {
  if (!firebaseAuth || !firebaseDeps) {
    return firebaseStatus;
  }

  try {
    await firebaseDeps.signOut(firebaseAuth);
    await firebaseDeps.signInAnonymously(firebaseAuth);
    return firebaseStatus;
  } catch (error) {
    updateStatus({
      enabled: firebaseStatus.enabled,
      ready: firebaseStatus.ready,
      reason: `Falha ao sair da conta: ${error.message}`,
    });
    return firebaseStatus;
  }
}

export async function loadCoachState(userId) {
  if (!firebaseDb || !firebaseDeps || !userId) {
    return null;
  }

  try {
    const ref = firebaseDeps.doc(firebaseDb, COACH_USERS_COLLECTION, userId);
    const snap = await firebaseDeps.getDoc(ref);
    return snap.exists() ? snap.data() : null;
  } catch {
    return null;
  }
}

export async function saveCoachState(userId, payload) {
  if (!firebaseDb || !firebaseDeps || !userId) {
    return false;
  }

  try {
    const ref = firebaseDeps.doc(firebaseDb, COACH_USERS_COLLECTION, userId);
    await firebaseDeps.setDoc(
      ref,
      {
        ...payload,
        updatedAt: firebaseDeps.serverTimestamp(),
      },
      { merge: true }
    );
    return true;
  } catch {
    return false;
  }
}

export async function loadPaymentState(userId) {
  if (!firebaseDb || !firebaseDeps || !userId) {
    return null;
  }

  try {
    const ref = firebaseDeps.doc(firebaseDb, COACH_PAYMENTS_COLLECTION, userId);
    const snap = await firebaseDeps.getDoc(ref);
    return snap.exists() ? snap.data() : null;
  } catch {
    return null;
  }
}

export async function savePaymentState(userId, payload) {
  if (!firebaseDb || !firebaseDeps || !userId) {
    return false;
  }

  try {
    const ref = firebaseDeps.doc(firebaseDb, COACH_PAYMENTS_COLLECTION, userId);
    await firebaseDeps.setDoc(
      ref,
      {
        ...payload,
        updatedAt: firebaseDeps.serverTimestamp(),
      },
      { merge: true }
    );
    return true;
  } catch {
    return false;
  }
}
