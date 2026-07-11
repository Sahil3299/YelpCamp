const mongoose = require('mongoose');
const Review = require('./review')
const Schema = mongoose.Schema;

const ImageSchema = new Schema({
    url: String,
    filename: String
});

ImageSchema.virtual('thumbnail').get(function () {
    if (this.url) return this.url.replace('/upload/', '/upload/w_200/');
    return '';
});

const CampgroundSchema = new Schema({
    title: String,
    images: [ImageSchema],
    price: Number,
    description: String,
    location: String,
    country: String,
    geometry: {
        type: {
            type: String,
            enum: ['Point'],
            default: 'Point'
        },
        coordinates: {
            type: [Number],
            default: [78.6569, 22.9734]
        }
    },
    rating: {
        type: Number,
        default: 0
    },
    author: {
        type: Schema.Types.ObjectId,
        ref: 'User'
    },
    reviews: [
        {
            type: Schema.Types.ObjectId,
            ref: 'Review'
        }
    ],
    createdAt: {
        type: Date,
        default: Date.now
    }
});

CampgroundSchema.index({ geometry: '2dsphere' });

CampgroundSchema.virtual('thumbnail').get(function () {
    if (this.images && this.images.length > 0) {
        const img = this.images[0];
        const url = typeof img === 'string' ? img : (img && img.url);
        if (url) return url.replace('/upload/', '/upload/w_200/');
    }
    return '';
});

CampgroundSchema.set('toJSON', { virtuals: true });
CampgroundSchema.set('toObject', { virtuals: true });

CampgroundSchema.post('findOneAndDelete', async function (doc) {
    if (doc) {
        await Review.deleteMany({
            _id: {
                $in: doc.reviews
            }
        })
    }
})

module.exports = mongoose.model('Campground', CampgroundSchema);
