require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

const app = express();
const port = process.env.PORT || 5000;


app.use(cors({
    origin: [
        'http://localhost:5173',
        'https://ph-assignment-12-ameo.web.app'
    ],
    credentials: true
}));
app.use(express.json());




// DB Connection
const dbURI = process.env.DB_URI;
mongoose.connect(dbURI)
    .then(() => console.log("✅ MongoDB Connected Successfully!"))
    .catch(err => console.error("❌ MongoDB Connection Error:", err));


    
const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, index: true },
    password: { type: String, required: true },
    photoURL: { type: String },
    role: { type: String, enum: ['student', 'tutor', 'admin'], default: 'student' },
    phoneNumber: { type: String },
    address: { type: String }
});
const User = mongoose.model('User', userSchema);




const studySessionSchema = new mongoose.Schema({

    sessionTitle: { type: String, required: true },
    tutorName: { type: String, required: true },
    tutorEmail: { type: String, required: true, index: true },
    sessionDescription: { type: String, required: true },
    imageUrl: { type: String, default: 'https://i.ibb.co/d5bC4T8/default-avatar.jpg' },
    category: { type: String, required: true, index: true },
    registrationStartDate: { type: Date, required: true },
    registrationEndDate: { type: Date, required: true },
    classStartDate: { type: Date, required: true },
    classEndDate: { type: Date, required: true },
    sessionDuration: { type: String, required: true },
    registrationFee: { type: Number, default: 0 },
    status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending', index: true },
    rejectionReason: { type: String },
    feedback: { type: String }

}, { timestamps: true });
const StudySession = mongoose.model('StudySession', studySessionSchema);




const bookedSessionSchema = new mongoose.Schema({

    studentEmail: { type: String, required: true },
    sessionId: { type: mongoose.Schema.Types.ObjectId, ref: 'StudySession', required: true }

}, { timestamps: true });
const BookedSession = mongoose.model('BookedSession', bookedSessionSchema);





const reviewSchema = new mongoose.Schema({

    sessionId: { type: mongoose.Schema.Types.ObjectId, ref: 'StudySession', required: true },
    studentName: { type: String, required: true },
    studentImage: { type: String },
    rating: { type: Number, required: true, min: 1, max: 5 },
    reviewText: { type: String, required: true }
}, { timestamps: true });

const Review = mongoose.model('Review', reviewSchema);

const materialSchema = new mongoose.Schema({

    title: { type: String, required: true },
    sessionId: { type: mongoose.Schema.Types.ObjectId, ref: 'StudySession', required: true },
    tutorEmail: { type: String, required: true },
    imageUrl: { type: String },
    documentLink: { type: String }

}, { timestamps: true });

const Material = mongoose.model('Material', materialSchema);




const noteSchema = new mongoose.Schema({

    studentEmail: { type: String, required: true },
    title: { type: String, required: true },
    description: { type: String, required: true }
}, { timestamps: true });

const Note = mongoose.model('Note', noteSchema);





const loginHistorySchema = new mongoose.Schema({

    email: { type: String, required: true, index: true },
    name: { type: String, required: true },
    role: { type: String, required: true },
    loginTime: { type: Date, default: Date.now }

});


const LoginHistory = mongoose.model('LoginHistory', loginHistorySchema);


const verifyToken = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).send({ message: 'Unauthorized access' });
    }
    const token = authHeader.split(' ')[1];
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
        if (err) {
            return res.status(403).send({ message: 'Forbidden access' });
        }
        req.decoded = decoded;
        next();
    });
};




const verifyRole = (requiredRole) => async (req, res, next) => {
    const email = req.decoded.email;
    try {
        const user = await User.findOne({ email: email });
        if (!user || user.role !== requiredRole) {
            return res.status(403).send({ message: `Requires ${requiredRole} role` });
        }
        req.user = user;
        next();
    } catch (error) {
        res.status(500).send({ message: 'Error verifying role' });
    }
};



//api er routes
app.post('/api/jwt', (req, res) => {
    const user = req.body;
    const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1h' });
    res.send({ token });
});




app.post('/api/auth/register', async (req, res) => {

    try {

        const { name, email, password, photoURL, role } = req.body;
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: 'User already exists with this email.' });
        }
        const hashedPassword = await bcrypt.hash(password, 10);
        const userCount = await User.countDocuments();
        const userRole = userCount === 0 ? 'admin' : role || 'student';
        const newUser = new User({ name, email, password: hashedPassword, photoURL, role: userRole });
        await newUser.save();
        const history = new LoginHistory({ email, name, role: userRole });
        await history.save();
        res.status(201).json({ message: 'User registered successfully!' });
    } catch (error) {
        res.status(500).json({ message: 'Server error during registration.', error: error.message });
    }

});





app.post('/api/auth/social-login', async (req, res) => {

    try {
        const { name, email, photoURL } = req.body;
        let user = await User.findOne({ email });


        if (!user) {
            const randomPassword = Math.random().toString(36).slice(-8);
            const hashedPassword = await bcrypt.hash(randomPassword, 10);
            user = new User({ name, email, password: hashedPassword, photoURL, role: 'student' });
            await user.save();
        }


        const history = new LoginHistory({ email, name, role: user.role });
        await history.save();
        res.status(200).json({ message: 'Login successful' });

    } catch (error) {

        res.status(500).json({ message: 'Server error during social login.', error: error.message });

    }
});





