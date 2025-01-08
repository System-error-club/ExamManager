const express = require('express');
const cors = require('cors');
const sql = require('mssql');

const app = express();

// CORS configuration
app.use(cors({
    origin: [
        'https://system-error-club.github.io',
        'https://kkc.kevink.tech',
    ],
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: false,
    allowedHeaders: ['Content-Type', 'Authorization'],
    exposedHeaders: ['Content-Range', 'X-Content-Range'],
    maxAge: 600
}));

app.use(express.json());

// Database configuration
const config = {
    server: process.env.SQL_SERVER,
    database: process.env.SQL_DATABASE,
    authentication: {
        type: 'default',
        options: {
            userName: process.env.SQL_USER,
            password: process.env.SQL_PASSWORD
        }
    },
    options: {
        encrypt: true
    }
};

// Basic test endpoint
app.get('/', (req, res) => {
    res.json({ message: 'Server is running' });
});

// Test database connection
app.get('/api/test', async (req, res) => {
    try {
        await sql.connect(config);
        const result = await sql.query('SELECT 1 as test');
        res.json({ 
            status: 'success',
            dbConnected: true,
            env: {
                server: process.env.SQL_SERVER,
                database: process.env.SQL_DATABASE
            }
        });
    } catch (error) {
        res.status(500).json({ 
            status: 'error',
            message: error.message,
            dbConnected: false
        });
    }
});

// Get all exams
app.get('/api/exams', async (req, res) => {
    try {
        await sql.connect(config);
        // First get all exams
        const exams = await sql.query(`
            SELECT * FROM Exams
            ORDER BY ExamDate
        `);

        // Then get all resources
        const resources = await sql.query(`
            SELECT * FROM Resources
        `);

        // Group resources by exam
        const examMap = new Map();
        exams.recordset.forEach(exam => {
            examMap.set(exam.Id, {
                ...exam,
                resources: []
            });
        });

        // Add resources to their exams
        resources.recordset.forEach(resource => {
            const exam = examMap.get(resource.ExamId);
            if (exam) {
                exam.resources.push({
                    name: resource.Name,
                    url: resource.Url
                });
            }
        });

        res.json(Array.from(examMap.values()));
    } catch (error) {
        console.error('Error fetching exams:', error);
        res.status(500).json({ error: error.message });
    }
});

// Get all admins
app.get('/api/admins', async (req, res) => {
    try {
        await sql.connect(config);
        const result = await sql.query('SELECT Email FROM Admins');
        res.json(result.recordset.map(row => row.Email));
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Add new exam
app.post('/api/exams', async (req, res) => {
    try {
        await sql.connect(config);
        const exam = req.body;
        console.log('Received exam data:', exam);

        // Validate required fields
        if (!exam.examWeek || !exam.subject || !exam.date || !exam.chapters) {
            return res.status(400).json({ 
                error: 'Missing required fields',
                received: exam 
            });
        }

        const transaction = new sql.Transaction();
        await transaction.begin();

        try {
            const examResult = await transaction.request()
                .input('examWeek', sql.Int, exam.examWeek)
                .input('subject', sql.NVarChar, exam.subject)
                .input('date', sql.Date, exam.date)
                .input('chapters', sql.NVarChar, exam.chapters)
                .query(`
                    INSERT INTO Exams (ExamWeek, Subject, ExamDate, Chapters)
                    OUTPUT INSERTED.*
                    VALUES (@examWeek, @subject, @date, @chapters)
                `);

            const examId = examResult.recordset[0].Id;
            const newExam = examResult.recordset[0];

            // Handle empty resources array
            const resources = exam.resources || [];
            for (const resource of resources) {
                await transaction.request()
                    .input('examId', sql.Int, examId)
                    .input('name', sql.NVarChar, resource.name)
                    .input('url', sql.NVarChar, resource.url)
                    .query(`
                        INSERT INTO Resources (ExamId, Name, Url)
                        VALUES (@examId, @name, @url)
                    `);
            }

            await transaction.commit();
            res.json({ 
                id: examId,
                exam: {
                    ...newExam,
                    resources: resources
                }
            });
        } catch (error) {
            await transaction.rollback();
            throw error;
        }
    } catch (error) {
        console.error('Error creating exam:', error);
        res.status(500).json({ error: error.message });
    }
});

// Update exam
app.put('/api/exams/:id', async (req, res) => {
    try {
        await sql.connect(config);
        const exam = req.body;
        const examId = req.params.id;
        const transaction = new sql.Transaction();
        await transaction.begin();

        try {
            await transaction.request()
                .input('id', sql.Int, examId)
                .input('examWeek', sql.Int, exam.examWeek)
                .input('subject', sql.NVarChar, exam.subject)
                .input('date', sql.Date, new Date(exam.date))
                .input('chapters', sql.NVarChar, exam.chapters)
                .query(`
                    UPDATE Exams 
                    SET ExamWeek = @examWeek,
                        Subject = @subject,
                        ExamDate = @date,
                        Chapters = @chapters,
                        UpdatedAt = GETUTCDATE()
                    WHERE Id = @id
                `);

            await transaction.request()
                .input('examId', sql.Int, examId)
                .query('DELETE FROM Resources WHERE ExamId = @examId');

            for (const resource of exam.resources) {
                await transaction.request()
                    .input('examId', sql.Int, examId)
                    .input('name', sql.NVarChar, resource.name)
                    .input('url', sql.NVarChar, resource.url)
                    .query(`
                        INSERT INTO Resources (ExamId, Name, Url)
                        VALUES (@examId, @name, @url)
                    `);
            }

            await transaction.commit();
            res.json({ success: true });
        } catch (error) {
            await transaction.rollback();
            throw error;
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Delete exam
app.delete('/api/exams/:id', async (req, res) => {
    try {
        await sql.connect(config);
        await sql.query`DELETE FROM Exams WHERE Id = ${req.params.id}`;
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Add admin
app.post('/api/admins', async (req, res) => {
    try {
        await sql.connect(config);
        const { email } = req.body;
        await sql.query`
            IF NOT EXISTS (SELECT 1 FROM Admins WHERE Email = ${email})
            INSERT INTO Admins (Email) VALUES (${email})
        `;
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Remove admin
app.delete('/api/admins/:email', async (req, res) => {
    try {
        await sql.connect(config);
        await sql.query`
            DELETE FROM Admins 
            WHERE Email = ${req.params.email} 
            AND Email != 'kangym727@gmail.com'
        `;
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
}); 