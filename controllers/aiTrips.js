const Campground = require('../models/campground');
const Trip = require('../models/trip');
const ExpressError = require('../utils/ExpressError');
const { ADJUSTMENTS, generateItinerary } = require('../utils/aiPlanner');

const escapeRegex = value => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const findDestinationCampgrounds = async destination => {
    const query = new RegExp(escapeRegex(destination), 'i');
    return Campground.find({
        $or: [
            { location: query },
            { country: query },
            { title: query },
            { description: query }
        ]
    }).sort({ rating: -1, price: 1 }).limit(24);
};

const tripInputFromRequest = trip => ({
    from: trip.from,
    destination: trip.destination,
    days: Number(trip.days),
    budget: Number(trip.budget),
    interests: trip.interests || []
});

const applyPlan = (trip, input, plan) => {
    trip.from = input.from;
    trip.destination = input.destination;
    trip.days = input.days;
    trip.budget = input.budget;
    trip.interests = plan.interests;
    trip.title = plan.title;
    trip.estimatedCost = plan.estimatedCost;
    trip.costBreakdown = plan.costBreakdown;
    trip.budgetSatisfied = plan.budgetSatisfied;
    trip.itinerary = plan.itinerary;
};

module.exports.renderNewForm = (req, res) => {
    res.render('trips/new', { trip: { interests: [] } });
};

module.exports.generateTrip = async (req, res) => {
    const input = tripInputFromRequest(req.body.trip);
    const campgrounds = await findDestinationCampgrounds(input.destination);
    const plan = generateItinerary(input, campgrounds);
    const trip = new Trip({ user: req.user._id });
    applyPlan(trip, input, plan);
    await trip.save();

    if (!plan.hasCampgrounds) {
        req.flash('error', `No YelpCamp campgrounds matched "${input.destination}". The plan has no linked campground recommendations yet.`);
    } else if (!plan.budgetSatisfied) {
        req.flash('error', 'The closest available campground plan exceeds your budget. Review the estimate before booking.');
    } else {
        req.flash('success', 'Your trip plan is ready. Every campground stop is linked to YelpCamp data.');
    }
    res.redirect(`/trips/${trip._id}`);
};

module.exports.index = async (req, res) => {
    const trips = await Trip.find({ user: req.user._id }).sort({ createdAt: -1 });
    res.render('trips/index', { trips });
};

module.exports.showTrip = async (req, res) => {
    const trip = await Trip.findOne({ _id: req.params.id, user: req.user._id })
        .populate('itinerary.activities.campgroundId');
    if (!trip) {
        req.flash('error', 'Cannot find that trip.');
        return res.redirect('/trips');
    }
    res.render('trips/show', { trip });
};

module.exports.regenerateTrip = async (req, res) => {
    const trip = await Trip.findOne({ _id: req.params.id, user: req.user._id });
    if (!trip) throw new ExpressError('Cannot find that trip.', 404);

    const adjustment = ADJUSTMENTS.has(req.body.adjustment) ? req.body.adjustment : undefined;
    const input = tripInputFromRequest(trip);
    const campgrounds = await findDestinationCampgrounds(input.destination);
    const plan = generateItinerary(input, campgrounds, adjustment);
    applyPlan(trip, input, plan);
    await trip.save();

    if (!plan.budgetSatisfied) {
        req.flash('error', 'The regenerated plan is still over budget with the available campgrounds.');
    } else {
        req.flash('success', 'Your trip plan has been regenerated.');
    }
    res.redirect(`/trips/${trip._id}`);
};

module.exports.deleteTrip = async (req, res) => {
    const trip = await Trip.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    if (!trip) throw new ExpressError('Cannot find that trip.', 404);
    req.flash('success', 'Trip deleted.');
    res.redirect('/trips');
};
