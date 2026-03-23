import { Request, Response } from 'express';
import Task from '../models/task.model';
import Project from '../models/project.model';
import { getProjectPredictions } from '../utils/predictiveEngine';

interface AuthRequest extends Request {
    user?: any;
}

// @desc    Create a new task
// @route   POST /api/tasks
// @access  Private
const createTask = async (req: AuthRequest, res: Response) => {
    try {
        const { title, description, status, priority, dates, assignedTo, parentTask, project, weight, dependencies } = req.body;

        // Calculate level based on parent task
        let level = 0;
        let parentDates: { toStartDate?: Date; toCompleteDate?: Date } = {};

        if (parentTask) {
            const parent = await Task.findById(parentTask);
            if (parent) {
                level = parent.level + 1;
                parentDates = parent.dates || {};

                // Validate subtask dates are within parent's date range
                if (dates) {
                    const parentStart = parentDates.toStartDate ? new Date(parentDates.toStartDate) : null;
                    const parentEnd = parentDates.toCompleteDate ? new Date(parentDates.toCompleteDate) : null;

                    const checkDate = (dateStr: string | undefined, fieldName: string) => {
                        if (!dateStr) return;
                        const date = new Date(dateStr);
                        if (parentStart && date < parentStart) {
                            throw new Error(`${fieldName} cannot be before parent's start date`);
                        }
                        if (parentEnd && date > parentEnd) {
                            throw new Error(`${fieldName} cannot be after parent's due date`);
                        }
                    };

                    checkDate(dates.toStartDate, 'Start date');
                    checkDate(dates.toCompleteDate, 'Due date');
                }
            }
        }

        const task = await Task.create({
            title,
            description,
            status,
            priority,
            dates: dates || {},
            createdBy: req.user._id,
            assignedTo,
            parentTask: parentTask || null,
            project,
            level,
            weight: weight || 0,
            dependencies: dependencies || []
        });

        res.status(201).json(task);
    } catch (error: any) {
        res.status(400).json({ message: error.message || 'Invalid task data', error });
    }
};

// @desc    Get all tasks
// @route   GET /api/tasks
// @access  Private
const getTasks = async (req: AuthRequest, res: Response) => {
    try {
        const query: any = {};

        // Default: User sees tasks assigned to them OR created by them
        // We will modify this if we are in a Project context
        let accessFilter: any = {
            $or: [
                { assignedTo: req.user._id },
                { createdBy: req.user._id }
            ]
        };

        // Additional filters
        if (req.query.project) {
            query.project = req.query.project;

            // ACCESS CONTROL EXPANSION
            try {
                const project = await Project.findById(req.query.project);

                if (project && project.createdBy.toString() === req.user._id.toString()) {
                    // 1. PROJECT CREATOR: See EVERYTHING
                    accessFilter = {}; // No restrictions
                } else {
                    // 2. STANDARD USER: See Assigned/Created + ALL DESCENDANTS

                    // A. Find Direct Access Tasks (IDs only)
                    const directTasks = await Task.find({
                        project: req.query.project,
                        $or: [
                            { assignedTo: req.user._id },
                            { createdBy: req.user._id }
                        ]
                    }, '_id');

                    // B. Iteratively find all descendants
                    let allVisibleIds = directTasks.map(t => t._id.toString());
                    let currentLevelIds = [...allVisibleIds];
                    const seenIds = new Set(allVisibleIds); // Avoid cycles/dupes

                    // Safety cap for depth to prevent infinite loops (though seenIds handles it)
                    let depth = 0;
                    const MAX_DEPTH = 20;

                    while (currentLevelIds.length > 0 && depth < MAX_DEPTH) {
                        const children = await Task.find({
                            parentTask: { $in: currentLevelIds },
                            project: req.query.project
                        }, '_id');

                        const newIds: string[] = [];

                        children.forEach(child => {
                            const cid = child._id.toString();
                            if (!seenIds.has(cid)) {
                                seenIds.add(cid);
                                newIds.push(cid);
                                allVisibleIds.push(cid);
                            }
                        });

                        currentLevelIds = newIds;
                        depth++;
                    }

                    // C. Apply Expanded Access Filter
                    accessFilter = { _id: { $in: allVisibleIds } };
                }
            } catch (err) {
                console.error("Error expanding task access:", err);
                // Fallback to basic filter on error
            }
        }

        // Merge Access Filter into Query
        Object.assign(query, accessFilter);

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
            .populate('assignedTo', 'name email type')
            .populate('createdBy', 'name email')
            .populate('parentTask', 'title')
            .populate('project', 'title')
            .populate('dependencies', 'title status dates progress assignedTo');

        // Run prediction engine on ALL tasks in the project (for cross-task dependency chains)
        // Fetch full project task set for accurate dependency traversal
        const projectId = req.query.project as string;
        let allProjectTasks = tasks as any[];
        if (projectId) {
            // Fetch ALL tasks for the project with progressHistory for velocity calculation
            const fullSet = await Task.find({ project: projectId })
                .populate('assignedTo', 'name email type')
                .populate('dependencies', 'title status dates progress assignedTo progressHistory')
                .select('+progressHistory'); // Ensure progressHistory is in the payload
            allProjectTasks = fullSet as any[];
        }

        const predictions = getProjectPredictions(allProjectTasks);

        // Merge predictions into the response objects
        const tasksWithPredictions = tasks.map((task: any) => {
            const pred = predictions.get(task._id.toString());
            const plain = task.toObject();
            return {
                ...plain,
                predictedStartDate: pred?.predictedStartDate ?? null,
                predictedEndDate: pred?.predictedEndDate ?? null,
            };
        });

        res.json(tasksWithPredictions);
    } catch (error) {
        console.error('Error fetching tasks:', error);
        res.status(500).json({ message: 'Server Error', error: error instanceof Error ? error.message : 'Unknown error' });
    }
};

