const mysql = require('mysql2/promise');

// Default configuration
const defaultConfig = {
    host: '25.47.206.27',
    port: 3306,
    user: 'Admin',
    password: '1234',
    database: 'mochi_db'
};

// Local fallback configuration
const localConfig = {
    host: 'localhost',
    port: 3306,
    user: 'root',
    password: '',
    database: 'mochi_db'
};

const poolConfig = {
    ...defaultConfig,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    enableKeepAlive: true,
    keepAliveInitialDelay: 10000,
    multipleStatements: true
};

// Function to create a connection pool with retries
async function createPool(config, retries = 3) {
    for (let i = 0; i < retries; i++) {
        try {
            console.log('Attempting to connect to MySQL server...');
            const newPool = mysql.createPool(config);
            const connection = await newPool.getConnection();
            await connection.query('SET FOREIGN_KEY_CHECKS = 1'); // Ensure foreign key checks are enabled by default
            console.log('Successfully connected to MySQL server!');
            connection.release();
            return newPool;
        } catch (err) {
            console.error(`Connection attempt ${i + 1} failed:`, {
                message: err.message,
                code: err.code,
                errno: err.errno,
                syscall: err.syscall,
                address: err.address,
                port: err.port,
                config: {
                    host: config.host,
                    port: config.port,
                    user: config.user,
                    database: config.database
                }
            });
            
            if (i === retries - 1) {
                if (config === poolConfig) {
                    console.log('Trying local fallback configuration...');
                    return createPool({
                        ...localConfig,
                        waitForConnections: true,
                        connectionLimit: 10,
                        queueLimit: 0
                    });
                }
                console.error('All connection attempts failed');
                throw err;
            }
            
            await new Promise(resolve => setTimeout(resolve, 2000));
        }
    }
}

// Create the initial pool
let pool = null;

async function getPool() {
    if (!pool) {
        pool = await createPool(poolConfig);
    }
    return pool;
}

// Function to test connection and retry if needed
async function initializeDatabase() {
    try {
        const pool = await getPool();

        // First, find all foreign key constraints referencing exams
        const [constraints] = await pool.query(`
            SELECT 
                i.TABLE_NAME,
                i.CONSTRAINT_NAME
            FROM information_schema.KEY_COLUMN_USAGE i
            WHERE i.REFERENCED_TABLE_NAME = 'exams'
            AND i.REFERENCED_TABLE_SCHEMA = DATABASE()
        `);

        // Disable foreign key checks temporarily
        await pool.query('SET FOREIGN_KEY_CHECKS = 0');

        try {
            // Drop constraints if any exist
            for (const constraint of constraints) {
                console.log(`Dropping foreign key constraint ${constraint.CONSTRAINT_NAME} from table ${constraint.TABLE_NAME}`);
                await pool.query(`
                    ALTER TABLE ${constraint.TABLE_NAME}
                    DROP FOREIGN KEY ${constraint.CONSTRAINT_NAME}
                `);
            }

            // Drop and recreate the exams table
            await pool.query('DROP TABLE IF EXISTS exams');
            
            await pool.query(`
                CREATE TABLE exams (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    subject VARCHAR(255) NOT NULL,
                    exam_date DATETIME NOT NULL,
                    chapters TEXT,
                    resources TEXT,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
                )
            `);

            console.log('Database initialized successfully!');
        } finally {
            // Re-enable foreign key checks
            await pool.query('SET FOREIGN_KEY_CHECKS = 1');
        }
    } catch (error) {
        console.error('Error initializing database:', error);
        throw error;
    }
}

async function testConnection(retries = 3) {
    const currentPool = await getPool();
    for (let i = 0; i < retries; i++) {
        try {
            const connection = await currentPool.getConnection();
            console.log('Connection test successful!');
            await initializeDatabase();
            connection.release();
            return true;
        } catch (err) {
            console.error(`Connection test attempt ${i + 1} failed:`, err.message);
            
            if (i === retries - 1) {
                console.error('All connection test attempts failed');
                throw err;
            }
            
            await new Promise(resolve => setTimeout(resolve, 2000));
        }
    }
}

// Export database functions
module.exports = {
    getPool,
    testConnection,
    initializeDatabase,
    query: async function(sql, params) {
        const pool = await getPool();
        try {
            const [results] = await pool.execute(sql, params);
            return results;
        } catch (error) {
            console.error('Query error:', error);
            throw error;
        }
    },
    execute: async function(sql, params) {
        const pool = await getPool();
        try {
            return await pool.execute(sql, params);
        } catch (error) {
            console.error('Execute error:', error);
            throw error;
        }
    },
    getConnection: async function() {
        const pool = await getPool();
        return pool.getConnection();
    }
};
