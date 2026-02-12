const User = require('../models/User');
const Wallet = require('../models/Wallet');
const Task = require('../models/Task');
const Group = require('../models/Group');
const TaskSubmission = require('../models/TaskSubmission');
const mongoose = require('mongoose');

// Helper: Получить карту "CourseID -> Array of TaskIDs"
async function getTasksByCourseMap() {
    const tasks = await Task.find({}, 'topic').populate('topic', 'course');
    const courseTaskMap = {};

    tasks.forEach(task => {
        if (task.topic && task.topic.course) {
            const courseId = task.topic.course.toString();
            if (!courseTaskMap[courseId]) {
                courseTaskMap[courseId] = [];
            }
            courseTaskMap[courseId].push(task._id.toString());
        }
    });

    return courseTaskMap;
}

exports.getDashboardStats = async (req, res) => {
    try {
        // 1. Basic Counters
        const totalStudents = await Wallet.countDocuments();
        const totalTasks = await Task.countDocuments();

        // Sum of all points held by users
        const wealthAgg = await Wallet.aggregate([
            { $group: { _id: null, totalTokens: { $sum: "$tokenBalance" }, totalXP: { $sum: "$points" } } }
        ]);
        const economy = wealthAgg[0] || { totalTokens: 0, totalXP: 0 };

        // 2. Pending Verifications count
        const pendingReviews = await TaskSubmission.countDocuments({ status: 'pending' });

        res.json({
            stats: {
                students: totalStudents,
                tasks: totalTasks,
                economy: economy,
                pendingReviews: pendingReviews
            }
        });
    } catch (error) {
        console.error("Dashboard Stats Error:", error);
        res.status(500).json({ message: "Server error" });
    }
};

exports.getPerformanceMetrics = async (req, res) => {
    try {
        // 1. Prepare Data Maps
        const courseTaskMap = await getTasksByCourseMap();

        // 2. Get Students with Groups populated
        // We only care about students IN GROUPS (enrolled)
        const students = await Wallet.find({ group: { $ne: null } });

        const allGroups = await Group.find().populate('courses');
        const groupMap = {}; // GroupName -> Array of CourseIDs
        allGroups.forEach(g => {
            groupMap[g.name] = g.courses.map(c => c._id.toString());
        });

        // 3. Analyze each student
        const studentPerformance = [];

        for (const student of students) {
            if (!student.group || !groupMap[student.group]) continue; // Skip if group not found or invalid

            const studentCourseIds = groupMap[student.group];
            let totalAssignedTasks = 0;
            let completedAssignedTasks = 0;

            // Calculate assigned tasks based on courses available to group
            studentCourseIds.forEach(cId => {
                if (courseTaskMap[cId]) {
                    const taskIdsInCourse = courseTaskMap[cId];
                    totalAssignedTasks += taskIdsInCourse.length;

                    // Check how many of THESE tasks the student did
                    taskIdsInCourse.forEach(tId => {
                        // student.tasks is a Map
                        if (student.tasks && student.tasks.get(tId)) {
                            completedAssignedTasks++;
                        }
                    });
                }
            });

            // Avoid division by zero
            const progress = totalAssignedTasks > 0 ? (completedAssignedTasks / totalAssignedTasks) * 100 : 0;

            studentPerformance.push({
                username: student.username || 'No Name',
                address: student.address,
                avatarUrl: student.avatarUrl,
                group: student.group,
                progress: Math.round(progress),
                completed: completedAssignedTasks,
                total: totalAssignedTasks
            });
        }

        // 4. Sort Leaders (High Progress) and Debtors (Low Progress but > 0 assigned tasks)
        studentPerformance.sort((a, b) => b.progress - a.progress);

        const leaders = studentPerformance.slice(0, 5); // Top 5

        // Debtors: Assigned tasks > 0 AND Progress < 100 (or a lower threshold like 50%)
        // Let's return bottom 5 who have tasks assigned
        const potentialDebtors = studentPerformance.filter(s => s.total > 0 && s.progress < 50);
        const debtors = potentialDebtors.sort((a, b) => a.progress - b.progress).slice(0, 7); // Worst 7

        res.json({
            leaders,
            debtors
        });

    } catch (error) {
        console.error("Performance Metrics Error:", error);
        res.status(500).json({ message: "Server error" });
    }
};

exports.getActivityChart = async (req, res) => {
    try {
        // Mock data or real aggregation based on TaskSubmission timestamps
        // Real aggregation example (Last 7 days)
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        const activity = await TaskSubmission.aggregate([
            { $match: { submittedAt: { $gte: sevenDaysAgo } } },
            {
                $group: {
                    _id: { $dateToString: { format: "%Y-%m-%d", date: "$submittedAt" } },
                    count: { $sum: 1 }
                }
            },
            { $sort: { _id: 1 } }
        ]);

        res.json(activity);
    } catch (error) {
        res.status(500).json([]);
    }
};
