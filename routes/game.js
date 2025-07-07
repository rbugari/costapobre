const express = require('express');
const router = express.Router();
const gameController = require('../controllers/gameController');
const auth = require('../middleware/authMiddleware');

// @route   GET api/game/progress
// @desc    Load current user game state
// @access  Private
router.get('/progress', auth, gameController.loadProgress);

// @route   POST api/game/progress
// @desc    Save current user game state
// @access  Private
router.post('/progress', auth, gameController.saveProgress);

// @route   POST api/game/reduce-scandal
// @desc    Reduce BE by spending INF
// @access  Private
router.post('/reduce-scandal', auth, gameController.reduceScandal);
router.get('/config', auth, gameController.getGameConfig);

// @route   POST api/game/resolve-scandal
// @desc    Resolve scandal event
// @access  Private
router.post('/resolve-scandal', auth, gameController.resolveScandal);

module.exports = router;
