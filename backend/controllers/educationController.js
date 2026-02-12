const Course = require('../models/Course');
const Topic = require('../models/Topic');
const Group = require('../models/Group');
const Task = require('../models/Task');

// --- COURSE CONTROLLERS ---
exports.getCourses = async (req, res) => {
    try {
        const courses = await Course.find();
        res.json(courses);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.createCourse = async (req, res) => {
    try {
        const course = new Course(req.body);
        const savedCourse = await course.save();
        res.status(201).json(savedCourse);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};

exports.updateCourse = async (req, res) => {
    try {
        const course = await Course.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.json(course);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};

exports.deleteCourse = async (req, res) => {
    try {
        console.log(`[DEBUG] Attempting to delete course: ${req.params.id}`);
        const course = await Course.findById(req.params.id);
        if (!course) {
            console.log(`[DEBUG] Course not found: ${req.params.id}`);
            return res.status(404).json({ message: 'Course not found' });
        }
        await Course.deleteOne({ _id: req.params.id });
        console.log(`[DEBUG] Course deleted successfully: ${req.params.id}`);
        res.json({ message: 'Course deleted' });
    } catch (err) {
        console.error(`[DEBUG] Error deleting course: ${err.message}`);
        res.status(500).json({ message: err.message });
    }
};



// --- TOPIC CONTROLLERS ---
exports.getTopics = async (req, res) => {
    try {
        const { courseId } = req.query;
        const filter = courseId ? { course: courseId } : {};
        const topics = await Topic.find(filter).sort({ order: 1 });
        res.json(topics);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.createTopic = async (req, res) => {
    try {
        const topic = new Topic(req.body);
        const savedTopic = await topic.save();
        res.status(201).json(savedTopic);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};

exports.updateTopic = async (req, res) => {
    try {
        const topic = await Topic.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.json(topic);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};

exports.deleteTopic = async (req, res) => {
    try {
        await Topic.findByIdAndDelete(req.params.id);
        await Task.updateMany({ topic: req.params.id }, { topic: null });
        res.json({ message: 'Topic deleted' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// --- GROUP CONTROLLERS ---
exports.getGroups = async (req, res) => {
    try {
        const groups = await Group.find().populate('courses');
        res.json(groups);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.createGroup = async (req, res) => {
    try {
        const group = new Group(req.body);
        const savedGroup = await group.save();
        res.status(201).json(savedGroup);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};

exports.updateGroup = async (req, res) => {
    try {
        // e.g. add courses to group
        const group = await Group.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.json(group);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};

exports.deleteGroup = async (req, res) => {
    try {
        console.log(`[DEBUG] Attempting to delete group: ${req.params.id}`);
        const group = await Group.findById(req.params.id);
        if (!group) {
            console.log(`[DEBUG] Group not found: ${req.params.id}`);
            return res.status(404).json({ message: 'Group not found' });
        }
        await Group.deleteOne({ _id: req.params.id });
        console.log(`[DEBUG] Group deleted successfully: ${req.params.id}`);
        res.json({ message: 'Group deleted' });
    } catch (err) {
        console.error(`[DEBUG] Error deleting group: ${err.message}`);
        res.status(500).json({ message: err.message });
    }
};

// --- STUDENT TREE FETCH ---
// Get full tree for a specific group (User's view)
exports.getStudentTree = async (req, res) => {
    try {
        const groupName = req.params.groupName;
        const group = await Group.findOne({ name: groupName });

        if (!group) {
            return res.status(404).json({ message: 'Group not found' });
        }

        // 1. Get Courses for this group
        console.log(`[DEBUG] getStudentTree: Fetching tree for group '${groupName}'`);
        const courses = await Course.find({ _id: { $in: group.courses }, isActive: true });
        console.log(`[DEBUG] getStudentTree: Found ${courses.length} active courses for group '${group.name}'`);

        // 2. Build Tree Structure
        const treeData = await Promise.all(courses.map(async (course) => {
            const topics = await Topic.find({ course: course._id }).sort({ order: 1 });
            console.log(`[DEBUG] getStudentTree: Course '${course.title}' has ${topics.length} topics`);

            // Hydrate topics with tasks
            const topicsWithTasks = await Promise.all(topics.map(async (topic) => {
                const tasks = await Task.find({ topic: topic._id, active: true });
                console.log(`[DEBUG] getStudentTree: Topic '${topic.title}' has ${tasks.length} active tasks`);
                return {
                    ...topic.toObject(),
                    tasks
                };
            }));

            return {
                ...course.toObject(),
                topics: topicsWithTasks
            };
        }));

        res.json(treeData);

    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};
