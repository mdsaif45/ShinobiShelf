import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { ClubService } from '../services/ClubService';

export class ClubController {
  constructor(private clubService: ClubService) {}

  private callerId(req: AuthRequest): string | undefined {
    return req.dbUser?.id || req.user?.uid;
  }

  getClubs = async (req: AuthRequest, res: Response, next: any) => {
    try {
      res.json(await this.clubService.getClubs());
    } catch (err) {
      next(err);
    }
  };

  createClub = async (req: AuthRequest, res: Response, next: any) => {
    try {
      const creatorId = this.callerId(req);
      if (!creatorId) return res.status(401).json({ error: 'Unauthorized' });

      const { name, description, currentBook, meetupDate } = req.body;
      const club = await this.clubService.createClub({
        name,
        description,
        currentBook,
        meetupDate,
        creatorId,
      });
      res.status(201).json(club);
    } catch (err) {
      next(err);
    }
  };

  toggleMembership = async (req: AuthRequest, res: Response, next: any) => {
    try {
      const userId = this.callerId(req);
      if (!userId) return res.status(401).json({ error: 'Unauthorized' });
      res.json(await this.clubService.toggleMembership(req.params.id, userId));
    } catch (err) {
      next(err);
    }
  };

  getPosts = async (req: AuthRequest, res: Response, next: any) => {
    try {
      res.json(await this.clubService.getPosts());
    } catch (err) {
      next(err);
    }
  };

  createPost = async (req: AuthRequest, res: Response, next: any) => {
    try {
      const authorId = this.callerId(req);
      if (!authorId) return res.status(401).json({ error: 'Unauthorized' });

      const { clubId, content, bookTitle } = req.body;
      const post = await this.clubService.createPost({ clubId, content, bookTitle, authorId });
      res.status(201).json(post);
    } catch (err) {
      next(err);
    }
  };

  toggleLike = async (req: AuthRequest, res: Response, next: any) => {
    try {
      const userId = this.callerId(req);
      if (!userId) return res.status(401).json({ error: 'Unauthorized' });
      res.json(await this.clubService.toggleLike(req.params.id, userId));
    } catch (err) {
      next(err);
    }
  };

  addComment = async (req: AuthRequest, res: Response, next: any) => {
    try {
      const authorId = this.callerId(req);
      if (!authorId) return res.status(401).json({ error: 'Unauthorized' });
      res.status(201).json(
        await this.clubService.addComment(req.params.id, authorId, req.body?.text)
      );
    } catch (err) {
      next(err);
    }
  };
}
