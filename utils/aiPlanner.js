const INTEREST_LABELS = {
    camping: 'camping',
    beaches: 'beaches',
    adventure: 'adventure',
    food: 'local food',
    nightlife: 'nightlife'
};

const ADJUSTMENTS = new Set([
    'cheaper',
    'more-camping',
    'more-beaches',
    'less-travel',
    'more-adventurous',
    'relaxed'
]);

const normaliseInterests = interests => {
    const values = Array.isArray(interests) ? interests : [];
    return [...new Set(values.filter(interest => Object.prototype.hasOwnProperty.call(INTEREST_LABELS, interest)))];
};

const interestSummary = interests => {
    const labels = interests.map(interest => INTEREST_LABELS[interest]);
    if (labels.length === 0) return 'a relaxed campground getaway';
    if (labels.length === 1) return labels[0];
    return `${labels.slice(0, -1).join(', ')} and ${labels[labels.length - 1]}`;
};

const calculateActivityAllowance = interests => {
    const allowances = {
        camping: 0,
        beaches: 100,
        adventure: 650,
        food: 350,
        nightlife: 500
    };
    return Math.max(150, ...interests.map(interest => allowances[interest] || 0));
};

const rankCampgrounds = (campgrounds, adjustment) => {
    const copy = [...campgrounds];
    const keywords = {
        'more-camping': ['camp', 'tent', 'outdoor'],
        'more-beaches': ['beach', 'coast', 'shore', 'sea', 'ocean', 'island'],
        'more-adventurous': ['adventure', 'mountain', 'trail', 'hike', 'river', 'climb', 'forest'],
        relaxed: ['quiet', 'peace', 'calm', 'lake', 'cabin', 'retreat']
    };
    const preferenceScore = campground => {
        const terms = keywords[adjustment];
        if (!terms) return 0;
        const text = [campground.title, campground.location, campground.description]
            .filter(Boolean)
            .join(' ')
            .toLowerCase();
        return terms.reduce((score, term) => score + (text.includes(term) ? 1 : 0), 0);
    };
    return copy.sort((a, b) => {
        if (adjustment === 'cheaper') {
            return (a.price || 0) - (b.price || 0) || (b.rating || 0) - (a.rating || 0);
        }
        const preferenceDifference = preferenceScore(b) - preferenceScore(a);
        if (preferenceDifference !== 0) {
            return preferenceDifference;
        }
        return (b.rating || 0) - (a.rating || 0) || (a.price || 0) - (b.price || 0);
    });
};

const selectCampgrounds = (campgrounds, days, maximumNightlyPrice, adjustment) => {
    const ranked = rankCampgrounds(campgrounds, adjustment);
    const affordable = ranked.filter(campground => (campground.price || 0) <= maximumNightlyPrice);
    const choices = affordable.length > 0 ? affordable : ranked.slice(0, 1);

    if (adjustment === 'less-travel' && choices.length > 0) {
        return Array.from({ length: days }, () => choices[0]);
    }
    return Array.from({ length: days }, (_, index) => choices[index % choices.length]).filter(Boolean);
};

const buildPlannerTitle = ({ destination, interests }) => {
    if (interests.includes('adventure')) return `${destination} Adventure`;
    if (interests.includes('beaches')) return `${destination} Beach Escape`;
    if (interests.includes('camping')) return `${destination} Camping Trip`;
    return `${destination} Getaway`;
};

const makeCampgroundActivity = (campground, day, interests) => ({
    time: day === 1 ? '02:00 PM' : '10:00 AM',
    kind: 'stay',
    title: campground.title,
    description: `Spend day ${day} at this YelpCamp campground in ${campground.location}. Suggested focus: ${interestSummary(interests)}.`,
    campgroundId: campground._id,
    estimatedCost: Math.max(0, campground.price || 0)
});

const makeFallbackActivity = ({ destination, day, interests, activityAllowance }) => ({
    time: day === 1 ? '02:00 PM' : '10:00 AM',
    kind: 'activity',
    title: `Explore ${destination}`,
    description: `Set aside day ${day} for ${interestSummary(interests)}. No matching YelpCamp campground was available to link to this stop.`,
    estimatedCost: activityAllowance
});

const validateItinerary = (itinerary, campgrounds) => {
    const campgroundIds = new Set(campgrounds.map(campground => String(campground._id)));
    return Array.isArray(itinerary) && itinerary.every(day => (
        Number.isInteger(day.day) && day.day > 0 && Array.isArray(day.activities) && day.activities.every(activity => (
            !activity.campgroundId || campgroundIds.has(String(activity.campgroundId))
        ))
    ));
};

const buildPrompt = ({ from, destination, days, budget, interests }, campgrounds) => ({
    userRequest: { from, destination, days, budget, interests },
    campgrounds: campgrounds.map(campground => ({
        id: String(campground._id),
        title: campground.title,
        location: campground.location,
        price: campground.price,
        rating: campground.rating
    })),
    instruction: 'Use only these campground IDs in campground activities and keep the plan within the supplied budget.'
});

const parseAIResponse = response => {
    if (typeof response !== 'string') return response;
    return JSON.parse(response);
};

const generateItinerary = (input, campgrounds, adjustment) => {
    const interests = normaliseInterests(input.interests);
    const safeAdjustment = ADJUSTMENTS.has(adjustment) ? adjustment : undefined;
    const activityAllowancePerDay = calculateActivityAllowance(interests);
    const activityCost = activityAllowancePerDay * input.days;
    const travelCost = safeAdjustment === 'less-travel'
        ? Math.min(1750, Math.max(350, Math.round(input.budget * 0.07)))
        : Math.min(2500, Math.max(500, Math.round(input.budget * 0.1)));
    const maximumNightlyPrice = Math.max(0, Math.floor((input.budget - activityCost - travelCost) / input.days));
    const selectedCampgrounds = selectCampgrounds(campgrounds, input.days, maximumNightlyPrice, safeAdjustment);
    const accommodationCost = selectedCampgrounds.reduce((total, campground) => total + Math.max(0, campground.price || 0), 0);
    const estimatedCost = accommodationCost + activityCost + travelCost;

    const itinerary = Array.from({ length: input.days }, (_, index) => {
        const day = index + 1;
        const campground = selectedCampgrounds[index];
        return {
            day,
            activities: campground
                ? [makeCampgroundActivity(campground, day, interests)]
                : [makeFallbackActivity({ destination: input.destination, day, interests, activityAllowance: activityAllowancePerDay })]
        };
    });

    if (!validateItinerary(itinerary, campgrounds)) {
        throw new Error('The generated itinerary did not pass campground validation.');
    }

    return {
        title: buildPlannerTitle({ destination: input.destination, interests }),
        interests,
        itinerary,
        estimatedCost,
        costBreakdown: {
            accommodation: accommodationCost,
            activities: activityCost,
            travel: travelCost
        },
        budgetSatisfied: estimatedCost <= input.budget,
        hasCampgrounds: selectedCampgrounds.length > 0
    };
};

module.exports = {
    ADJUSTMENTS,
    buildPrompt,
    generateItinerary,
    normaliseInterests,
    parseAIResponse,
    validateItinerary
};
