const Task = require('../models/Task');
const Wallet = require('../models/Wallet');
const battlePassController = require('./battlePassController'); // ⬅ добавили
const BadgeService = require('../services/badgeService'); // ⬅ Badge auto-awarding

const syncTasks = (walletTasks, allTasks) => {
  try {
    let updatedTasks;

    // Ensure we have a valid Map to start with
    if (walletTasks instanceof Map) {
      updatedTasks = walletTasks;
    } else if (typeof walletTasks === 'object' && walletTasks !== null) {
      updatedTasks = new Map(Object.entries(walletTasks));
    } else {
      updatedTasks = new Map();
    }

    allTasks.forEach(task => {
      // Ensure task._id is valid before converting to string
      if (task && task._id) {
        const taskIdStr = task._id.toString();
        if (!updatedTasks.has(taskIdStr)) {
          updatedTasks.set(taskIdStr, false);
        }
      }
    });

    return updatedTasks;
  } catch (err) {
    console.error("[ERROR] syncTasks failed:", err);
    return new Map(); // Fallback to empty map to prevent crash
  }
};

exports.getAllTasksAdmin = async (req) => {
  try {
    const tasks = await Task.find();
    return tasks;
  } catch (error) {
    console.error("Ошибка в getAllTasksAdmin:", error);
    throw error;
  }
};



exports.completeTask = async (req) => {
  const { address, taskId, secretCode } = req.body;

  if (!address || !taskId) {
    const err = new Error("Адрес кошелька или ID задачи отсутствуют");
    err.status = 400;
    throw err;
  }

  try {
    const wallet = await Wallet.findOne({ address: new RegExp(`^${address}$`, 'i') });
    if (!wallet) {
      return { success: false, status: 404, message: "Кошелек не найден" };
    }

    const task = await Task.findById(taskId);
    if (!task) {
      return { success: false, status: 404, message: "Задание не найдено" };
    }

    if (wallet.tasks.get(taskId)) {
      return { success: false, status: 400, message: "Задание уже выполнено" };
    }

    if (task.type === 'code' && task.secretCode && task.secretCode !== secretCode) {
      return { success: false, status: 400, message: "Неверный секретный код" };
    }

    // QUIZ VALIDATION
    if (task.type === 'quiz') {
      const { quizAnswers } = req.body; // Array of indices selected by user
      if (!Array.isArray(quizAnswers) || !task.quizData || quizAnswers.length !== task.quizData.length) {
        return { success: false, status: 400, message: "Некорректные данные ответов" };
      }

      let correctCount = 0;
      task.quizData.forEach((q, index) => {
        if (q.correctIndex === quizAnswers[index]) correctCount++;
      });

      // Require 100% correct? Or specific passing grade? Let's say 100% for now or > 70%?
      // Plan implied strict validation, let's enforce 100% for simplicity first.
      if (correctCount !== task.quizData.length) {
        return {
          success: false,
          status: 400,
          message: `Тест не пройден. Правильно: ${correctCount} из ${task.quizData.length}`
        };
      }
    }

    // Отмечаем задачу выполненной
    wallet.tasks.set(taskId, true);

    // Добавляем очки за задание
    wallet.points += task.points;
    await wallet.save();

    // --- AUTO-AWARD BADGES ---
    const newBadges = await BadgeService.checkAndAwardBadges(address);

    // Интеграция с Battle Pass (если есть)
    try {
      await battlePassController.addExperience(address, task.points);
    } catch (bpErr) {
      console.error("[Battle Pass] XP award failed:", bpErr.message);
      // Не роняем выполнение задания, даже если Battle Pass сломался
    }

    return {
      success: true,
      message: "Задание выполнено",
      points: wallet.points,
      completedTasks: Array.from(wallet.tasks.entries())
    };
  } catch (error) {
    console.error("Ошибка в completeTask:", error);
    throw error;
  }
};

