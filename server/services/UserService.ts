import { IUserRepository } from '../repositories/interfaces/IUserRepository';
import { UserProfile } from '@/types';

export class UserService {
  constructor(private userRepo: IUserRepository) {}

  async getUserProfile(id: string): Promise<UserProfile | null> {
    return await this.userRepo.findById(id);
  }

  async createOrUpdateUser(user: Partial<UserProfile>): Promise<UserProfile> {
    return await this.userRepo.createOrUpdate(user);
  }

  async getAllUsers(): Promise<UserProfile[]> {
    return await this.userRepo.findAll();
  }
}