// @desc    Simulate tasks with conditions
// @route   POST /api/tasks/simulate/:projectId
// @access  Private
const simulateProjectTasks = async (req: AuthRequest, res: Response) => {
    try {
        const projectId = req.params.projectId;
        const conditions = req.body.conditions;

        // Fetch ALL tasks for the project with progressHistory for velocity calculation
        const allProjectTasks = await Task.find({ project: projectId as any })
            .populate('assignedTo', 'name email type')
            .populate('dependencies', 'title status dates progress assignedTo progressHistory')
            .select('+progressHistory'); // Ensure progressHistory is in the payload

        const predictions = getProjectPredictions(allProjectTasks, conditions);

        // Merge predictions into the response objects
        const tasksWithPredictions = allProjectTasks.map((task: any) => {
            const pred = predictions.get(task._id.toString());
            const plain = task.toObject();
            return {
                ...plain,
                predictedStartDate: pred?.predictedStartDate ?? null,
                predictedEndDate: pred?.predictedEndDate ?? null,
            };
        });

        res.json(tasksWithPredictions);
    } catch (error) {
        console.error('Error simulating tasks:', error);
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
            .populate('parentTask', 'title')
            .populate('dependencies', 'title status');

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
        const { title, description, status, priority, dates, assignedTo } = req.body;

        const task = await Task.findById(req.params.id);

        if (task) {
            task.title = title || task.title;
            task.description = description || task.description;
            task.status = status || task.status;
            task.priority = priority || task.priority;
            task.assignedTo = assignedTo || task.assignedTo;

            // Update dates sub-schema
            if (dates) {
                task.dates = {
                    ...task.dates,
                    ...dates
                };
            }

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

        // Validate dependencies
        if (task.dependencies && task.dependencies.length > 0) {
            const dependencies = await Task.find({ _id: { $in: task.dependencies } });
            const incompleteDependencies = dependencies.filter(dep => {
                const status = (dep.status || '').toLowerCase();
                return status !== 'completed' && status !== 'done';
            });

            if (incompleteDependencies.length > 0) {
                const depTitles = incompleteDependencies.map(dep => dep.title).join(', ');
                res.status(400).json({
                    message: `Cannot start. The following dependencies are not completed: ${depTitles}`
                });
                return;
            }
        }

        task.dates = {
            ...task.dates,
            startedDate: new Date()
        };
        task.status = 'In Progress';
        await task.save();

        // Update parent status/propagation
        if (task.parentTask) {
            await updateParentProgress(task.parentTask.toString());
        }

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

        // Validate dependencies
        if (task.dependencies && task.dependencies.length > 0) {
            const dependencies = await Task.find({ _id: { $in: task.dependencies } });
            const incompleteDependencies = dependencies.filter(dep => {
                const status = (dep.status || '').toLowerCase();
                return status !== 'completed' && status !== 'done';
            });

            if (incompleteDependencies.length > 0) {
                const depTitles = incompleteDependencies.map(dep => dep.title).join(', ');
                res.status(400).json({
                    message: `Cannot update progress. The following dependencies are not completed: ${depTitles}`
                });
                return;
            }
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

        if (newProgress === 100) {
            task.status = 'Completed';
            task.dates = {
                ...task.dates,
                completedDate: new Date()
            };
        } else if (newProgress > 0 && task.status === 'Pending') {
            task.status = 'In Progress';
            if (!task.dates.startedDate) {
                task.dates.startedDate = new Date();
            }
        }

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

        // Validate dependencies
        if (task.dependencies && task.dependencies.length > 0) {
            const dependencies = await Task.find({ _id: { $in: task.dependencies } });
            const incompleteDependencies = dependencies.filter(dep => {
                const status = (dep.status || '').toLowerCase();
                return status !== 'completed' && status !== 'done';
            });

            if (incompleteDependencies.length > 0) {
                const depTitles = incompleteDependencies.map(dep => dep.title).join(', ');
                res.status(400).json({
                    message: `Cannot complete. The following dependencies are not completed: ${depTitles}`
                });
                return;
            }
        }

        task.dates = {
            ...task.dates,
            completedDate: new Date()
        };
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
        const parent = await Task.findById(parentId);
        if (!parent) return;

        const children = await Task.find({ parentTask: parentId });
        if (children.length === 0) return;

        // 1. Calculate weighted/simple average progress
        let totalProgress = 0;
        let totalWeight = 0;
        children.forEach(child => {
            totalProgress += (child.progress * child.weight);
            totalWeight += child.weight;
        });

        let calculatedProgress = 0;
        if (totalWeight > 0) {
            calculatedProgress = totalProgress / totalWeight;
        } else {
            const sum = children.reduce((acc, child) => acc + child.progress, 0);
            calculatedProgress = sum / children.length;
        }

        const roundedProgress = Math.round(calculatedProgress);
        const oldProgress = parent.progress;
        const oldStatus = parent.status;

        parent.progress = roundedProgress;

        // 2. Determine Status and Dates
        if (roundedProgress === 100) {
            parent.status = 'Completed';
            
            // Derive completion date from the LATEST child activity
            const latestChildDate = children.reduce((latest, child) => {
                const childDate = child.dates?.completedDate || child.updatedAt || child.createdAt;
                if (!childDate) return latest;
                const d = new Date(childDate);
                return d > latest ? d : latest;
            }, new Date(0));

            if (!parent.dates.completedDate) {
                parent.dates.completedDate = latestChildDate.getTime() > 0 ? latestChildDate : new Date();
            }
        } else if (roundedProgress > 0) {
            parent.status = 'In Progress';
            if (!parent.dates.startedDate) {
                parent.dates.startedDate = new Date();
            }
        } else {
            parent.status = 'Pending';
        }

        // 3. Record history if something changed
        if (oldProgress !== roundedProgress || oldStatus !== parent.status) {
            parent.progressHistory.push({
                progress: roundedProgress,
                timestamp: new Date(),
                note: `Auto-updated from subtasks: ${parent.status} (${roundedProgress}%)`
            });
        }

        await parent.save();

        // 4. Recurse
        if (parent.parentTask) {
            await updateParentProgress(parent.parentTask.toString());
        }
    } catch (error) {
        console.error('Error updating parent progress:', error);
    }
}

// @desc    Create multiple tasks at once
// @route   POST /api/tasks/bulk
// @access  Private
const createBulkTasks = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { tasks, project, parentTask } = req.body;

        console.log('Bulk create request:', { tasksCount: tasks?.length, project, parentTask });

        if (!Array.isArray(tasks) || tasks.length === 0) {
            res.status(400).json({ message: 'Tasks array is required and must not be empty' });
            return;
        }

        if (!project) {
            res.status(400).json({ message: 'Project ID is required' });
            return;
        }

        // Calculate level based on parent task
        let level = 0;
        let parentDates: { toStartDate?: Date; toCompleteDate?: Date } = {};

        if (parentTask) {
            const parent = await Task.findById(parentTask);
            if (parent) {
                level = parent.level + 1;
                parentDates = parent.dates || {};
            }
        }

        const parentStart = parentDates.toStartDate ? new Date(parentDates.toStartDate) : null;
        const parentEnd = parentDates.toCompleteDate ? new Date(parentDates.toCompleteDate) : null;

        const createdTasks = [];

        for (let i = 0; i < tasks.length; i++) {
            const taskData = tasks[i];
            const { title, description, status, priority, dates, assignedTo, weight } = taskData;

            if (!title || title.trim() === '') {
                res.status(400).json({ message: `Task ${i + 1}: Title is required` });
                return;
            }

            // Validate subtask dates are within parent's date range
            if (dates && parentTask) {
                const checkDate = (dateStr: string | undefined, fieldName: string) => {
                    if (!dateStr) return;
                    const date = new Date(dateStr);
                    if (parentStart && date < parentStart) {
                        throw new Error(`Task ${i + 1}: ${fieldName} cannot be before parent's start date`);
                    }
                    if (parentEnd && date > parentEnd) {
                        throw new Error(`Task ${i + 1}: ${fieldName} cannot be after parent's due date`);
                    }
                };

                // Note: assignedDate is just a timestamp, not validated against parent range
                checkDate(dates.toStartDate, 'Start date');
                checkDate(dates.toCompleteDate, 'Due date');
            }

            const task = await Task.create({
                title: title.trim(),
                description,
                status: status || 'Pending',
                priority: priority || 'Medium',
                dates: dates || {},
                createdBy: req.user._id,
                assignedTo: assignedTo || undefined,
                parentTask: parentTask || null,
                project,
                level,
                weight: weight || 0
            });

            createdTasks.push(task);
        }

        console.log('Bulk create success:', createdTasks.length, 'tasks created');
        res.status(201).json(createdTasks);
    } catch (error: any) {
        console.error('Bulk create error:', error);
        res.status(400).json({ message: error.message || 'Failed to create tasks', error: error.toString() });
    }
};

export { createTask, createBulkTasks, getTasks, getTaskById, updateTask, deleteTask, startTask, updateProgress, completeTask, simulateProjectTasks };

