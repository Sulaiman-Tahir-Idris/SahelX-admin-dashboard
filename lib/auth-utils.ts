// // app/lib/auth-utils.ts
// import { getIdTokenResult } from 'firebase/auth';
// import { auth } from './firebase';

// export async function getCurrentUserRole(): Promise<'admin' | 'rider' | 'customer' | null> {
//   const user = auth.currentUser;
//   if (!user) return null;

//   try {
//     const idTokenResult = await getIdTokenResult(user);
//     const role = idTokenResult.claims.role;
//     if (role === 'admin' || role === 'rider' || role === 'customer') {
//       return role;
//     }
//     return null;
//   } catch (error) {
//     console.error('Failed to get role:', error);
//     return null;
//   }
// }

// Simple auth utility without Firebase imports to avoid build issues
export async function getCurrentUser() {
  // This would normally check Firebase auth
  // For now, return null to avoid build issues
  return null
}
