import { envConfig } from '../config/env';
import { IBookRepository } from './interfaces/IBookRepository';
import { ILoanRepository } from './interfaces/ILoanRepository';
import { IUserRepository } from './interfaces/IUserRepository';
import { IWishlistRepository } from './interfaces/IWishlistRepository';
import { IClubRepository } from './interfaces/IClubRepository';

import { FirestoreBookRepository } from './firestore/FirestoreBookRepository';
import { FirestoreLoanRepository } from './firestore/FirestoreLoanRepository';
import { FirestoreUserRepository } from './firestore/FirestoreUserRepository';

import { SqliteBookRepository } from './sqlite/SqliteBookRepository';
import { SqliteLoanRepository } from './sqlite/SqliteLoanRepository';
import { SqliteUserRepository } from './sqlite/SqliteUserRepository';
import { SqliteWishlistRepository } from './sqlite/SqliteWishlistRepository';
import { SqliteClubRepository } from './sqlite/SqliteClubRepository';

export class RepositoryFactory {
  private static bookRepo: IBookRepository;
  private static loanRepo: ILoanRepository;
  private static userRepo: IUserRepository;
  private static wishlistRepo: IWishlistRepository;
  private static clubRepo: IClubRepository;

  public static getBookRepository(): IBookRepository {
    if (!this.bookRepo) {
      switch (envConfig.dbProvider) {
        case 'sqlite':
          this.bookRepo = new SqliteBookRepository();
          break;
        case 'firebase':
        default:
          this.bookRepo = new FirestoreBookRepository();
          break;
      }
    }
    return this.bookRepo;
  }

  public static getLoanRepository(): ILoanRepository {
    if (!this.loanRepo) {
      switch (envConfig.dbProvider) {
        case 'sqlite':
          this.loanRepo = new SqliteLoanRepository();
          break;
        case 'firebase':
        default:
          this.loanRepo = new FirestoreLoanRepository();
          break;
      }
    }
    return this.loanRepo;
  }

  public static getUserRepository(): IUserRepository {
    if (!this.userRepo) {
      switch (envConfig.dbProvider) {
        case 'sqlite':
          this.userRepo = new SqliteUserRepository();
          break;
        case 'firebase':
        default:
          this.userRepo = new FirestoreUserRepository();
          break;
      }
    }
    return this.userRepo;
  }

  /**
   * Wishlist and clubs are SQLite-only for now.
   *
   * Rather than provide an untested Firestore implementation that would fail
   * at the first call, an unsupported provider throws here with a clear
   * message. `dbProvider` defaults to sqlite, so this is not hit in practice.
   */
  public static getWishlistRepository(): IWishlistRepository {
    if (!this.wishlistRepo) {
      if (envConfig.dbProvider !== 'sqlite') {
        throw new Error(
          `Wishlist storage is only implemented for the sqlite provider (got "${envConfig.dbProvider}").`
        );
      }
      this.wishlistRepo = new SqliteWishlistRepository();
    }
    return this.wishlistRepo;
  }

  public static getClubRepository(): IClubRepository {
    if (!this.clubRepo) {
      if (envConfig.dbProvider !== 'sqlite') {
        throw new Error(
          `Book club storage is only implemented for the sqlite provider (got "${envConfig.dbProvider}").`
        );
      }
      this.clubRepo = new SqliteClubRepository();
    }
    return this.clubRepo;
  }
}
