const API_BASE_URL = window.location.origin + '/api';

// Helper function to make authenticated API calls
async function fetchAPI(endpoint, options = {}) {
    const token = localStorage.getItem('token');
    const defaults = {
        headers: {
            'Content-Type': 'application/json',
            ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        }
    };
    
    const response = await fetch(`${API_BASE_URL}${endpoint}`, { ...defaults, ...options });
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Something went wrong');
    }
    return await response.json();
}

// Auth functions
async function login() {
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    try {
        const response = await fetchAPI('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ username, password })
        });

        localStorage.setItem('token', response.token);
        window.location.href = '/';
    } catch (error) {
        alert(error.message || 'Login failed');
    }
}

async function register() {
    const username = document.getElementById('regUsername').value;
    const email = document.getElementById('regEmail').value;
    const password = document.getElementById('regPassword').value;

    try {
        await fetchAPI('/auth/register', {
            method: 'POST',
            body: JSON.stringify({ username, email, password })
        });

        alert('Registration successful! Please login.');
        toggleForm();
    } catch (error) {
        alert(error.message || 'Registration failed');
    }
}

function toggleForm() {
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    
    if (loginForm.style.display === 'none') {
        loginForm.style.display = 'block';
        registerForm.style.display = 'none';
    } else {
        loginForm.style.display = 'none';
        registerForm.style.display = 'block';
    }
}

class ExamAPI {
    static async getExams() {
        try {
            return await fetchAPI('/exams');
        } catch (error) {
            console.error('Error fetching exams:', error);
            throw error;
        }
    }

    static async saveExam(exam) {
        try {
            return await fetchAPI('/exams', {
                method: 'POST',
                body: JSON.stringify(exam)
            });
        } catch (error) {
            console.error('Error saving exam:', error);
            throw error;
        }
    }

    static async updateExam(examId, exam) {
        try {
            return await fetchAPI(`/exams/${examId}`, {
                method: 'PUT',
                body: JSON.stringify(exam)
            });
        } catch (error) {
            console.error('Error updating exam:', error);
            throw error;
        }
    }

    static async deleteExam(examId) {
        try {
            return await fetchAPI(`/exams/${examId}`, {
                method: 'DELETE'
            });
        } catch (error) {
            console.error('Error deleting exam:', error);
            throw error;
        }
    }

    static async getAdmins() {
        try {
            return await fetchAPI('/admins');
        } catch (error) {
            console.error('Error fetching admins:', error);
            throw error;
        }
    }

    static async addAdmin(email) {
        try {
            return await fetchAPI('/admins', {
                method: 'POST',
                body: JSON.stringify({ email })
            });
        } catch (error) {
            console.error('Error adding admin:', error);
            throw error;
        }
    }

    static async removeAdmin(email) {
        try {
            return await fetchAPI(`/admins/${email}`, {
                method: 'DELETE'
            });
        } catch (error) {
            console.error('Error removing admin:', error);
            throw error;
        }
    }
}

// Check if user is logged in
function checkAuth() {
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = '/login';
    }
}

// Logout function
function logout() {
    localStorage.removeItem('token');
    window.location.href = '/login';
}