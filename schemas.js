const Joi = require('joi');

const imageSchema = Joi.object({
    url: Joi.string().required(),
    filename: Joi.string().required()
});

module.exports.campgroundSchema = Joi.object({
    campground: Joi.object({
        title: Joi.string().required(),
        price: Joi.number().required().min(0),
        location: Joi.string().required(),
        country: Joi.string().required(),
        description: Joi.string().required()
    }).required()
});

module.exports.reviewSchema = Joi.object({
    review: Joi.object({
        rating: Joi.number().required().min(1).max(5),
        body: Joi.string().required()
    }).required()
})

module.exports.tripSchema = Joi.object({
    trip: Joi.object({
        from: Joi.string().trim().min(2).max(120).required(),
        destination: Joi.string().trim().min(2).max(120).required(),
        days: Joi.number().integer().min(1).max(30).required(),
        budget: Joi.number().min(0).max(10000000).required(),
        interests: Joi.array()
            .items(Joi.string().valid('camping', 'beaches', 'adventure', 'food', 'nightlife'))
            .max(5)
            .default([])
    }).required()
});
