const mongoose = require('mongoose');
const campgrounds = require('./campgrounds');
const Campground = require('../models/campground');
const User = require('../models/user');

mongoose.connect('mongodb://localhost:27017/yelp-camp', {
    useNewUrlParser: true,
    useCreateIndex: true,
    useUnifiedTopology: true
});

const db = mongoose.connection;

db.on("error", console.error.bind(console, "connection error:"));
db.once("open", () => {
    console.log("Database connected");
});

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

        console.log(`✓ Seeded ${campgrounds.length} campgrounds successfully!`);
    } catch (error) {
        console.error('Seeding error:', error);
    }
};

seedDB().then(() => {
    mongoose.connection.close();
});