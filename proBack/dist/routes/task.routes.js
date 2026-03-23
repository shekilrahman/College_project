"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const task_controller_1 = require("../controllers/task.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const router = express_1.default.Router();
router.route('/')
    .post(auth_middleware_1.protect, task_controller_1.createTask)
    .get(auth_middleware_1.protect, task_controller_1.getTasks);
router.post('/bulk', auth_middleware_1.protect, task_controller_1.createBulkTasks);
router.route('/:id')
    .get(auth_middleware_1.protect, task_controller_1.getTaskById)
    .put(auth_middleware_1.protect, task_controller_1.updateTask)
    .delete(auth_middleware_1.protect, task_controller_1.deleteTask);
// Progress management routes
router.post('/:id/start', auth_middleware_1.protect, task_controller_1.startTask);
router.patch('/:id/progress', auth_middleware_1.protect, task_controller_1.updateProgress);
router.post('/:id/complete', auth_middleware_1.protect, task_controller_1.completeTask);
exports.default = router;
//# sourceMappingURL=task.routes.js.map