import { Request, Response } from 'express';
import Project from '../models/project.model';

interface AuthRequest extends Request {
    user?: any;
}

// @desc    Create a new project
// @route   POST /api/projects
// @access  Private (Admin/PM)
const createProject = async (req: AuthRequest, res: Response) => {
    try {
        const { title, description, startDate, endDate, status } = req.body;

        const project = await Project.create({
            title,
            description,
            startDate,
            endDate,
            status,
            createdBy: req.user._id,
        });

        res.status(201).json(project);
    } catch (error) {
        res.status(400).json({ message: 'Invalid project data', error });
    }
};

// @desc    Get all projects
// @route   GET /api/projects
// @access  Private
const getProjects = async (req: AuthRequest, res: Response) => {
    try {
        // Import Task model to check for user involvement
        const Task = (await import('../models/task.model')).default;

        // Find all projects where user is creator
        const createdProjects = await Project.find({ createdBy: req.user._id }).populate('createdBy', 'name email');

        // Find all tasks where user is involved (assignedTo OR createdBy)
        const userTasks = await Task.find({
            $or: [
                { assignedTo: req.user._id },
                { createdBy: req.user._id }
            ]
        }).distinct('project');

        // Find projects where user has tasks
        const taskProjects = await Project.find({
            _id: { $in: userTasks }
        }).populate('createdBy', 'name email');

        // Combine and deduplicate projects
        const projectMap = new Map();
        [...createdProjects, ...taskProjects].forEach(p => {
            projectMap.set(p._id.toString(), p);
        });

        const projects = Array.from(projectMap.values());
        res.json(projects);
    } catch (error) {
        console.error('Error fetching projects:', error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Get project by ID
// @route   GET /api/projects/:id
// @access  Private
const getProjectById = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const project = await Project.findById(req.params.id).populate('createdBy', 'name email');
        if (project) {
            res.json(project);
        } else {
            res.status(404).json({ message: 'Project not found' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
}

// @desc    Update project
// @route   PUT /api/projects/:id
// @access  Private (Admin/PM)
const updateProject = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const project = await Project.findById(req.params.id);

        if (!project) {
            res.status(404).json({ message: 'Project not found' });
            return;
        }

        // Check if user is the project creator
        if (project.createdBy.toString() !== req.user._id.toString()) {
            res.status(403).json({ message: 'Not authorized to update this project' });
            return;
        }

        project.title = req.body.title || project.title;
        project.description = req.body.description || project.description;
        project.startDate = req.body.startDate || project.startDate;
        project.endDate = req.body.endDate || project.endDate;
        project.status = req.body.status || project.status;

        const updatedProject = await project.save();
        res.json(updatedProject);
    } catch (error) {
        res.status(400).json({ message: 'Invalid data', error });
    }
};


// @desc    Delete project
// @route   DELETE /api/projects/:id
// @access  Private (Admin/PM)
const deleteProject = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const project = await Project.findById(req.params.id);

        if (!project) {
            res.status(404).json({ message: 'Project not found' });
            return;
        }

        // Check if user is the project creator
        if (project.createdBy.toString() !== req.user._id.toString()) {
            res.status(403).json({ message: 'Not authorized to delete this project' });
            return;
        }

        await project.deleteOne();
        res.json({ message: 'Project removed' });
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

export { createProject, getProjects, getProjectById, updateProject, deleteProject };
