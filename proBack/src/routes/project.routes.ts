import express from 'express';
import { createProject, getProjects, getProjectById, updateProject, deleteProject } from '../controllers/project.controller';
import { protect, adminOrPm } from '../middlewares/auth.middleware';

const router = express.Router();

// We need to implement adminOrPm middleware or check in controller
// Let's assume we will add adminOrPm middleware next.

router.route('/')
    .post(protect, adminOrPm, createProject)
    .get(protect, getProjects);

router.route('/:id')
    .get(protect, getProjectById)
    .put(protect, adminOrPm, updateProject)
    .delete(protect, adminOrPm, deleteProject);

export default router;
