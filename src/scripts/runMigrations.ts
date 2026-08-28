import pool from '../configurations/connection';
import fs from 'fs';
import path from 'path';

const runMigration = async () => {
    try {
        console.log('Executing migrations...');
        const migrationDir = path.join(__dirname, '../../migrations');
        const migrationFiles = fs.readdirSync(migrationDir).sort();
        
        for (const file of migrationFiles) {
            if (file.endsWith('.sql')) {
                const filePath = path.join(migrationDir, file);
                const sql = fs.readFileSync(filePath, 'utf8');
                await pool.query(sql);
                console.log(`Executed ${file}`);
            }
        }
        console.log("All migrations completed successfully !");
        await pool.end();
    } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
};

runMigration();