app.post('/api/auth/record-login', async (req, res) => {

    try {
        const { email } = req.body;
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ message: "User not found." });
        }
        const history = new LoginHistory({ email: user.email, name: user.name, role: user.role });
        await history.save();
        res.status(200).json({ message: "Login recorded successfully." });
    } catch (error) {
        res.status(500).json({ message: 'Server error recording login.', error: error.message });
    }
});





app.get('/api/auth/me', verifyToken, async (req, res) => {
    try {
        const user = await User.findOne({ email: req.decoded.email }).select('-password');
        if (!user) {
            return res.status(404).json({ message: "User not found." });
        }
        res.json(user);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});




app.patch('/api/auth/profile', verifyToken, async (req, res) => {
    try {
        const { name, photoURL, phoneNumber, address } = req.body;
        const updatedUser = await User.findOneAndUpdate(
            { email: req.decoded.email },
            { name, photoURL, phoneNumber, address },
            { new: true, runValidators: true }
        ).select('-password');
        if (!updatedUser) {
            return res.status(404).json({ message: "User not found." });
        }
        res.json({ message: 'Profile updated successfully!', user: updatedUser });
    } catch (error) {
        res.status(500).json({ message: 'Server error updating profile.', error: error.message });
    }
});

// public route
app.get('/api/auth/tutors', async (req, res) => {
    try {
        const tutors = await User.find({ role: 'tutor' }).select('name email photoURL');
        res.json(tutors);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

app.get('/api/reviews', async (req, res) => {
    try {
        const reviews = await Review.find({ reviewText: { $exists: true, $ne: '' } })
            .sort({ createdAt: -1 })
            .limit(5);
        res.json(reviews);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

app.get('/api/sessions', async (req, res) => {

    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 6;
        const skip = (page - 1) * limit;
        const { sortBy, order, category } = req.query;
        const currentDate = new Date();

        const query = {
            status: 'approved',
            registrationEndDate: { $gte: currentDate }
        };
        if (category) {
            query.category = category;
        }

        let sortOptions = { createdAt: -1 };
        if (sortBy === 'registrationFee' && (order === 'asc' || order === 'desc')) {
            sortOptions = { registrationFee: order === 'asc' ? 1 : -1 };
        }

        const sessions = await StudySession.find(query)
            .sort(sortOptions)
            .skip(skip)
            .limit(limit);

        const total = await StudySession.countDocuments(query);
        res.json({ sessions, totalPages: Math.ceil(total / limit), currentPage: page });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});




app.get('/api/sessions/:id', async (req, res) => {
    try {
        const session = await StudySession.findById(req.params.id);
        if (!session) {
            return res.status(404).json({ message: "Session not found" });
        }
        const tutor = await User.findOne({ email: session.tutorEmail }).select('name photoURL phoneNumber address');
        const reviews = await Review.find({ sessionId: req.params.id }).sort({ createdAt: -1 });
        let averageRating = 0;
        if (reviews.length > 0) {
            const totalRating = reviews.reduce((acc, review) => acc + review.rating, 0);
            averageRating = (totalRating / reviews.length).toFixed(1);
        }
        res.json({ session, reviews, tutor, averageRating });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});


// Student routes
app.post('/api/student/book-session/:sessionId', verifyToken, verifyRole('student'), async (req, res) => {

    try {
        const { sessionId } = req.params;
        const studentEmail = req.decoded.email;
        const existingBooking = await BookedSession.findOne({ sessionId, studentEmail });
        if (existingBooking) {
            return res.status(400).json({ message: 'You have already booked this session.' });
        }
        const newBooking = new BookedSession({ studentEmail, sessionId });
        await newBooking.save();
        res.status(201).json({ message: 'Session booked successfully!' });
    } catch (error) {
        res.status(500).json({ message: 'Server error while booking session.', error: error.message });
    }
});



app.get('/api/student/my-booked-sessions', verifyToken, verifyRole('student'), async (req, res) => {

    try {
        const sessions = await BookedSession.find({ studentEmail: req.decoded.email }).populate('sessionId');
        res.json(sessions);
    } catch (error) {

        res.status(500).json({ message: error.message });

    }
});






app.post('/api/student/create-review/:sessionId', verifyToken, verifyRole('student'), async (req, res) => {
    try {
        const newReview = new Review({ ...req.body, sessionId: req.params.sessionId });
        await newReview.save();
        res.status(201).json({ message: 'Review submitted successfully.' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }

});




app.post('/api/student/notes/create', verifyToken, verifyRole('student'), async (req, res) => {
    try {
        const newNote = new Note({ ...req.body, studentEmail: req.decoded.email });
        await newNote.save();
        res.status(201).json({ message: 'Note created successfully.' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});





app.get('/api/student/notes', verifyToken, verifyRole('student'), async (req, res) => {
    try {
        const notes = await Note.find({ studentEmail: req.decoded.email });
        res.json(notes);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});





app.patch('/api/student/notes/:id', verifyToken, verifyRole('student'), async (req, res) => {
    try {
        const updatedNote = await Note.findOneAndUpdate(
            { _id: req.params.id, studentEmail: req.decoded.email },
            req.body,
            { new: true, runValidators: true }
        );
        if (!updatedNote) {
            return res.status(404).json({ message: 'Note not found or permission denied.' });
        }
        res.json({ message: 'Note updated successfully.', note: updatedNote });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});




app.delete('/api/student/notes/:id', verifyToken, verifyRole('student'), async (req, res) => {
    try {
        const deletedNote = await Note.findOneAndDelete({ _id: req.params.id, studentEmail: req.decoded.email });
        if (!deletedNote) {
            return res.status(404).json({ message: 'Note not found or permission denied.' });
        }
        res.json({ message: 'Note deleted successfully.' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});