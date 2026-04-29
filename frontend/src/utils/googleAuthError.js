const firebaseErrorMessages = {
  'auth/account-exists-with-different-credential':
    'An account already exists with this email using another sign-in method.',
  'auth/cancelled-popup-request': 'Another Google sign-in popup is already open.',
  'auth/operation-not-allowed': 'Google sign-in is not enabled for this Firebase project.',
  'auth/popup-blocked': 'The browser blocked the Google sign-in popup. Allow popups and try again.',
  'auth/popup-closed-by-user': 'Google sign-in was closed before it completed.',
  'auth/unauthorized-domain':
    'This domain is not authorized in Firebase Authentication. Add localhost and your deployed domain in Firebase Console.',
};

export const getGoogleAuthErrorMessage = (error, fallbackMessage) => {
  const serverMessage = error?.response?.data?.message || error?.response?.data?.error;
  if (serverMessage) return serverMessage;

  const firebaseMessage = firebaseErrorMessages[error?.code];
  if (firebaseMessage) return firebaseMessage;

  return error?.message || fallbackMessage;
};
