import { envConfig } from '../config/env';
import { IBookRepository } from './interfaces/IBookRepository';
import { ILoanRepository } from './interfaces/ILoanRepository';
import { IUserRepository } from './interfaces/IUserRepository';

import { FirestoreBookRepository } from './firestore/FirestoreBookRepository';
import { FirestoreLoanRepository } from './firestore/FirestoreLoanRepository';
import { FirestoreUserRepository } from './firestore/FirestoreUserRepository';

import { SqliteBookRepository } from './sqlite/SqliteBookRepository';
import { SqliteLoanRepository } from './sqlite/SqliteLoanRepository';
import { SqliteUserRepository } from './sqlite/SqliteUserRepository';

export class RepositoryFactory {
  private static bookRepo: IBookRepository;
  private static loanRepo: ILoanRepository;
  private static userRepo: IUserRepository;

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
}
