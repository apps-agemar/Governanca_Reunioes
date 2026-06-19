import { User } from '../types';
import { login } from './api';

export async function authenticateWithLDAPS(networkLogin: string, password: string): Promise<User> {
  const { token, user } = await login(networkLogin, password);
  sessionStorage.setItem('agemar_token', token);
  return user;
}
