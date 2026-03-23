"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteProject = exports.updateProject = exports.getProjectById = exports.getProjects = exports.createProject = void 0;
const project_model_1 = __importDefault(require("../models/project.model"));
// @desc    Create a new project
// @route   POST /api/projects
// @access  Private (Admin/PM)
const createProject = async (req, res) => {
    try {
        const { title, description, startDate, endDate, status } = req.body;
        const project = await project_model_1.default.create({
            title,
            description,
            startDate,
            endDate,
            status,
            createdBy: req.user._id,
        });
        res.status(201).json(project);
    }
    catch (error) {
        res.status(400).json({ message: 'Invalid project data', error });
    }
};
exports.createProject = createProject;
// @desc    Get all projects
// @route   GET /api/projects
// @access  Private
const getProjects = async (req, res) => {
    try {
        // Import Task model to check for user involvement
        const Task = (await Promise.resolve().then(() => __importStar(require('../models/task.model')))).default;
        // Find all projects where user is creator
        const createdProjects = await project_model_1.default.find({ createdBy: req.user._id }).populate('createdBy', 'name email');
        // Find all tasks where user is involved (assignedTo OR createdBy)
        const userTasks = await Task.find({
            $or: [
                { assignedTo: req.user._id },
                { createdBy: req.user._id }
            ]
        }).distinct('project');
        // Find projects where user has tasks
        const taskProjects = await project_model_1.default.find({
            _id: { $in: userTasks }
        }).populate('createdBy', 'name email');
        // Combine and deduplicate projects
        const projectMap = new Map();
        [...createdProjects, ...taskProjects].forEach(p => {
            projectMap.set(p._id.toString(), p);
        });
        const projects = Array.from(projectMap.values());
        res.json(projects);
    }
    catch (error) {
        console.error('Error fetching projects:', error);
        res.status(500).json({ message: 'Server Error' });
    }
};
exports.getProjects = getProjects;
// @desc    Get project by ID
// @route   GET /api/projects/:id
// @access  Private
const getProjectById = async (req, res) => {
    try {
        const project = await project_model_1.default.findById(req.params.id).populate('createdBy', 'name email');
        if (project) {
            res.json(project);
        }
        else {
            res.status(404).json({ message: 'Project not found' });
        }
    }
    catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};
exports.getProjectById = getProjectById;
// @desc    Update project
// @route   PUT /api/projects/:id
// @access  Private (Admin/PM)
const updateProject = async (req, res) => {
    try {
        const project = await project_model_1.default.findById(req.params.id);
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
    }
    catch (error) {
        res.status(400).json({ message: 'Invalid data', error });
    }
};
exports.updateProject = updateProject;
// @desc    Delete project
// @route   DELETE /api/projects/:id
// @access  Private (Admin/PM)
const deleteProject = async (req, res) => {
    try {
        const project = await project_model_1.default.findById(req.params.id);
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
    }
    catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};
exports.deleteProject = deleteProject;
//# sourceMappingURL=project.controller.js.map