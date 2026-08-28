import bcrypt from 'bcryptjs';
import { UserRepository } from '../repositories/UserRepository';
import { signAccessToken } from '../security/jwt';
import { HttpError } from '../security/HttpError';
import { Credentials, AuthenticatedUser } from '../models/User';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export class AuthService {
  private userRepository: UserRepository;

  constructor() {
    this.userRepository = new UserRepository();
  }

  async login(credentials: Credentials) {
    this.validate(credentials);

    const user = await this.userRepository.findByEmail(credentials.email);
    if (user && !user.is_active) {
      throw new HttpError(401, 'Account disabled');
    }

    if (!user || !(await bcrypt.compare(credentials.password, user.password_hash))) {
      throw new HttpError(401, 'Invalid email or password');
    }

    const authUser: AuthenticatedUser = { id: user.id, name: user.name, email: user.email, role: user.role };
    return { token: signAccessToken(authUser), user: { id: authUser.id, name: authUser.name, role: authUser.role } };
  }

  private validate({ email, password }: Credentials): void {
    if (!email || !EMAIL_PATTERN.test(email.trim())) {
      throw new HttpError(400, 'Invalid email format');
    }
    if (!password) {
      throw new HttpError(400, 'Password is required');
    }
  }
}