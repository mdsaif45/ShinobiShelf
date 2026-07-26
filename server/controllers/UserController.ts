import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { UserService } from '../services/UserService';

export class UserController {
  constructor(private userService: UserService) {}

  getCurrentUser = async (req: AuthRequest, res: Response, next: any) => {
    try {
      if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
      const profile = await this.userService.getUserProfile(req.user.uid);
      res.json(profile);
    } catch (err) {
      next(err);
    }
  };

  getAllUsers = async (req: AuthRequest, res: Response, next: any) => {
    try {
      const users = await this.userService.getAllUsers();
      res.json(users);
    } catch (err) {
      next(err);
    }
  };

  updateUser = async (req: AuthRequest, res: Response, next: any) => {
    try {
      const userId = req.params.id === 'me' ? req.user?.uid : req.params.id;
      if (!userId || (req.user?.uid !== userId)) {
        return res.status(403).json({ error: 'Forbidden' });
      }

      const { displayName, email, photoURL, bio, favoriteGenres, notificationPreferences } = req.body;

      if (email !== undefined) {
        if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
          return res.status(400).json({ error: 'Please enter a valid email address.' });
        }
      }

      const updated = await this.userService.createOrUpdateUser({
        id: userId,
        displayName,
        email,
        photoURL,
        bio,
        favoriteGenres,
        notificationPreferences,
      });

      res.json(updated);
    } catch (err) {
      next(err);
    }
  };
}
