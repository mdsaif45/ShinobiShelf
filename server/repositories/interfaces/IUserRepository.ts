import { UserProfile } from '@/types';

export interface IUserRepository {
  findById(id: string): Promise<UserProfile | null>;
  findByEmail(email: string): Promise<any | null>;
  createOrUpdate(user: Partial<UserProfile>): Promise<UserProfile>;
  createUserWithPassword(data: { id: string; email: string; displayName?: string; passwordHash: string; salt: string }): Promise<UserProfile>;
  saveGoogleUser(data: { id: string; email: string; displayName?: string; photoURL?: string; googleId: string; googleAccessToken?: string }): Promise<UserProfile>;
  updateHonestyScore(userId: string, pointsDelta: number): Promise<number>;
  findAll(): Promise<UserProfile[]>;
}
