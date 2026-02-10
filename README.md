# YelpCamp

YelpCamp is a full-stack web application that allows users to view, create, edit, and review campgrounds. It's built as a Yelp-like platform specifically for camping enthusiasts to share and discover great camping spots.

## Features

- **User Authentication**: Register, login, and logout functionality using Passport.js
- **Campground Management**: Create, view, edit, and delete campgrounds
- **Review System**: Leave reviews and ratings for campgrounds
- **Responsive Design**: Mobile-friendly interface with Bootstrap styling
- **Flash Messages**: User feedback for actions like successful updates or errors
- **Image Upload**: Support for campground images (via URLs)
- **Search and Filter**: Browse campgrounds by location and other criteria

## Tech Stack

- **Backend**: Node.js, Express.js
- **Database**: MongoDB with Mongoose ODM
- **Frontend**: EJS templating engine, Bootstrap CSS framework
- **Authentication**: Passport.js with Local Strategy
- **Validation**: Joi for input validation
- **Session Management**: Express Session with connect-flash
- **Other**: Method Override for PUT/DELETE requests

## Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/yourusername/yelpcamp.git
   cd yelpcamp
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Set up MongoDB**:
   - Ensure MongoDB is installed and running on your system
   - The app connects to `mongodb://localhost:27017/yelp-camp` by default

4. **Seed the database** (optional):
   ```bash
   node seeds/index.js
   ```

5. **Start the server**:
   ```bash
   node app.js
   ```

6. **Open your browser** and navigate to `http://localhost:3000`

## Usage

- Visit the home page to see featured campgrounds
- Register a new account or login with existing credentials
- Browse campgrounds on the index page
- View detailed information about a campground, including reviews
- Add new campgrounds (requires login)
- Edit or delete campgrounds you own
- Leave reviews on campgrounds

## Project Structure

```
yelpcamp/
├── controllers/          # Route handlers
├── models/               # Mongoose schemas
├── routes/               # Express routes
├── views/                # EJS templates
│   ├── campgrounds/      # Campground-related views
│   ├── layouts/          # Base layout templates
│   ├── partials/         # Reusable components
│   └── users/            # User authentication views
├── public/               # Static assets (CSS, JS, images)
├── seeds/                # Database seeding scripts
├── utils/                # Utility functions
├── app.js                # Main application file
├── package.json          # Dependencies and scripts
└── README.md             # This file
```

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request


## Acknowledgments

- Built following the Colt Steele Web Developer Bootcamp curriculum
- Inspired by Yelp.com
- Icons and styling adapted from Bootstrap
