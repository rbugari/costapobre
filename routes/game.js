const express = require('express');
const router = express.Router();
const gameController = require('../controllers/gameController');
const authMiddleware = require('../middleware/authMiddleware');

// @route   GET api/game/progress
// @desc    Load current user game state
// @access  Private
router.get('/progress', authMiddleware, gameController.loadProgress);

// @route   POST api/game/progress
// @desc    Save current user game state
// @access  Private
router.post('/progress', authMiddleware, gameController.saveProgress);

// @route   POST api/game/reduce-scandal
// @desc    Reduce BE by spending INF
// @access  Private
router.post('/reduce-scandal', authMiddleware, gameController.reduceScandal);

module.exports = router;
