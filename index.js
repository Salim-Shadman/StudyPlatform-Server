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