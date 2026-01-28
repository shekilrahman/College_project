import { Request, Response } from 'express';
import Task from '../models/task.model';

interface AuthRequest extends Request {
    user?: any;
}

// @desc    Create a new task
// @route   POST /api/tasks
// @access  Private
// @desc    Create a new task
// @route   POST /api/tasks
// @access  Private
const createTask = async (req: AuthRequest, res: Response) => {
    try {
        const { title, description, status, priority, dueDate, assignedTo, parentTask, project, weight } = req.body;

        // Calculate level based on parent task
        let level = 0;
        if (parentTask) {
            const parent = await Task.findById(parentTask);
            if (parent) {
                level = parent.level + 1;
            }
        }

        const task = await Task.create({
            title,
            description,
            status,
            priority,
            dueDate,
            createdBy: req.user._id,
            assignedTo,
            parentTask: parentTask || null,
            project,
            level,
            weight: weight || 0
        });

        res.status(201).json(task);
    } catch (error) {
        res.status(400).json({ message: 'Invalid task data', error });
    }
};

// @desc    Get all tasks
// @route   GET /api/tasks
// @access  Private
const getTasks = async (req: AuthRequest, res: Response) => {
    try {
        const query: any = {};

        // Core filter: user must be either assignedTo OR createdBy
        query.$or = [
            { assignedTo: req.user._id },
            { createdBy: req.user._id }
        ];

        // Additional filters
        if (req.query.project) {
            query.project = req.query.project;
        }
        if (req.query.assignedTo) {
            query.assignedTo = req.query.assignedTo;
        }
        if (req.query.createdBy) {
            query.createdBy = req.query.createdBy;
        }
        if ('parentTask' in req.query) {
            const parentTaskValue = req.query.parentTask;
            if (parentTaskValue === 'null' || parentTaskValue === null || parentTaskValue === '') {
                query.parentTask = null;
            } else {
                query.parentTask = parentTaskValue;
            }
        }

        const tasks = await Task.find(query)
            .populate('assignedTo', 'name email')
            .populate('createdBy', 'name email')
            .populate('parentTask', 'title')
            .populate('project', 'title');

        res.json(tasks);
    } catch (error) {
        console.error('Error fetching tasks:', error);
        res.status(500).json({ message: 'Server Error', error: error instanceof Error ? error.message : 'Unknown error' });
    }
};

// @desc    Get task by ID
// @route   GET /api/tasks/:id
// @access  Private
const getTaskById = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const task = await Task.findById(req.params.id)
            .populate('assignedTo', 'name email')
            .populate('createdBy', 'name email')
            .populate('parentTask', 'title');

        if (task) {
            res.json(task);
        } else {
            res.status(404).json({ message: 'Task not found' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};



// @desc    Update task
// @route   PUT /api/tasks/:id
// @access  Private
const updateTask = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { title, description, status, priority, dueDate, assignedTo } = req.body;

        const task = await Task.findById(req.params.id);

        if (task) {
            task.title = title || task.title;
            task.description = description || task.description;
            task.status = status || task.status;
            task.priority = priority || task.priority;
            task.dueDate = dueDate || task.dueDate;
            task.assignedTo = assignedTo || task.assignedTo;

            const updatedTask = await task.save();
            res.json(updatedTask);
        } else {
            res.status(404).json({ message: 'Task not found' });
        }
    } catch (error) {
        res.status(400).json({ message: 'Invalid task data', error });
    }
};

// @desc    Delete task
// @route   DELETE /api/tasks/:id
// @access  Private
const deleteTask = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const task = await Task.findById(req.params.id);

        if (task) {
            await task.deleteOne();
            res.json({ message: 'Task removed' });
        } else {
            res.status(404).json({ message: 'Task not found' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Start a task
// @route   POST /api/tasks/:id/start
// @access  Private
const startTask = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const task = await Task.findById(req.params.id);

        if (!task) {
            res.status(404).json({ message: 'Task not found' });
            return;
        }

        // Check if task has children (shouldn't start parent tasks manually)
        const childCount = await Task.countDocuments({ parentTask: task._id });
        if (childCount > 0) {
            res.status(400).json({ message: 'Cannot start task with subtasks. Progress is auto-calculated.' });
            return;
        }

        task.startedAt = new Date();
        task.status = 'In Progress';
        await task.save();

        res.json(task);
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Update task progress
// @route   PATCH /api/tasks/:id/progress
// @access  Private
const updateProgress = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const task = await Task.findById(req.params.id);
        const { amount, note } = req.body; // amount can be +10 or -5

        if (!task) {
            res.status(404).json({ message: 'Task not found' });
            return;
        }

        // Check if task has children
        const childCount = await Task.countDocuments({ parentTask: task._id });
        if (childCount > 0) {
            res.status(400).json({ message: 'Cannot manually update progress for task with subtasks.' });
            return;
        }

        // Parse amount (e.g., "+10" or "-5")
        const numAmount = parseInt(amount);
        if (isNaN(numAmount)) {
            res.status(400).json({ message: 'Invalid amount format' });
            return;
        }

        // Update progress
        let newProgress = task.progress + numAmount;
        newProgress = Math.max(0, Math.min(100, newProgress)); // Clamp between 0-100

        task.progress = newProgress;
        task.progressHistory.push({
            progress: newProgress,
            timestamp: new Date(),
            note: note || `${numAmount > 0 ? '+' : ''}${numAmount}%`,
        });

        await task.save();

        // Update parent progress if exists
        if (task.parentTask) {
            await updateParentProgress(task.parentTask.toString());
        }

        res.json(task);
    } catch (error) {
        console.error('Error updating progress:', error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Complete a task
// @route   POST /api/tasks/:id/complete
// @access  Private
const completeTask = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const task = await Task.findById(req.params.id);

        if (!task) {
            res.status(404).json({ message: 'Task not found' });
            return;
        }

        task.completedAt = new Date();
        task.status = 'Completed';
        task.progress = 100;

        task.progressHistory.push({
            progress: 100,
            timestamp: new Date(),
            note: 'Task completed',
        });

        await task.save();

        // Update parent progress if exists
        if (task.parentTask) {
            await updateParentProgress(task.parentTask.toString());
        }

        res.json(task);
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

// Helper function to calculate and update parent task progress
async function updateParentProgress(parentId: string) {
    try {
        const children = await Task.find({ parentTask: parentId });

        if (children.length === 0) return;

        // Calculate weighted average
        let totalProgress = 0;
        let totalWeight = 0;

        children.forEach(child => {
            totalProgress += (child.progress * child.weight);
            totalWeight += child.weight;
        });

        // Calculate final progress (handle division by zero)
        const calculatedProgress = totalWeight > 0 ? totalProgress / totalWeight : 0;

        // Update parent
        await Task.findByIdAndUpdate(parentId, {
            progress: Math.round(calculatedProgress)
        });

        // Recursively update grandparent if exists
        const parent = await Task.findById(parentId);
        if (parent?.parentTask) {
            await updateParentProgress(parent.parentTask.toString());
        }
    } catch (error) {
        console.error('Error updating parent progress:', error);
    }
}

export { createTask, getTasks, getTaskById, updateTask, deleteTask, startTask, updateProgress, completeTask };

