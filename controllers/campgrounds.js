const Campground = require('../models/campground');
const ExpressError = require('../utils/ExpressError');
const { forwardGeocode, reverseGeocode } = require('../utils/maptiler');

const buildLocationQuery = campgroundData => {
    return [campgroundData.location, campgroundData.country].filter(Boolean).join(', ');
};

const geocodeCampground = async campgroundData => {
    const [place] = await forwardGeocode(buildLocationQuery(campgroundData), { limit: 1 });
    if (!place) {
        throw new ExpressError('We could not find that location. Please choose a more specific address.', 400);
    }

    campgroundData.geometry = place.geometry;
    campgroundData.location = place.label;
    if (!campgroundData.country && place.country) campgroundData.country = place.country;

    return campgroundData;
};

module.exports.index = async (req, res) => {
    const campgrounds = await Campground.find({});
    res.render('campgrounds/index', { campgrounds })
}

module.exports.renderNewForm = (req, res) => {
    res.render('campgrounds/new');
}

module.exports.createCampground = async (req, res, next) => {
    const campgroundData = await geocodeCampground({ ...req.body.campground });
    const campground = new Campground(campgroundData);
    campground.author = req.user._id;

    // Parse comma-separated images string into array
    if (campground.images && typeof campground.images === 'string') {
        campground.images = campground.images
            .split(',')
            .map(img => img.trim())
            .filter(img => img.length > 0);
    }

    await campground.save();
    req.flash('success', 'Successfully made a new campground!');
    res.redirect(`/campgrounds/${campground._id}`)
}

module.exports.showCampground = async (req, res,) => {
    const campground = await Campground.findById(req.params.id).populate({
        path: 'reviews',
        populate: {
            path: 'author'
        }
    }).populate('author');
    if (!campground) {
        req.flash('error', 'Cannot find that campground!');
        return res.redirect('/campgrounds');
    }
    res.render('campgrounds/show', { campground });
}

module.exports.renderEditForm = async (req, res) => {
    const { id } = req.params;
    const campground = await Campground.findById(id)
    if (!campground) {
        req.flash('error', 'Cannot find that campground!');
        return res.redirect('/campgrounds');
    }
    res.render('campgrounds/edit', { campground });
}

module.exports.updateCampground = async (req, res) => {
    const { id } = req.params;
    const campgroundData = { ...req.body.campground };

    // Parse comma-separated images string into array
    if (campgroundData.images && typeof campgroundData.images === 'string') {
        campgroundData.images = campgroundData.images
            .split(',')
            .map(img => img.trim())
            .filter(img => img.length > 0);
    }

    await geocodeCampground(campgroundData);

    const campground = await Campground.findByIdAndUpdate(id, campgroundData, { new: true });
    req.flash('success', 'Successfully updated campground!');
    res.redirect(`/campgrounds/${campground._id}`)
}

module.exports.deleteCampground = async (req, res) => {
    const { id } = req.params;
    await Campground.findByIdAndDelete(id);
    req.flash('success', 'Successfully deleted campground')
    res.redirect('/campgrounds');
}

module.exports.geocode = async (req, res) => {
    const { q, lng, lat } = req.query;

    if (lng && lat) {
        const place = await reverseGeocode(lng, lat);
        return res.json({ features: [place] });
    }

    const features = await forwardGeocode(q, { limit: 6 });
    res.json({ features });
}
