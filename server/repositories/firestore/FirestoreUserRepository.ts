import { IUserRepository } from '../interfaces/IUserRepository';
import { UserProfile } from '@/types';
import { adminDb } from '@/lib/firebase-admin';

export class FirestoreUserRepository implements IUserRepository {
  private collection = adminDb.collection('users');

  async findById(id: string): Promise<UserProfile | null> {
    const doc = await this.collection.doc(id).get();
    if (!doc.exists) return null;
    return { id: doc.id, ...doc.data() } as UserProfile;
  }

  async createOrUpdate(user: Partial<UserProfile>): Promise<UserProfile> {
    if (!user.id) throw new Error('User ID is required');
    const docRef = this.collection.doc(user.id);
    const snap = await docRef.get();
    if (!snap.exists) {
      await docRef.set({
        ...user,
        honestyScore: user.honestyScore || 100,
        createdAt: new Date().toISOString(),
      });
    } else {
      await docRef.update(user);
    }
    const updated = await docRef.get();
    return { id: updated.id, ...updated.data() } as UserProfile;
  }

  async updateHonestyScore(userId: string, pointsDelta: number): Promise<number> {
    const docRef = this.collection.doc(userId);
    const snap = await docRef.get();
    let newScore = 100 + pointsDelta;
    if (snap.exists) {
      const current = snap.data()?.honestyScore || 100;
      newScore = current + pointsDelta;
      await docRef.update({ honestyScore: newScore });
    } else {
      await docRef.set({ honestyScore: newScore });
    }
    return newScore;
  }

  async findByEmail(email: string): Promise<any | null> {
    const snap = await this.collection.where('email', '==', email.toLowerCase()).get();
    if (snap.empty) return null;
    const doc = snap.docs[0];
    return { id: doc.id, ...doc.data() };
  }

  async createUserWithPassword(data: { id: string; email: string; displayName?: string; passwordHash: string; salt: string }): Promise<UserProfile> {
    await this.collection.doc(data.id).set({
      email: data.email.toLowerCase(),
      displayName: data.displayName || data.email.split('@')[0],
      passwordHash: data.passwordHash,
      salt: data.salt,
      authProvider: 'email',
      createdAt: new Date().toISOString(),
    });
    return (await this.findById(data.id))!;
  }

  async saveGoogleUser(data: { id: string; email: string; displayName?: string; photoURL?: string; googleId: string; googleAccessToken?: string }): Promise<UserProfile> {
    const existing = await this.findByEmail(data.email);
    const userId = existing ? existing.id : data.id;
    await this.collection.doc(userId).set({
      email: data.email.toLowerCase(),
      displayName: data.displayName,
      photoURL: data.photoURL,
      googleId: data.googleId,
      googleAccessToken: data.googleAccessToken,
      authProvider: 'google',
      updatedAt: new Date().toISOString(),
    }, { merge: true });
    return (await this.findById(userId))!;
  }

  async findAll(): Promise<UserProfile[]> {
    const snapshot = await this.collection.get();
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as UserProfile[];
  }
}
