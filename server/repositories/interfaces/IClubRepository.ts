import { BookClub, ClubPost } from '@/types';

export interface IClubRepository {
  /** Clubs with their member id lists attached. */
  findAllClubs(): Promise<BookClub[]>;
  findClubById(id: string): Promise<BookClub | null>;
  createClub(data: {
    id: string;
    name: string;
    description?: string;
    currentBook?: string;
    meetupDate?: string;
    creatorId: string;
  }): Promise<BookClub>;

  /** Adds or removes a membership. Returns the club's new state. */
  toggleMembership(clubId: string, userId: string): Promise<BookClub | null>;

  /** Posts with likes and comments attached, newest first. */
  findAllPosts(): Promise<ClubPost[]>;
  findPostById(id: string): Promise<ClubPost | null>;
  createPost(data: {
    id: string;
    clubId: string;
    authorId: string;
    content: string;
    bookTitle?: string;
  }): Promise<ClubPost>;

  toggleLike(postId: string, userId: string): Promise<ClubPost | null>;

  addComment(data: {
    id: string;
    postId: string;
    authorId: string;
    text: string;
  }): Promise<ClubPost | null>;
}
