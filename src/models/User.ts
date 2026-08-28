export type Role = 'admin' | 'student';

export interface User {
  id: number;
  name: string;
  email: string;
  password_hash: string;
  role: Role;
  is_active: boolean;
  created_at?: Date;
  updated_at?: Date;
}

export interface AuthenticatedUser {
  id: number;
  name: string;
  email: string;
  role: Role;
}

export interface Student {
  id: number;
  name: string;
  email: string;
  is_active: boolean;
  created_at?: Date;
}

export interface CreateUserDTO {
  name: string;
  email: string;
  password_hash: string;
  role: Role;
}

export interface UpdateStudentDTO {
  name: string;
  email: string;
  is_active?: boolean;
  password?: string;
}

export interface Credentials {
  email: string;
  password: string;
}