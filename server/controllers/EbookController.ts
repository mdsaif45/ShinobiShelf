import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { EbookService } from '../services/EbookService';

export class EbookController {
  constructor(private ebookService: EbookService) {}

  getUserEbooks = async (req: AuthRequest, res: Response, next: any) => {
    try {
      const ownerId = req.dbUser?.id || req.user?.uid;
      if (!ownerId) return res.status(401).json({ error: 'Unauthorized' });

      const ebooks = await this.ebookService.getUserEbooks(ownerId);
      res.json(ebooks);
    } catch (err) {
      next(err);
    }
  };

  getEbookById = async (req: AuthRequest, res: Response, next: any) => {
    try {
      const ownerId = req.dbUser?.id || req.user?.uid;
      if (!ownerId) return res.status(401).json({ error: 'Unauthorized' });

      const { id } = req.params;
      const ebook = await this.ebookService.getEbookById(id, ownerId);
      if (!ebook) return res.status(404).json({ error: 'Ebook not found' });
      res.json(ebook);
    } catch (err) {
      next(err);
    }
  };

  uploadEbook = async (req: AuthRequest, res: Response, next: any) => {
    try {
      const ownerId = req.dbUser?.id || req.user?.uid;
      if (!ownerId) return res.status(401).json({ error: 'Unauthorized' });

      const file = (req as any).file;
      if (!file) {
        return res.status(400).json({ error: 'Ebook file is required' });
      }

      const { title, author, description, coverUrl } = req.body || {};
      const newEbook = await this.ebookService.saveUploadedEbook(
        file,
        { title, author, description, coverUrl },
        ownerId
      );
      res.status(201).json(newEbook);
    } catch (err) {
      next(err);
    }
  };

  updateProgress = async (req: AuthRequest, res: Response, next: any) => {
    try {
      const ownerId = req.dbUser?.id || req.user?.uid;
      if (!ownerId) return res.status(401).json({ error: 'Unauthorized' });

      const { id } = req.params;
      const { progressPercent, currentLocation } = req.body;

      const updated = await this.ebookService.updateProgress(
        id,
        ownerId,
        Number(progressPercent || 0),
        currentLocation
      );
      res.json(updated);
    } catch (err) {
      next(err);
    }
  };

  downloadEbookFile = async (req: AuthRequest, res: Response, next: any) => {
    try {
      const ownerId = req.dbUser?.id || req.user?.uid;
      if (!ownerId) return res.status(401).json({ error: 'Unauthorized' });

      const { id } = req.params;
      const { absolutePath, format, fileName } = await this.ebookService.getEbookFileStream(id, ownerId);

      let contentType = 'application/octet-stream';
      if (format === 'epub') contentType = 'application/epub+zip';
      else if (format === 'pdf') contentType = 'application/pdf';
      else if (format === 'txt') contentType = 'text/plain; charset=utf-8';

      res.setHeader('Content-Type', contentType);
      res.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(fileName)}"`);
      res.sendFile(absolutePath);
    } catch (err) {
      next(err);
    }
  };

  deleteEbook = async (req: AuthRequest, res: Response, next: any) => {
    try {
      const ownerId = req.dbUser?.id || req.user?.uid;
      if (!ownerId) return res.status(401).json({ error: 'Unauthorized' });

      const { id } = req.params;
      await this.ebookService.deleteEbook(id, ownerId);
      res.json({ success: true });
    } catch (err) {
      next(err);
    }
  };
}
