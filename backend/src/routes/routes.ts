import { Router } from 'express';
const tasksController = require("../controllers/TaskController");

export const routes = Router();

routes.get("/task",tasksController.getTasks);
routes.get("/task-by-id/:taskId",tasksController.getTaskById);
routes.get("/all-user",tasksController.getAllUser);
routes.post("/add-task", tasksController.addTask);
routes.delete("/delete", tasksController.deleteTaskById);
routes.get("/find-task-by-assignee",tasksController.findTaskByAssignee);
routes.put("/update-task",tasksController.updateTaskById);

