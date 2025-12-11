import { adminApi, apiRequest, buildQueryParams } from './api';
import type { User, Role, Merchant, AccessMatrix, Summary } from '../types';

// ============================================
// User APIs
// ============================================

export type UserListParams = {
  searchString?: string;
  limit?: number;
  offset?: number;
};

export interface UserListResponse {
  list: User[];
  summary: Summary;
}

export async function listUsers(params: UserListParams = {}): Promise<UserListResponse> {
  const query = buildQueryParams(params as Record<string, string | number | boolean | undefined | null>);
  return apiRequest(adminApi, {
    method: 'GET',
    url: `/admin/person/list${query}`,
  });
}

export interface CreateUserRequest {
  firstName: string;
  lastName?: string;
  email?: string;
  mobileNumber: string;
  mobileCountryCode: string;
  roleId?: string;
}

export async function createUser(data: CreateUserRequest): Promise<{ personId: string }> {
  return apiRequest(adminApi, {
    method: 'POST',
    url: '/admin/person/create',
    data,
  });
}

export async function deleteUser(personId: string): Promise<void> {
  return apiRequest(adminApi, {
    method: 'DELETE',
    url: `/admin/person/delete/${personId}`,
  });
}

export async function changeUserEnabledStatus(
  personId: string,
  enabled: boolean
): Promise<void> {
  return apiRequest(adminApi, {
    method: 'POST',
    url: `/admin/person/changeEnabledStatus/${personId}`,
    data: { enabled },
  });
}

export async function changeUserEmail(
  personId: string,
  email: string
): Promise<void> {
  return apiRequest(adminApi, {
    method: 'POST',
    url: `/admin/person/change/email/${personId}`,
    data: { email },
  });
}

export async function changeUserMobile(
  personId: string,
  mobileNumber: string,
  mobileCountryCode: string
): Promise<void> {
  return apiRequest(adminApi, {
    method: 'POST',
    url: `/admin/person/mobile/${personId}`,
    data: { mobileNumber, mobileCountryCode },
  });
}

export async function changeUserPassword(
  personId: string,
  newPassword: string
): Promise<void> {
  return apiRequest(adminApi, {
    method: 'POST',
    url: `/admin/person/password/${personId}`,
    data: { newPassword },
  });
}

export async function assignRoleToUser(
  personId: string,
  roleId: string
): Promise<void> {
  return apiRequest(adminApi, {
    method: 'POST',
    url: `/admin/person/${personId}/assignRole/${roleId}`,
  });
}

export async function assignMerchantAccess(
  personId: string,
  merchantIds: string[]
): Promise<void> {
  return apiRequest(adminApi, {
    method: 'POST',
    url: `/admin/person/${personId}/assignMerchantAccess`,
    data: { merchantIds },
  });
}

export async function assignMerchantCityAccess(
  personId: string,
  merchantId: string,
  cityIds: string[]
): Promise<void> {
  return apiRequest(adminApi, {
    method: 'POST',
    url: `/admin/person/${personId}/assignMerchantCityAccess`,
    data: { merchantId, cityIds },
  });
}

export async function resetMerchantAccess(personId: string): Promise<void> {
  return apiRequest(adminApi, {
    method: 'POST',
    url: `/admin/person/${personId}/resetMerchantAccess`,
  });
}

// ============================================
// Role APIs
// ============================================

export interface RoleListResponse {
  list: Role[];
  summary: Summary;
}

export async function listRoles(): Promise<RoleListResponse> {
  return apiRequest(adminApi, {
    method: 'GET',
    url: '/admin/roles/list',
  });
}

export interface CreateRoleRequest {
  name: string;
  description?: string;
  dashboardAccessType?: string;
}

export async function createRole(data: CreateRoleRequest): Promise<{ roleId: string }> {
  return apiRequest(adminApi, {
    method: 'POST',
    url: '/admin/roles/create',
    data,
  });
}

export async function assignAccessLevel(
  roleId: string,
  accessLevel: string
): Promise<void> {
  return apiRequest(adminApi, {
    method: 'POST',
    url: `/admin/roles/${roleId}/assignAccessLevel`,
    data: { accessLevel },
  });
}

export async function getRoleAccessMatrix(roleId: string): Promise<AccessMatrix[]> {
  return apiRequest(adminApi, {
    method: 'GET',
    url: `/admin/accessMatrix/role/${roleId}`,
  });
}

// ============================================
// Access Matrix APIs
// ============================================

export async function getAccessMatrix(): Promise<AccessMatrix[]> {
  return apiRequest(adminApi, {
    method: 'GET',
    url: '/admin/accessMatrix',
  });
}

export interface MerchantWithCityItem {
  merchantId: string;
  merchantName: string;
  cities: Array<{
    cityId: string;
    cityName: string;
  }>;
}

export async function getMerchantWithCityList(): Promise<MerchantWithCityItem[]> {
  return apiRequest(adminApi, {
    method: 'GET',
    url: '/admin/accessMatrix/merchantWithCityList',
  });
}

// ============================================
// Merchant APIs
// ============================================

export interface MerchantListResponse {
  list: Merchant[];
  summary: Summary;
}

export async function listMerchants(): Promise<MerchantListResponse> {
  return apiRequest(adminApi, {
    method: 'GET',
    url: '/admin/merchant/list',
  });
}

export interface CreateMerchantRequest {
  shortId: string;
  name: string;
  city?: string;
}

export async function createMerchant(data: CreateMerchantRequest): Promise<{ merchantId: string }> {
  return apiRequest(adminApi, {
    method: 'POST',
    url: '/admin/merchant/create',
    data,
  });
}

export async function changeMerchantEnabledState(
  merchantId: string,
  enabled: boolean
): Promise<void> {
  return apiRequest(adminApi, {
    method: 'POST',
    url: '/admin/merchant/change/enableState',
    data: { merchantId, enabled },
  });
}

// ============================================
// Auth APIs
// ============================================

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user: User;
}

export async function login(data: LoginRequest): Promise<LoginResponse> {
  return apiRequest(adminApi, {
    method: 'POST',
    url: '/user/login',
    data,
  });
}

export async function logout(): Promise<void> {
  return apiRequest(adminApi, {
    method: 'POST',
    url: '/user/logout',
  });
}

export async function getCurrentUser(): Promise<User> {
  return apiRequest(adminApi, {
    method: 'GET',
    url: '/user/profile',
  });
}

export async function getCurrentMerchant(): Promise<Merchant> {
  return apiRequest(adminApi, {
    method: 'GET',
    url: '/user/getCurrentMerchant',
  });
}

export async function switchMerchant(merchantId: string): Promise<{ token: string }> {
  return apiRequest(adminApi, {
    method: 'POST',
    url: '/user/switchMerchant',
    data: { merchantId },
  });
}

export async function switchMerchantAndCity(
  merchantId: string,
  cityId: string
): Promise<{ token: string }> {
  return apiRequest(adminApi, {
    method: 'POST',
    url: '/user/switchMerchantAndCity',
    data: { merchantId, city: cityId },
  });
}

export async function getUserAccessMatrix(): Promise<AccessMatrix[]> {
  return apiRequest(adminApi, {
    method: 'GET',
    url: '/user/getAccessMatrix',
  });
}

export async function changePassword(
  oldPassword: string,
  newPassword: string
): Promise<void> {
  return apiRequest(adminApi, {
    method: 'POST',
    url: '/user/changePassword',
    data: { oldPassword, newPassword },
  });
}

export async function enable2FA(): Promise<{ qrCode: string }> {
  return apiRequest(adminApi, {
    method: 'POST',
    url: '/user/enable2Fa',
  });
}

