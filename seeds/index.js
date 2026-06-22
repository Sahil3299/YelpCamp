const mongoose = require('mongoose');
require('../utils/loadEnv')();
const campgrounds = require('./campgrounds');
const Campground = require('../models/campground');
const User = require('../models/user');

const dbUrl = process.env.MONGO_URI || process.env.DATABASE_URL || 'mongodb://localhost:27017/yelp-camp';
const hasPlaceholderMongoCredentials = /\/\/username:password@/i.test(dbUrl);
const isMongoAuthError = err =>
    err && /requires authentication|authentication failed|auth failed/i.test(err.message);

const seedDB = async () => {
    try {
        // Delete existing data
        await Campground.deleteMany({});

        // Get or create a demo user
        let demoUser = await User.findOne({ username: 'demo' });
        if (!demoUser) {
            demoUser = new User({
                email: 'demo@yelpcamp.com',
                username: 'demo'
            });
            await User.register(demoUser, 'password123');
        }

        // Seed all campgrounds with demo user as author
        for (let camp of campgrounds) {
            const newCamp = new Campground({
                ...camp,
                author: demoUser._id
            });
            await newCamp.save();
        }

        console.log(`Seeded ${campgrounds.length} Indian campgrounds successfully!`);
    } catch (error) {
        console.error('Seeding error:', error);
    }
};

const runSeed = async () => {
    if (hasPlaceholderMongoCredentials) {
        console.error('MongoDB setup error: .env still contains username:password.');
        console.error('Replace it with your real MongoDB login before running the seed script.');
        process.exit(1);
    }

    try {
        await mongoose.connect(dbUrl, {
            useNewUrlParser: true,
            useCreateIndex: true,
            useUnifiedTopology: true
        });

        console.log("Database connected");
        await seedDB();
    } catch (err) {
        if (isMongoAuthError(err)) {
            console.error('MongoDB authentication failed. Check MONGO_URI in .env.');
        } else {
            console.error('MongoDB connection error:', err.message);
        }
    } finally {
        await mongoose.connection.close();
    }
};

runSeed();
