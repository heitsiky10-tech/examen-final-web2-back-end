import pool from '../configurations/connection';
import { UserRepository } from '../repositories/UserRepository';
import bcrypt from 'bcryptjs';

const createAdmin = async () => {
  const [name, email, password] = process.argv.slice(2);

  if (!name || !email || !password) {
    console.error('Usage: npm run create:admin -- <name> <email> <password>');
    process.exit(1);
  }

  try {
    const userRepository = new UserRepository();
    const existingUser = await userRepository.findByEmail(email);

    if (existingUser) {
      console.error(`Erreur: the email ${email} is already used.`);
      await pool.end();
      process.exit(1);
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const result = await pool.query(
      `INSERT INTO users (name, email, password_hash, role, is_active) 
       VALUES ($1, $2, $3, 'admin', true) RETURNING id, email, role`,
      [name, email, hashedPassword]
    );

    const admin = result.rows[0];
    console.log(`Admin created successfully : #${admin.id} (${admin.email})`);
    await pool.end();
  } catch (error: any) {
    console.error('Faild to create 1 admin :');
    console.error(error?.message || error);
    await pool.end();
    process.exit(1);
  }
};

createAdmin();