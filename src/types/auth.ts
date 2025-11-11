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


export interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (credentials: LoginRequest) => Promise<LoginResponse>;
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

export interface ApiResponse {
  message: string;
  [key: string]: any;
}

export interface EmailSender {
  id: number;
  email: string;
  createdAt: string;
}

export interface CreateEmailRequest {
  email: string;
}

export interface Domain {
  id: number;
  domain: string;
  createdAt: string;
}

export interface CreateDomainRequest {
  domain: string;
}

export interface UpdateEmailRequest {
  email?: string;
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

export interface Configuration {
  id: number;
  twoFactorEnabled: boolean;
  appName: string;
  recoveryEmailSenderId?: number | null;
  recoveryEmailSender?: {
    id: number;
    email: string;
  } | null;
  updatedAt: string;
}

export interface TwoFactorSetupResponse {
  message: string;
  secret: string;
  qrCode: string;
}

export interface TwoFactorVerifyRequest {
  tempToken: string;
  code: string;
}

export interface TwoFactorStatusResponse {
  message: string;
  enabled: boolean;
  userEnabled: boolean;
  systemEnabled: boolean;
}

export interface TwoFactorVerifySetupRequest {
  secret: string;
  code: string;
}

export interface TwoFactorVerifySetupResponse {
  message: string;
  token?: string;
  user?: User;
}

export interface LoginResponse {
  message: string;
  token?: string;
  user?: User;
  requiresTwoFactor?: boolean;
  requiresTwoFactorSetup?: boolean;
  tempToken?: string;
}

export interface RecoveryCodeRequest {
  tempToken: string;
}

export interface RecoveryCodeResponse {
  message: string;
}

export interface VerifyRecoveryCodeRequest {
  tempToken: string;
  code: string;
}

export interface VerifyRecoveryCodeResponse {
  message: string;
  token: string;
  user: User;
}

export interface PasswordResetRequest {
  username: string;
}

export interface PasswordResetRequestResponse {
  message: string;
}

export interface PasswordResetVerifyRequest {
  username: string;
  code: string;
  newPassword: string;
}

export interface PasswordResetVerifyResponse {
  message: string;
}