exports.getTasks = async (req) => {
  const { address } = req.params;
  const { search, type, tags, min_points, max_points, status } = req.query; // Extract query params

  console.log(`[DEBUG] getTasks called for address: ${address} with filters:`, req.query);

  try {
    if (!address) {
      throw new Error("Address is missing in params");
    }

    // Build Query Filter
    let filter = { active: true };

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }
    if (type) {
      filter.type = type;
    }
    if (tags) {
      const tagsArray = Array.isArray(tags) ? tags : tags.split(',').map(t => t.trim());
      if (tagsArray.length > 0) {
        filter.tags = { $in: tagsArray };
      }
    }
    if (min_points || max_points) {
      filter.points = {};
      if (min_points) filter.points.$gte = parseInt(min_points);
      if (max_points) filter.points.$lte = parseInt(max_points);
    }

    // Guest Mode
    if (address.toLowerCase() === 'guest') {
      const tasks = await Task.find(filter);
      return { points: 0, completedTasks: [], availableTasks: tasks };
    }

    const wallet = await Wallet.findOne({ address: new RegExp(`^${address}$`, 'i') });

    if (!wallet) {
      console.log(`[DEBUG] Wallet not found for address: ${address}`);
      return null;
    }

    let tasks = await Task.find(filter);

    // Status Filter (Post-fetch because it depends on user wallet data)
    if (status) {
      if (status === 'completed') {
        tasks = tasks.filter(t => wallet.tasks.get(t._id.toString()));
      } else if (status === 'active' || status === 'pending') {
        tasks = tasks.filter(t => !wallet.tasks.get(t._id.toString()));
      }
    }

    console.log(`[DEBUG] getTasks: Found ${tasks.length} tasks matching filters.`);

    // Sync only matching tasks? Or all? 
    // The original logic synced ALL tasks to the wallet. 
    // If we only fetch filtered tasks, we only sync filtered tasks. 
    // This is fine, but if we want to ensure wallet map is up-to-date with ALL tasks, we might miss some.
    // However, syncing is just "adding false if not exists". 
    // It's better to fetch ALL IDs for syncing if we want perfection, but for performance, syncing only what we return is acceptable.
    // Actually, calling `syncTasks` with a partial list is safe, it just updates those.

    try {
      wallet.tasks = syncTasks(wallet.tasks, tasks);
    } catch (syncErr) {
      console.error("[CRITICAL] Failed to sync tasks:", syncErr);
    }

    // Saving might be overkill on every filter request.
    // Optimizing: only save if we plan to change something critical.
    // But `syncTasks` modifies the map. If we don't save, the map won't have new tasks next time.
    // So we should save.

    try {
      await wallet.save();
    } catch (saveError) {
      if (saveError.name === 'DocumentNotFoundError') {
        const checkWallet = await Wallet.findOne({ address: new RegExp(`^${address}$`, 'i') });
        if (checkWallet) {
          return {
            points: checkWallet.points,
            completedTasks: Array.from(checkWallet.tasks.entries()),
            availableTasks: tasks
          };
        } else {
          return null;
        }
      } else {
        throw saveError;
      }
    }

    return {
      points: wallet.points,
      completedTasks: Array.from(wallet.tasks.entries()),
      availableTasks: tasks
    };
  } catch (error) {
    console.error(`[CRITICAL ERROR] in getTasks for ${address}:`, error);
    throw error;
  }
};

