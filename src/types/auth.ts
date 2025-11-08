export interface User {
  id: number;
  username: string;
  email: string;
  name: string;
  lastName: string;
  chileanRutNumber?: string;
  color?: string;
  lastLogin?: string;
  createdAt?: string;
  createdBy?: number;
  roles: string[];
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  message: string;
  token: string;
  user: User;
}

export interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (credentials: LoginRequest) => Promise<void>;
  logout: () => void;
  updateUser: () => Promise<void>;
  isAuthenticated: boolean;
  isLoading: boolean;
  hasRole: (roleName: string) => boolean;
  hasAnyRole: (roleNames: string[]) => boolean;
}

export interface Role {
  id: number;
  name: string;
}

export interface CreateUserRequest {
  username: string;
  email: string;
  password: string;
  name?: string;
  lastName?: string;
  chileanRutNumber?: string;
  roleIds?: number[];
}

export interface UpdateUserRequest {
  username?: string;
  email?: string;
  name?: string;
  lastName?: string;
  chileanRutNumber?: string;
  color?: string;
}

export interface ChangePasswordRequest {
  password: string;
}

export interface ChangeUserRolesRequest {
  roleIds: number[];
}

export interface CreateRoleRequest {
  name: string;
}

export interface UpdateRoleRequest {
  name: string;
}

export interface ApiResponse<T = any> {
  message: string;
  [key: string]: any;
}

export type EmailProvider = 'GMAIL' | 'OUTLOOK';

export interface EmailSender {
  id: number;
  email: string;
  emailProvider: EmailProvider;
  refreshToken?: string;
  aliases?: string[];
  createdAt: string;
}

export interface CreateEmailRequest {
  email: string;
  emailProvider: EmailProvider;
  refreshToken?: string;
  aliases?: string[];
}

export interface UpdateEmailRequest {
  email?: string;
  emailProvider?: EmailProvider;
  refreshToken?: string;
  aliases?: string[];
}

export interface SendTestEmailRequest {
  fromEmail: string;
  toEmails: string[];
  ccEmails?: string[];
  bccEmails?: string[];
  subject: string;
  content: string;
  attachments?: File[];
}

