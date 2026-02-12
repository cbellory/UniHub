const express = require('express');
const router = express.Router();
const educationController = require('../controllers/educationController');

// Admin Management (Courses)
router.get('/courses', educationController.getCourses);
router.post('/courses', educationController.createCourse);
router.put('/courses/:id', educationController.updateCourse);
router.delete('/courses/:id', educationController.deleteCourse);

// Admin Management (Topics)
router.get('/topics', educationController.getTopics);
router.post('/topics', educationController.createTopic);
router.put('/topics/:id', educationController.updateTopic);
router.delete('/topics/:id', educationController.deleteTopic);

// Admin Management (Groups)
router.get('/groups', educationController.getGroups);
router.post('/groups', educationController.createGroup);
router.put('/groups/:id', educationController.updateGroup);
router.delete('/groups/:id', educationController.deleteGroup);

// Student View (Tree)
router.get('/tree/:groupName', educationController.getStudentTree);

module.exports = router;