// ----- ИСПРАВЛЕННАЯ ФУНКЦИЯ ЗДЕСЬ -----
exports.updateTask = async (req) => {
  const { id } = req.params;
  const { name, url, points, secretCode, description, topic, prerequisites } = req.body;

  try {
    const task = await Task.findById(id);
    if (!task) return null;

    if (name !== undefined) task.name = name;
    if (url !== undefined) task.url = url;
    if (secretCode !== undefined) task.secretCode = secretCode;
    if (description !== undefined) task.description = description;
    if (topic !== undefined) {
      task.topic = (!topic || topic === 'null') ? null : topic;
    }
    if (prerequisites !== undefined) {
      if (typeof prerequisites === 'string') {
        try { task.prerequisites = JSON.parse(prerequisites); } catch (e) { }
      } else {
        task.prerequisites = prerequisites;
      }
    }

    if (req.body.quizData) {
      let qData = req.body.quizData;
      if (typeof qData === 'string') {
        try { qData = JSON.parse(qData); } catch (e) { }
      }
      if (Array.isArray(qData)) {
        task.quizData = qData;
      }
    }

    if (points !== undefined) {
      const numericPoints = parseInt(points, 10);
      if (!isNaN(numericPoints)) {
        task.points = numericPoints;
      }
    }

    if (req.body.tags) {
      let tags = req.body.tags;
      if (typeof tags === 'string') {
        try {
          // Attempt to parse if it's a JSON string array like '["tag1", "tag2"]'
          tags = JSON.parse(tags);
        } catch (e) {
          // If not JSON, assume comma separated string like "tag1, tag2"
          tags = tags.split(',').map(tag => tag.trim()).filter(tag => tag);
        }
      }
      if (Array.isArray(tags)) {
        task.tags = tags;
      }
    }

    if (req.body.type) {
      task.type = req.body.type;
    }

    if (req.file) {
      task.imageUrl = `/uploads/avatars/${req.file.filename}`;
    }

    await task.save();
    return task;
  } catch (error) {
    console.error("Ошибка в updateTask:", error);
    throw error;
  }
};

// ----- И ИСПРАВЛЕННАЯ ФУНКЦИЯ ЗДЕСЬ -----
exports.addTaskWithImage = async (req) => {
  const { name, url, points, secretCode, description, type, tags: rawTags, quizData: rawQuizData } = req.body;

  console.log("--------------------------------------------------");
  console.log("[DEBUG] addTaskWithImage called");
  console.log("[DEBUG] req.body:", req.body);
  console.log("[DEBUG] req.file:", req.file);
  console.log("--------------------------------------------------");

  // FIX: points might be "0" (string) or 0 (number), verify checks
  // Using loose check != null to allow 0, but check for empty string
  if (!name || !url || points === undefined || points === null || points === '') {
    console.log("[DEBUG] ERROR: VALIDATION FAILED");
    const err = new Error('Все поля должны быть заполнены (name, url, points)');
    err.status = 400;
    throw err;
  }

  try {
    const imageUrl = req.file ? `/uploads/avatars/${req.file.filename}` : null;
    let tags = [];
    if (rawTags) {
      if (typeof rawTags === 'string') {
        try {
          tags = JSON.parse(rawTags);
        } catch (e) {
          tags = rawTags.split(',').map(tag => tag.trim()).filter(tag => tag);
        }
      } else if (Array.isArray(rawTags)) {
        tags = rawTags;
        tags = rawTags;
      }
    }

    let quizData = [];
    if (rawQuizData) {
      if (typeof rawQuizData === 'string') {
        try { quizData = JSON.parse(rawQuizData); } catch (e) { }
      } else if (Array.isArray(rawQuizData)) {
        quizData = rawQuizData;
      }
    }

    const newTask = new Task({
      name,
      url,
      points: Number(points),
      secretCode,
      description,
      imageUrl,
      tags,
      type: type || 'auto',
      quizData,
    });

    await newTask.save();
    return newTask;
  } catch (error) {
    console.error("Ошибка в addTaskWithImage:", error);
    throw error;
  }
};

