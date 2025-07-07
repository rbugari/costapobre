const express = require('express');
const router = express.Router();
const monetizationController = require('../controllers/monetizationController');
const authMiddleware = require('../middleware/authMiddleware');

// All routes below will be protected by authMiddleware
router.use(authMiddleware);

// Simulate premium pass purchase
router.post('/simulate-premium', monetizationController.simulatePremiumPurchase);

// Simulate scandal rescue purchase
router.post('/simulate-scandal-rescue', monetizationController.simulateScandalRescuePurchase);

// Simulate adding an ad view for guest users
router.post('/simulate-ad-view', monetizationController.simulateAddAdView);

// Admin-only: Set guest user status (this would typically be in an admin panel route)
// For testing purposes, we'll expose it here, but it should be protected by an admin middleware
router.post('/simulate-set-guest', monetizationController.simulateSetGuestUser);

module.exports = router;
