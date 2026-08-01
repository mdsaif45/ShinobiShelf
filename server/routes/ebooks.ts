import { Router } from 'express';
import { EbookController } from '../controllers/EbookController';
import { EbookService } from '../services/EbookService';
import { RepositoryFactory } from '../repositories/factory';
import { requireAuth } from '../middleware/auth';
import { handleEbookUpload } from '../middleware/upload';

const router = Router();

const ebookRepository = RepositoryFactory.getEbookRepository();
const ebookService = new EbookService(ebookRepository);
const ebookController = new EbookController(ebookService);

router.get('/', requireAuth, ebookController.getUserEbooks);
router.post('/upload', requireAuth, handleEbookUpload, ebookController.uploadEbook);
router.get('/:id', requireAuth, ebookController.getEbookById);
router.get('/:id/file', requireAuth, ebookController.downloadEbookFile);
router.patch('/:id/progress', requireAuth, ebookController.updateProgress);
router.delete('/:id', requireAuth, ebookController.deleteEbook);

export default router;