exports.deleteTask = async (req) => {
  let { id } = req.params;
  console.log("--------------------------------------------------");
  console.log(`[DEBUG] deleteTask called with ID: '${id}' (Length: ${id.length})`);

  // 1. Trim ID
  const trimmedId = id.trim();
  if (id !== trimmedId) {
    console.log(`[DEBUG] WARNING: ID had whitespace! Trimmed to: '${trimmedId}'`);
    id = trimmedId;
  }

  try {
    const mongoose = require('mongoose');

    // 2. Check validity
    if (!mongoose.Types.ObjectId.isValid(id)) {
      console.log(`[DEBUG] ERROR: ID '${id}' is NOT a valid ObjectId`);
      return null;
    }

    // 3. Debug: List ALL task IDs in DB to compare
    const allTasks = await Task.find({}, '_id name');
    console.log(`[DEBUG] Dumping ALL Task IDs in DB (${allTasks.length} total):`);
    allTasks.forEach(t => {
      if (t._id.toString() === id) console.log(`[DEBUG] MATCH FOUND! -> ${t._id} (${t.name})`);
    });
    const exists = allTasks.find(t => t._id.toString() === id);
    if (!exists) {
      console.log(`[DEBUG] NO MATCH FOUND for '${id}' in DB. Closest matches?`);
    }

    // 4. Try explicit findById first
    const objectId = new mongoose.Types.ObjectId(id);

    console.log(`[DEBUG] Step A: Executing Task.findById(objectId)...`);
    const taskToDelete = await Task.findById(objectId);

    if (!taskToDelete) {
      console.log(`[DEBUG] Step A FAILED: Task.findById returned null.`);
      return null;
    }

    console.log(`[DEBUG] Step A SUCCESS: Found task "${taskToDelete.name}". Now deleting...`);

    // 5. Delete using deleteOne on the model with explicit filter
    const deleteResult = await Task.deleteOne({ _id: objectId });
    console.log(`[DEBUG] Step B: deleteOne result:`, deleteResult);

    if (deleteResult.deletedCount === 1) {
      console.log(`[DEBUG] DELETION SUCCESS.`);
      return taskToDelete; // Return the task object as "deleted task"
    } else {
      console.log(`[DEBUG] DELETION FAILED: deletedCount is 0.`);
      return null;
    }
  } catch (error) {
    console.error('Ошибка в deleteTask:', error);
    throw error;
  }
};

// =========================================================
// === MANUALLY VERIFIED TASKS =============================
// =========================================================

const TaskSubmission = require('../models/TaskSubmission');
const fs = require('fs');
const path = require('path');

// 1. Отправка отчета (Submit Task)
exports.submitTaskReport = async (req) => {
  const { address, taskId, submissionText } = req.body;

  if (!address || !taskId) {
    throw new Error("Address and Task ID are required");
  }

  // Проверяем, существует ли таск и имеет ли он тип manual
  const task = await Task.findById(taskId);
  if (!task) throw new Error("Task not found");
  if (task.type !== 'manual') throw new Error("This task is not for manual verification");

  // Проверяем, не выполнено ли уже
  const wallet = await Wallet.findOne({ address: new RegExp(`^${address}$`, 'i') });
  if (wallet && wallet.tasks.get(taskId)) {
    throw new Error("Task already completed");
  }

  // Проверяем, нет ли уже ожидающей заявки
  const existingSubmission = await TaskSubmission.findOne({
    walletAddress: address,
    taskId: taskId,
    status: 'pending'
  });
  if (existingSubmission) {
    throw new Error("Submission already pending");
  }

  let proofImageUrl = null;
  if (req.file) {
    // req.file уже сохранен Multer-ом, но нам нужно убедиться, что путь корректен
    // Мы настроим Multer в роуте, чтобы он сохранял в /uploads/submissions/ADDRESS/
    // Но пока используем путь, который дал Multer
    proofImageUrl = `/uploads/submissions/${req.file.filename}`;

    // *Важное замечание*: в app.js настроен общий multer, который кидает все в uploads/avatars.
    // Мы это поправим, создав отдельный конфиг multer для сабмитов.
  }

  const submission = new TaskSubmission({
    taskId,
    walletAddress: address,
    submissionText,
    proofImageUrl,
    status: 'pending'
  });

  await submission.save();
  return submission;
};

