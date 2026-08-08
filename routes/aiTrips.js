const express = require('express');
const router = express.Router();
const aiTrips = require('../controllers/aiTrips');
const catchAsync = require('../utils/catchAsync');
const { isLoggedIn, validateTrip } = require('../middleware');

router.use(isLoggedIn);

router.route('/')
    .get(catchAsync(aiTrips.index));

router.get('/new', aiTrips.renderNewForm);
router.post('/generate', validateTrip, catchAsync(aiTrips.generateTrip));

router.route('/:id')
    .get(catchAsync(aiTrips.showTrip))
    .delete(catchAsync(aiTrips.deleteTrip));

router.post('/:id/regenerate', catchAsync(aiTrips.regenerateTrip));

module.exports = router;
