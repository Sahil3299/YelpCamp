const { campgroundSchema, reviewSchema, tripSchema } = require('./schemas.js');
const ExpressError = require('./utils/ExpressError');
const Campground = require('./models/campground');
const Review = require('./models/review');
const multer = require('multer');
const { storage } = require('./cloudinary');
const upload = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter(req, file, cb) {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new ExpressError('Only image files are allowed (jpeg, png, jpg, webp).', 400), false);
        }
    }
});

module.exports.uploadImages = (req, res, next) => {
    upload.array('image', 6)(req, res, err => {
        if (!err) return next();

        console.error('Campground image upload failed:', {
            name: err.name,
            code: err.code,
            status: err.http_code || err.statusCode
        });

        if (err instanceof multer.MulterError) {
            if (err.code === 'LIMIT_FILE_SIZE') {
                return next(new ExpressError('Each image must be 5MB or smaller.', 400));
            }
            if (err.code === 'LIMIT_FILE_COUNT') {
                return next(new ExpressError('You can upload a maximum of 6 images.', 400));
            }
            return next(new ExpressError('Image upload could not be completed. Please check your files and try again.', 400));
        }

        if (err.message && err.message.includes('Only image files')) {
            return next(err);
        }

        return next(new ExpressError('We could not upload your images right now. Please try again in a moment.', 502));
    });
};

module.exports.isLoggedIn = (req, res, next) => {
    if (!req.isAuthenticated()) {
        req.session.returnTo = req.originalUrl
        req.flash('error', 'You must be signed in first!');
        return res.redirect('/login');
    }
    next();
}

module.exports.validateCampground = (req, res, next) => {
    const { error } = campgroundSchema.validate(req.body);
    if (error) {
        const msg = error.details.map(el => el.message).join(',')
        throw new ExpressError(msg, 400)
    } else {
        next();
    }
}

module.exports.isAuthor = async (req, res, next) => {
    const { id } = req.params;
    const campground = await Campground.findById(id);
    if (!campground.author.equals(req.user._id)) {
        req.flash('error', 'You do not have permission to do that!');
        return res.redirect(`/campgrounds/${id}`);
    }
    next();
}

module.exports.isReviewAuthor = async (req, res, next) => {
    const { id, reviewId } = req.params;
    const review = await Review.findById(reviewId);
    if (!review.author.equals(req.user._id)) {
        req.flash('error', 'You do not have permission to do that!');
        return res.redirect(`/campgrounds/${id}`);
    }
    next();
}

module.exports.validateReview = (req, res, next) => {
    const { error } = reviewSchema.validate(req.body);
    if (error) {
        const msg = error.details.map(el => el.message).join(',')
        throw new ExpressError(msg, 400)
    } else {
        next();
    }
}

module.exports.validateTrip = (req, res, next) => {
    const { error, value } = tripSchema.validate(req.body, {
        abortEarly: false,
        stripUnknown: true
    });
    if (error) {
        const msg = error.details.map(el => el.message).join(', ');
        throw new ExpressError(msg, 400);
    }
    req.body = value;
    next();
}
