import { Router } from 'express';
import { ClubController } from '../controllers/ClubController';
import { ClubService } from '../services/ClubService';
import { RepositoryFactory } from '../repositories/factory';
import { requireAuth } from '../middleware/auth';

const router = Router();

const clubRepository = RepositoryFactory.getClubRepository();
const clubService = new ClubService(clubRepository);
const clubController = new ClubController(clubService);

router.get('/', requireAuth, clubController.getClubs);
router.post('/', requireAuth, clubController.createClub);
router.post('/:id/membership', requireAuth, clubController.toggleMembership);

// Posts are a flat collection, matching how the client reads them.
router.get('/posts/all', requireAuth, clubController.getPosts);
router.post('/posts', requireAuth, clubController.createPost);
router.post('/posts/:id/like', requireAuth, clubController.toggleLike);
router.post('/posts/:id/comments', requireAuth, clubController.addComment);

export default router;
