const API_BASE_URL = 'https://exammanager-api-hhgaamg9cdephch5.westeurope-01.azurewebsites.net/api';

class ExamAPI {
    static async getExams() {
        try {
            const response = await fetch(`${API_BASE_URL}/exams`);
            if (!response.ok) throw new Error('Failed to fetch exams');
            return await response.json();
        } catch (error) {
            console.error('Error fetching exams:', error);
            throw error;
        }
    }

    static async saveExam(exam) {
        try {
            const response = await fetch(`${API_BASE_URL}/exams`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(exam)
            });
            if (!response.ok) throw new Error('Failed to save exam');
            return await response.json();
        } catch (error) {
            console.error('Error saving exam:', error);
            throw error;
        }
    }

    static async updateExam(examId, exam) {
        try {
            const response = await fetch(`${API_BASE_URL}/exams/${examId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(exam)
            });
            if (!response.ok) throw new Error('Failed to update exam');
            return await response.json();
        } catch (error) {
            console.error('Error updating exam:', error);
            throw error;
        }
    }

    static async deleteExam(examId) {
        try {
            const response = await fetch(`${API_BASE_URL}/exams/${examId}`, {
                method: 'DELETE'
            });
            if (!response.ok) throw new Error('Failed to delete exam');
            return await response.json();
        } catch (error) {
            console.error('Error deleting exam:', error);
            throw error;
        }
    }

    static async getAdmins() {
        try {
            const response = await fetch(`${API_BASE_URL}/admins`);
            if (!response.ok) throw new Error('Failed to fetch admins');
            return await response.json();
        } catch (error) {
            console.error('Error fetching admins:', error);
            throw error;
        }
    }

    static async addAdmin(email) {
        try {
            const response = await fetch(`${API_BASE_URL}/admins`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email })
            });
            if (!response.ok) throw new Error('Failed to add admin');
            return await response.json();
        } catch (error) {
            console.error('Error adding admin:', error);
            throw error;
        }
    }

    static async removeAdmin(email) {
        try {
            const response = await fetch(`${API_BASE_URL}/admins/${email}`, {
                method: 'DELETE'
            });
            if (!response.ok) throw new Error('Failed to remove admin');
            return await response.json();
        } catch (error) {
            console.error('Error removing admin:', error);
            throw error;
        }
    }
}

module.exports = ExamAPI; 