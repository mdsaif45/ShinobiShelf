import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { WishlistService } from '../services/WishlistService';

export class WishlistController {
  constructor(private wishlistService: WishlistService) {}

  private callerId(req: AuthRequest): string | undefined {
    return req.dbUser?.id || req.user?.uid;
  }

  getAll = async (req: AuthRequest, res: Response, next: any) => {
    try {
      res.json(await this.wishlistService.getAll());
    } catch (err) {
      next(err);
    }
  };

  create = async (req: AuthRequest, res: Response, next: any) => {
    try {
      const requesterId = this.callerId(req);
      if (!requesterId) return res.status(401).json({ error: 'Unauthorized' });

      const { title, author, notes, category } = req.body;
      const item = await this.wishlistService.create({
        title,
        author,
        notes,
        category,
        requesterId,
      });
      res.status(201).json(item);
    } catch (err) {
      next(err);
    }
  };

  toggleUpvote = async (req: AuthRequest, res: Response, next: any) => {
    try {
      const userId = this.callerId(req);
      if (!userId) return res.status(401).json({ error: 'Unauthorized' });
      res.json(await this.wishlistService.toggleUpvote(req.params.id, userId));
    } catch (err) {
      next(err);
    }
  };

  addOffer = async (req: AuthRequest, res: Response, next: any) => {
    try {
      const offererId = this.callerId(req);
      if (!offererId) return res.status(401).json({ error: 'Unauthorized' });
      res.status(201).json(
        await this.wishlistService.addOffer(req.params.id, offererId, req.body?.message)
      );
    } catch (err) {
      next(err);
    }
  };

  setFulfilled = async (req: AuthRequest, res: Response, next: any) => {
    try {
      const callerId = this.callerId(req);
      if (!callerId) return res.status(401).json({ error: 'Unauthorized' });
      res.json(
        await this.wishlistService.setFulfilled(req.params.id, !!req.body?.fulfilled, callerId)
      );
    } catch (err) {
      next(err);
    }
  };

  remove = async (req: AuthRequest, res: Response, next: any) => {
    try {
      const callerId = this.callerId(req);
      if (!callerId) return res.status(401).json({ error: 'Unauthorized' });
      await this.wishlistService.delete(req.params.id, callerId);
      res.json({ success: true });
    } catch (err) {
      next(err);
    }
  };
}
