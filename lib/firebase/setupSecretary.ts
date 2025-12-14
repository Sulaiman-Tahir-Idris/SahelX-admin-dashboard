import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "./config";

/**
 * TEMPORARY – remove after secretary setup
 */
export const createSecretaryUser = async (
  email: string,
  password: string,
  displayName: string
) => {
  const userCredential = await createUserWithEmailAndPassword(
    auth,
    email,
    password
  );

  const user = userCredential.user;

  const secretaryData = {
    userId: user.uid,
    id: user.uid,
    role: "secretary",
    permissions: ["read", "create_requests"],
    createdAt: serverTimestamp(),
    email,
    displayName,
  };

  await setDoc(doc(db, "Secretary", user.uid), secretaryData);

  return {
    uid: user.uid,
    email,
    displayName,
  };
};
