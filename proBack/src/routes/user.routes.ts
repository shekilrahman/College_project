import express from 'express';
import { getUsers, createUser } from '../controllers/user.controller';
import { protect, admin } from '../middlewares/auth.middleware';

const router = express.Router();

router.get('/', protect, getUsers);
router.post('/', protect, admin, createUser);

export default router;
