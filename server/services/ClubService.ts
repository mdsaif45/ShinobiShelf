import crypto from 'crypto';
import { IClubRepository } from '../repositories/interfaces/IClubRepository';
import { BookClub, ClubPost } from '@/types';

export class ClubService {
  constructor(private clubRepo: IClubRepository) {}

  async getClubs(): Promise<BookClub[]> {
    return await this.clubRepo.findAllClubs();
  }

  async createClub(data: {
    name?: string;
    description?: string;
    currentBook?: string;
    meetupDate?: string;
    creatorId: string;
  }): Promise<BookClub> {
    const name = data.name?.trim();
    if (!name) {
      throw Object.assign(new Error('A club name is required.'), { status: 400 });
    }

    return await this.clubRepo.createClub({
      id: 'club_' + crypto.randomBytes(6).toString('hex'),
      name,
      description: data.description?.trim() || undefined,
      currentBook: data.currentBook?.trim() || undefined,
      meetupDate: data.meetupDate?.trim() || undefined,
      creatorId: data.creatorId,
    });
  }

  async toggleMembership(clubId: string, userId: string): Promise<BookClub> {
    const club = await this.clubRepo.findClubById(clubId);
    if (!club) {
      throw Object.assign(new Error('That club no longer exists.'), { status: 404 });
    }

    // The creator stays a member: a club with no owner cannot be administered.
    if (club.creatorId === userId && club.members.includes(userId)) {
      throw Object.assign(
        new Error('The club creator cannot leave their own club.'),
        { status: 400 }
      );
    }

    return (await this.clubRepo.toggleMembership(clubId, userId))!;
  }

  async getPosts(): Promise<ClubPost[]> {
    return await this.clubRepo.findAllPosts();
  }

  async createPost(data: {
    clubId?: string;
    content?: string;
    bookTitle?: string;
    authorId: string;
  }): Promise<ClubPost> {
    const content = data.content?.trim();
    if (!content) {
      throw Object.assign(new Error('A post cannot be empty.'), { status: 400 });
    }
    if (!data.clubId) {
      throw Object.assign(new Error('A club must be selected.'), { status: 400 });
    }

    const club = await this.clubRepo.findClubById(data.clubId);
    if (!club) {
      throw Object.assign(new Error('That club no longer exists.'), { status: 404 });
    }

    // Discussions are for members, checked here rather than only in the UI.
    if (!club.members.includes(data.authorId)) {
      throw Object.assign(
        new Error('Join this club to post in its discussion.'),
        { status: 403 }
      );
    }

    return await this.clubRepo.createPost({
      id: 'post_' + crypto.randomBytes(6).toString('hex'),
      clubId: data.clubId,
      authorId: data.authorId,
      content,
      bookTitle: data.bookTitle?.trim() || undefined,
    });
  }

  async toggleLike(postId: string, userId: string): Promise<ClubPost> {
    const post = await this.clubRepo.findPostById(postId);
    if (!post) {
      throw Object.assign(new Error('That post no longer exists.'), { status: 404 });
    }
    return (await this.clubRepo.toggleLike(postId, userId))!;
  }

  async addComment(postId: string, authorId: string, text?: string): Promise<ClubPost> {
    const trimmed = text?.trim();
    if (!trimmed) {
      throw Object.assign(new Error('A comment cannot be empty.'), { status: 400 });
    }

    const post = await this.clubRepo.findPostById(postId);
    if (!post) {
      throw Object.assign(new Error('That post no longer exists.'), { status: 404 });
    }

    return (await this.clubRepo.addComment({
      id: 'cmt_' + crypto.randomBytes(6).toString('hex'),
      postId,
      authorId,
      text: trimmed,
    }))!;
  }
}
