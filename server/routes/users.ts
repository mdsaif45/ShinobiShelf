import { Router } from 'express';
import { UserController } from '../controllers/UserController';
import { UserService } from '../services/UserService';
import { RepositoryFactory } from '../repositories/factory';
import { requireAuth } from '../middleware/auth';

const router = Router();

const userRepository = RepositoryFactory.getUserRepository();
const userService = new UserService(userRepository);
const userController = new UserController(userService);

router.get('/me', requireAuth, userController.getCurrentUser);

// Was reachable with no token at all, returning every user's email address,
// notification preferences and favourite genres.
router.get('/', requireAuth, userController.getAllUsers);

router.patch('/:id', requireAuth, userController.updateUser);

export default router;
