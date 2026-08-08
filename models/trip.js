const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const ActivitySchema = new Schema({
    time: {
        type: String,
        required: true
    },
    kind: {
        type: String,
        enum: ['stay', 'activity', 'travel'],
        default: 'activity'
    },
    title: {
        type: String,
        required: true
    },
    description: String,
    campgroundId: {
        type: Schema.Types.ObjectId,
        ref: 'Campground'
    },
    estimatedCost: {
        type: Number,
        default: 0,
        min: 0
    }
}, { _id: false });

const ItineraryDaySchema = new Schema({
    day: {
        type: Number,
        required: true,
        min: 1
    },
    activities: {
        type: [ActivitySchema],
        default: []
    }
}, { _id: false });

const TripSchema = new Schema({
    user: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    from: {
        type: String,
        required: true,
        trim: true
    },
    destination: {
        type: String,
        required: true,
        trim: true
    },
    days: {
        type: Number,
        required: true,
        min: 1,
        max: 30
    },
    budget: {
        type: Number,
        required: true,
        min: 0
    },
    interests: {
        type: [String],
        default: []
    },
    title: {
        type: String,
        required: true,
        trim: true
    },
    estimatedCost: {
        type: Number,
        required: true,
        min: 0
    },
    costBreakdown: {
        accommodation: { type: Number, default: 0, min: 0 },
        activities: { type: Number, default: 0, min: 0 },
        travel: { type: Number, default: 0, min: 0 }
    },
    budgetSatisfied: {
        type: Boolean,
        required: true
    },
    itinerary: {
        type: [ItineraryDaySchema],
        default: []
    },
    plannerVersion: {
        type: String,
        default: 'rules-v1'
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

TripSchema.index({ user: 1, createdAt: -1 });

module.exports = mongoose.model('Trip', TripSchema);
