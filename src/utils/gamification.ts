import { db } from '../firebase';
import { doc, getDoc, updateDoc, setDoc, increment } from 'firebase/firestore';

export interface UserGamification {
  xp: number;
  streak: number;
  lastStudyDate: string | null;
}

export const awardXP = async (uid: string, amount: number) => {
  const userRef = doc(db, 'users', uid);
  const snap = await getDoc(userRef);
  
  if (!snap.exists()) {
    await setDoc(userRef, {
      xp: amount,
      streak: 1,
      lastStudyDate: new Date().toISOString().split('T')[0]
    }, { merge: true });
  } else {
    await updateDoc(userRef, {
      xp: increment(amount)
    });
    await updateStreak(uid);
  }
};

export const updateStreak = async (uid: string) => {
  const userRef = doc(db, 'users', uid);
  const snap = await getDoc(userRef);
  if (!snap.exists()) return;

  const data = snap.data();
  const today = new Date().toISOString().split('T')[0];
  const lastDate = data.lastStudyDate;

  if (lastDate === today) return; // Already updated today

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split('T')[0];

  if (lastDate === yesterdayStr) {
    // Continue streak
    await updateDoc(userRef, {
      streak: increment(1),
      lastStudyDate: today
    });
  } else {
    // Reset or start streak
    await updateDoc(userRef, {
      streak: 1,
      lastStudyDate: today
    });
  }
};
