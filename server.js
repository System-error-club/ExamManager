const express = require('express');
const cors = require('cors');
const db = require('./db');
const path = require('path');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const app = express();
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Serve static files
app.use(express.static(path.join(__dirname, 'src/public'), { index: false }));
app.use('/css', express.static(path.join(__dirname, 'src/public/css')));
app.use('/js', express.static(path.join(__dirname, 'src/public/js')));

// CORS configuration
app.use(cors({
    origin: [
        'https://system-error-club.github.io',
        'https://kkc.kevink.tech',
        'http://localhost:3000',
        'http://127.0.0.1:3000'
    ],
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true,
    allowedHeaders: ['Content-Type'],
    maxAge: 600
}));

app.use(express.json());

// ===============================
// Exam Endpoints
// ===============================

// Serve dashboard
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'src/public/dashboard.html'));
});

// Get all exams
app.get('/api/exams', async (req, res) => {
    try {
        const result = await db.query('SELECT * FROM exams ORDER BY exam_date');
        res.json(result);
    } catch (error) {
        console.error('Error fetching exams:', error);
        res.status(500).json({ error: error.message });
    }
});

// Get exam by id
app.get('/api/exams/:id', async (req, res) => {
    try {
        const result = await db.query('SELECT * FROM exams WHERE id = ?', [req.params.id]);
        if (!result || result.length === 0) {
            return res.status(404).json({ error: 'Exam not found' });
        }
        res.json(result[0]);
    } catch (error) {
        console.error('Error fetching exam:', error);
        res.status(500).json({ error: error.message });
    }
});

// Add new exam
app.post('/api/exams', async (req, res) => {
    try {
        const exam = req.body;
        const result = await db.query(
            'INSERT INTO exams (subject, exam_date, chapters, resources) VALUES (?, ?, ?, ?)',
            [
                exam.subject,
                exam.exam_date,
                JSON.stringify(exam.chapters || []),
                JSON.stringify(exam.resources || [])
            ]
        );
        res.status(201).json({ id: result.insertId, ...exam });
    } catch (error) {
        console.error('Error creating exam:', error);
        res.status(500).json({ error: error.message });
    }
});

// Update exam
app.put('/api/exams/:id', async (req, res) => {
    try {
        const exam = req.body;
        const result = await db.query(
            'UPDATE exams SET subject = ?, exam_date = ?, chapters = ?, resources = ? WHERE id = ?',
            [
                exam.subject,
                exam.exam_date,
                JSON.stringify(exam.chapters || []),
                JSON.stringify(exam.resources || []),
                req.params.id
            ]
        );
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Exam not found' });
        }
        res.json({ id: req.params.id, ...exam });
    } catch (error) {
        console.error('Error updating exam:', error);
        res.status(500).json({ error: error.message });
    }
});

// Delete exam
app.delete('/api/exams/:id', async (req, res) => {
    try {
        const result = await db.query('DELETE FROM exams WHERE id = ?', [req.params.id]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Exam not found' });
        }
        res.json({ success: true });
    } catch (error) {
        console.error('Error deleting exam:', error);
        res.status(500).json({ error: error.message });
    }
});

// ===============================
// Authentication Endpoints
// ===============================

// Redirect /login to dashboard for public access
app.get('/login', (req, res) => {
    res.redirect('/');
});

// Global error handler
app.use((err, req, res, next) => {
    console.error('Unhandled error:', err);
    res.status(500).json({ error: 'Internal server error' });
});

const PORT = process.env.PORT || 3000;
// Initialize database and start server
async function startServer() {
    try {
        console.log('Starting server initialization...');
        
        // Initialize the database
        await db.initializeDatabase();
        console.log('Database initialization completed');
        
        // Start the server
        app.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
        });
    } catch (err) {
        console.error('Server initialization failed:', err);
        process.exit(1);
    }
}

// Start the server
console.log('Starting application...');
startServer();