// 2. Получение списка заявок (Admin) - Updated with Aggregation
exports.getPendingSubmissions = async (req) => {
  // Use aggregation to join Wallet data (username, group) based on walletAddress
  try {
    const submissions = await TaskSubmission.aggregate([
      { $match: { status: 'pending' } },
      // Add a lowercase field for case-insensitive matching
      {
        $addFields: {
          walletAddressLower: { $toLower: "$walletAddress" }
        }
      },
      // Join Wallet to get student info (Case Insensitive)
      {
        $lookup: {
          from: 'wallets',
          let: { subAddress: '$walletAddressLower' },
          pipeline: [
            {
              $addFields: {
                addrLower: { $toLower: "$address" }
              }
            },
            {
              $match: {
                $expr: { $eq: ["$addrLower", "$$subAddress"] }
              }
            }
          ],
          as: 'walletInfo'
        }
      },
      // Join Task to get task info (similar to populate)
      {
        $lookup: {
          from: 'tasks',
          localField: 'taskId',
          foreignField: '_id',
          as: 'taskInfo'
        }
      },
      // Unwind arrays (lookup returns an array)
      { $unwind: { path: '$walletInfo', preserveNullAndEmptyArrays: true } },
      { $unwind: { path: '$taskInfo', preserveNullAndEmptyArrays: true } },

      // Project final shape
      {
        $project: {
          _id: 1,
          status: 1,
          submissionText: 1,
          proofImageUrl: 1,
          submittedAt: 1,
          walletAddress: 1,
          // Map task info (renaming taskInfo back to taskId to match frontend expectation or keep new name)
          // Frontend expects 'taskId' to be an object with name/points.
          taskId: {
            _id: '$taskInfo._id',
            name: '$taskInfo.name',
            points: '$taskInfo.points',
            imageUrl: '$taskInfo.imageUrl'
          },
          // Add student info
          studentName: '$walletInfo.username',
          studentGroup: '$walletInfo.group',
          studentAvatar: '$walletInfo.avatarUrl' // Add avatar URL
        }
      },
      { $sort: { submittedAt: 1 } }
    ]);

    return submissions;
  } catch (error) {
    console.error("Aggregation error in getPendingSubmissions:", error);
    throw error;
  }
};

// 3. Проверка заявки (Admin Review)
exports.reviewSubmission = async (req) => {
  const { submissionId, action, comment } = req.body; // action: 'approve' | 'reject'

  const submission = await TaskSubmission.findById(submissionId);
  if (!submission) throw new Error("Submission not found");

  if (submission.status !== 'pending') {
    throw new Error("Submission is not pending");
  }

  submission.reviewedAt = Date.now();
  submission.adminComment = comment;

  if (action === 'reject') {
    submission.status = 'rejected';
    await submission.save();
    return { success: true, status: 'rejected' };
  }

  if (action === 'approve') {
    submission.status = 'approved';
    await submission.save();

    // НАЧИСЛЕНИЕ НАГРАДЫ (Логика из completeTask)
    const wallet = await Wallet.findOne({ address: new RegExp(`^${submission.walletAddress}$`, 'i') });
    const task = await Task.findById(submission.taskId);

    if (wallet && task) {
      // Отмечаем задачу выполненной
      wallet.tasks.set(task._id.toString(), true);
      // Добавляем очки
      wallet.points += task.points;
      await wallet.save();

      // Updating Battle Pass
      try {
        await battlePassController.updateBattlePass({
          body: {
            address: submission.walletAddress,
            pointsEarned: task.points,
          },
          ip: '127.0.0.1', // Placeholder IP
        });
      } catch (e) {
        console.error("BP update error in reviewSubmission:", e);
      }
    }
    return { success: true, status: 'approved' };
  }

  throw new Error("Invalid action");
};
