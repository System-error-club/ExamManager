const express = require('express');
const cors = require('cors');
const ExamAPI = require('./api.js');

const app = express();
app.use(cors({
    origin: [
        'https://system-error-club.github.io',
        'https://kkc.kevink.tech',
        'http://localhost:3000'  // For local development
    ],
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true
}));
app.use(express.json());

// Exam endpoints
app.get('/api/exams', async (req, res) => {
    try {
        const exams = await ExamAPI.getExams();
        res.json(exams);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/exams', async (req, res) => {
    try {
        const result = await ExamAPI.saveExam(req.body);
        res.json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.put('/api/exams/:id', async (req, res) => {
    try {
        const result = await ExamAPI.updateExam(req.params.id, req.body);
        res.json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.delete('/api/exams/:id', async (req, res) => {
    try {
        const result = await ExamAPI.deleteExam(req.params.id);
        res.json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Admin endpoints
app.get('/api/admins', async (req, res) => {
    try {
        const admins = await ExamAPI.getAdmins();
        res.json(admins);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/admins', async (req, res) => {
    try {
        const result = await ExamAPI.addAdmin(req.body.email);
        res.json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.delete('/api/admins/:email', async (req, res) => {
    try {
        const result = await ExamAPI.removeAdmin(req.params.email);
        res.json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
}); 