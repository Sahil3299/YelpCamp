const Campground = require('../models/campground');
const ExpressError = require('../utils/ExpressError');
const { cloudinary } = require('../cloudinary');
const { forwardGeocode, reverseGeocode } = require('../utils/maptiler');

const isJsonRequest = req => req.get('Accept') && req.get('Accept').includes('application/json');

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
    if (!req.files || req.files.length === 0) {
        throw new ExpressError('Please upload at least one image.', 400);
    }
    const campgroundData = { ...req.body.campground };
    await geocodeCampground(campgroundData);
    const campground = new Campground(campgroundData);
    campground.author = req.user._id;
    campground.images = req.files.map(f => ({ url: f.path, filename: f.filename }));
    await campground.save();
    req.flash('success', 'Successfully made a new campground!');
    if (isJsonRequest(req)) {
        return res.status(201).json({ redirectUrl: `/campgrounds/${campground._id}` });
    }
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
    const campground = await Campground.findById(id);
    if (!campground) {
        req.flash('error', 'Cannot find that campground!');
        return res.redirect('/campgrounds');
    }

    const campgroundData = { ...req.body.campground };
    await geocodeCampground(campgroundData);

    const newImages = req.files.map(f => ({ url: f.path, filename: f.filename }));
    campground.images.push(...newImages);

    if (req.body.deleteImages && req.body.deleteImages.length > 0) {
        const deleteArr = Array.isArray(req.body.deleteImages)
            ? req.body.deleteImages
            : [req.body.deleteImages];
        for (const filename of deleteArr) {
            await cloudinary.uploader.destroy(filename);
        }
        await campground.updateOne({
            $pull: { images: { filename: { $in: deleteArr } } }
        });
    }

    Object.assign(campground, campgroundData);
    await campground.save();
    req.flash('success', 'Successfully updated campground!');
    if (isJsonRequest(req)) {
        return res.json({ redirectUrl: `/campgrounds/${campground._id}` });
    }
    res.redirect(`/campgrounds/${campground._id}`)
}

module.exports.deleteCampground = async (req, res) => {
    const { id } = req.params;
    const campground = await Campground.findById(id);
    if (campground) {
        for (const img of campground.images) {
            await cloudinary.uploader.destroy(img.filename);
        }
    }
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
