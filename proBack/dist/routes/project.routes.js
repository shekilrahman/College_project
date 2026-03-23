"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const project_controller_1 = require("../controllers/project.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const router = express_1.default.Router();
// We need to implement adminOrPm middleware or check in controller
// Let's assume we will add adminOrPm middleware next.
router.route('/')
    .post(auth_middleware_1.protect, auth_middleware_1.adminOrPm, project_controller_1.createProject)
    .get(auth_middleware_1.protect, project_controller_1.getProjects);
router.route('/:id')
    .get(auth_middleware_1.protect, project_controller_1.getProjectById)
    .put(auth_middleware_1.protect, auth_middleware_1.adminOrPm, project_controller_1.updateProject)
    .delete(auth_middleware_1.protect, auth_middleware_1.adminOrPm, project_controller_1.deleteProject);
exports.default = router;
//# sourceMappingURL=project.routes.js.map