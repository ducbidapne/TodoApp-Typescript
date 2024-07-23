import express, { Request, Response } from "express";
import Task from "../models/TaskModel";
import User from "../models/UserModel";
import { Types } from "mongoose";
import { body, query, validationResult } from "express-validator";
import { TaskStatus } from "../common/enum/task-status.enum";

exports.getTasks = async (req: Request, res: Response) => {
  try {
    // setTimeout(() => {
    //   throw new Error("BROKEN");
    // }, 2000);
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 5;

    const search = String(req.query.search);
    const skip: number = (page - 1) * limit;

    let query = Task.find();

    if (search) {
      query = query.find({
        $or: [
          { title: { $regex: search, $options: "i" } },
          { content: { $regex: search, $options: "i" } },
        ],
      });
    }
    const totalTasks = await Task.countDocuments(query);
    const totalPages = Math.ceil(totalTasks / limit);

    const tasks = await query
      .find()
      .sort({ create_at: -1 })
      .skip(skip)
      .limit(limit)
      .populate("userId");

    const result = tasks.map((task) => {
      if (task.userId) {
        return {
          userId: task.userId._id,
          assignee: task.userId,
          taskId: task._id,
          title: task.title,
          content: task.content,
          status: task.status,
          create_at: task.create_at,
        };
      }
    });

    return res.status(200).json({
      result,
      totalPages,
      currentPage: page,
    });
  } catch (error) {
    console.error("Error fetching tasks:", error);
    return res.status(500).json({ message: "Server error" });
  }
};
exports.getAllUser = async (req: Request, res: Response) => {
  try {
    const user = await User.find();
    if (!user) {
      return res.status(404).json({ message: "Server error" });
    }

    res.json({ user: user });
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
};

exports.addTask = [
  body("title").notEmpty().withMessage("Title is required"),
  body("content").notEmpty().withMessage("Content is required"),
  body("status")
    .isIn([TaskStatus.TODO, TaskStatus.INPROGRESS, TaskStatus.DONE])
    .withMessage("Invalid status"),
  body("userId").isMongoId().withMessage("Invalid userId"),

  async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { title, content, status, create_at, userId } = req.body;
      const task = new Task({
        title,
        content,
        status,
        create_at: create_at || Date.now(),
        userId,
      });

      const savedTask = await task.save();

      let user = await User.findById(userId);
      if (!user) {
        user = new User({ _id: userId, task: [savedTask._id] });
      } else {
        user?.task.push(savedTask._id);
      }

      await user.save();

      res
        .status(201)
        .json({ message: "Task created successfully", task: savedTask });
    } catch (err) {
      console.error("Error adding task:", err);
      res.status(500).json({ message: "Server error" });
    }
  },
];

exports.deleteTaskById = [
  query("taskId").isMongoId().withMessage("Invalid taskId"),
  query("userId").isMongoId().withMessage("Invalid userId"),

  async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const taskId = req.query.taskId;
      const userId = req.query.userId;
      const task = await Task.findById(taskId);
      if (!task) {
        return res
          .status(404)
          .json({ message: `Task with ID ${taskId} not found` });
      }

      const deletedTask = await Task.findByIdAndDelete(taskId);

      if (!deletedTask) {
        return res.status(404).json({ message: "Task not found" });
      }
      await User.findByIdAndUpdate(userId, {
        $pull: { task: taskId },
      });

      res
        .status(200)
        .json({ message: "Task deleted and user updated successfully" });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Server error" });
    }
  },
];
exports.findTaskByAssignee = async (req: Request, res: Response) => {
  try {
    var userId = req.query.userId;
    if (!userId) {
      return res.status(404).json({ message: "Invalid id" });
    }
    const tasks = await Task.find({ userId: userId })
      .sort({ create_at: -1 })
      .populate("userId");

    let result = tasks.map((task) => {
      if (task.userId) {
        return {
          userId: task.userId._id,
          assignee: task.userId,
          taskId: task._id,
          title: task.title,
          content: task.content,
          status: task.status,
          create_at: task.create_at,
        };
      }
    });

    return res.status(200).json({ result });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};
exports.getTaskById = async (req: Request, res: Response) => {
  try {
    const taskId = String(req.params.taskId);
    // console.log(taskId);
    if (!taskId) {
      return res.status(400).json({ message: "Task id not exist!" });
    }
    const taskById = await Task.findById(taskId).populate("userId");
    if (!taskById) {
      return res.status(404).json({ message: "Task not found" });
    }
    const result = {
      userId: taskById.userId?._id,
      assignee: taskById.userId,
      taskId: taskById._id,
      title: taskById.title,
      content: taskById.content,
      status: taskById.status,
      create_at: taskById.create_at,
    };

    return res.status(200).json({
      result,
    });
  } catch (error) {
    console.log("Get task by id error: ", error);
  }
};

exports.updateTaskById = [
  query("taskId").isMongoId().withMessage("Invalid taskId"),
  body("title").notEmpty().withMessage("Title is required"),
  body("content").notEmpty().withMessage("Content is required"),
  body("status")
    .isIn([TaskStatus.TODO, TaskStatus.INPROGRESS, TaskStatus.DONE])
    .withMessage("Invalid status"),
  body("userId").isMongoId().withMessage("Invalid userId"),

  async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const temp = String(req.query.taskId);
      const taskId = Types.ObjectId.createFromHexString(temp);
      const { title, content, status, userId } = req.body;
      const taskToUpdate = await Task.findById(taskId).populate("userId");
      if (!taskToUpdate) {
        return res.status(404).json({ message: "Task not found" });
      }

      if (taskToUpdate.userId.toString() !== userId) {
        await User.findByIdAndUpdate(taskToUpdate.userId, {
          $pull: { task: taskId },
        });

        let newUser = await User.findById(userId);
        if (!newUser) {
          newUser = new User({ _id: userId, task: [taskId] });
        } else {
          newUser.task.push(taskId);
        }
        await newUser.save();
        taskToUpdate.title = title;
        taskToUpdate.content = content;
        taskToUpdate.status = status;
        taskToUpdate.userId = newUser._id;

        const updatedTask = await taskToUpdate.save();

        return res
          .status(200)
          .json({ message: "Task updated successfully", task: updatedTask });
      } else {
        taskToUpdate.title = title;
        taskToUpdate.content = content;
        taskToUpdate.status = status;

        const updatedTask = await taskToUpdate.save();
        return res
          .status(200)
          .json({ message: "Task updated successfully", task: updatedTask });
      }
    } catch (error) {
      console.error("Error updating task:", error);
      return res.status(500).json({ message: "Server error" });
    }
  },
];
