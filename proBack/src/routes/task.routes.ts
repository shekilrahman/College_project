import express from 'express';
import { createTask, createBulkTasks, getTasks, getTaskById, updateTask, deleteTask, startTask, updateProgress, completeTask } from '../controllers/task.controller';
import { protect } from '../middlewares/auth.middleware';

const router = express.Router();

router.route('/')
    .post(protect, createTask)
    .get(protect, getTasks);

router.post('/bulk', protect, createBulkTasks);

router.route('/:id')
    .get(protect, getTaskById)
    .put(protect, updateTask)
    .delete(protect, deleteTask);

// Progress management routes
router.post('/:id/start', protect, startTask);
router.patch('/:id/progress', protect, updateProgress);
router.post('/:id/complete', protect, completeTask);

export default router;
