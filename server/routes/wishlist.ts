import { Router } from 'express';
import { WishlistController } from '../controllers/WishlistController';
import { WishlistService } from '../services/WishlistService';
import { RepositoryFactory } from '../repositories/factory';
import { requireAuth } from '../middleware/auth';

const router = Router();

const wishlistRepository = RepositoryFactory.getWishlistRepository();
const wishlistService = new WishlistService(wishlistRepository);
const wishlistController = new WishlistController(wishlistService);

// Every route is authenticated: the board shows who asked for what.
router.get('/', requireAuth, wishlistController.getAll);
router.post('/', requireAuth, wishlistController.create);
router.post('/:id/upvote', requireAuth, wishlistController.toggleUpvote);
router.post('/:id/offers', requireAuth, wishlistController.addOffer);
router.patch('/:id/fulfilled', requireAuth, wishlistController.setFulfilled);
router.delete('/:id', requireAuth, wishlistController.remove);

export default router;
