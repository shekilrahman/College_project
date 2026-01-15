import express from 'express';
import { createTask, getTasks, getTaskById, updateTask, deleteTask } from '../controllers/task.controller';
import { protect } from '../middlewares/auth.middleware';

const router = express.Router();

router.route('/').post(protect, createTask).get(protect, getTasks);
router.route('/:id').get(protect, getTaskById).put(protect, updateTask).delete(protect, deleteTask);

export default router;
