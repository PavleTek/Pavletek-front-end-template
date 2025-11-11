import api from './api';
import type {
  TwoFactorSetupResponse,
  TwoFactorVerifyRequest,
  TwoFactorStatusResponse,
  TwoFactorVerifySetupRequest,
  TwoFactorVerifySetupResponse,
  LoginResponse,
  ApiResponse,
  RecoveryCodeRequest,
  RecoveryCodeResponse,
  VerifyRecoveryCodeRequest,
  VerifyRecoveryCodeResponse
} from '../types';

export const twoFactorService = {
  async setupTwoFactor(): Promise<TwoFactorSetupResponse> {
    const response = await api.post<ApiResponse & TwoFactorSetupResponse>('/auth/2fa/setup');
    return {
      message: response.data.message,
      secret: response.data.secret,
      qrCode: response.data.qrCode
    };
  },

  async setupTwoFactorMandatory(tempToken: string): Promise<TwoFactorSetupResponse> {
    const response = await api.post<ApiResponse & TwoFactorSetupResponse>('/auth/2fa/setup-mandatory', {
      tempToken
    });
    return {
      message: response.data.message,
      secret: response.data.secret,
      qrCode: response.data.qrCode
    };
  },

  async verifySetup(data: TwoFactorVerifySetupRequest): Promise<TwoFactorVerifySetupResponse> {
    const response = await api.post<ApiResponse & TwoFactorVerifySetupResponse>(
      '/auth/2fa/verify-setup',
      data
    );
    return {
      message: response.data.message
    };
  },

  async verifySetupMandatory(tempToken: string, secret: string, code: string): Promise<LoginResponse> {
    const response = await api.post<ApiResponse & LoginResponse>(
      '/auth/2fa/verify-setup-mandatory',
      { tempToken, secret, code }
    );
    return response.data;
  },

  async verifyTwoFactor(data: TwoFactorVerifyRequest): Promise<LoginResponse> {
    const response = await api.post<ApiResponse & LoginResponse>('/auth/2fa/verify', data);
    return response.data;
  },

  async disableTwoFactor(): Promise<void> {
    await api.post<ApiResponse>('/auth/2fa/disable');
  },

  async getTwoFactorStatus(): Promise<TwoFactorStatusResponse> {
    const response = await api.get<ApiResponse & TwoFactorStatusResponse>('/auth/2fa/status');
    return {
      message: response.data.message,
      enabled: response.data.enabled,
      userEnabled: response.data.userEnabled,
      systemEnabled: response.data.systemEnabled
    };
  },

  async requestRecoveryCode(data: RecoveryCodeRequest): Promise<RecoveryCodeResponse> {
    const response = await api.post<ApiResponse & RecoveryCodeResponse>('/auth/2fa/recovery/request', data);
    return {
      message: response.data.message
    };
  },

  async verifyRecoveryCode(data: VerifyRecoveryCodeRequest): Promise<VerifyRecoveryCodeResponse> {
    const response = await api.post<ApiResponse & VerifyRecoveryCodeResponse>('/auth/2fa/recovery/verify', data);
    return {
      message: response.data.message,
      token: response.data.token,
      user: response.data.user
    };
  }
};

