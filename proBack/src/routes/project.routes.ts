import express from 'express';
import { createProject, getProjects, getProjectById, updateProject, deleteProject } from '../controllers/project.controller';
import { protect, adminOrPm } from '../middlewares/auth.middleware';

const router = express.Router();

router.route('/').post(protect, adminOrPm, createProject).get(protect, getProjects);
router.route('/:id').get(protect, getProjectById).put(protect, adminOrPm, updateProject).delete(protect, adminOrPm, deleteProject);

export default router;
