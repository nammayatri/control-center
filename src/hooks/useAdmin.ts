import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as adminService from '../services/admin';

// User Hooks
export function useUserList(params: adminService.UserListParams = {}) {
  return useQuery({
    queryKey: ['users', params],
    queryFn: () => adminService.listUsers(params),
  });
}

export function useUserDetail(personId: string | null) {
  return useQuery({
    queryKey: ['user', personId],
    queryFn: () => adminService.listUsers({ personId: personId! }),
    enabled: !!personId,
    select: (data) => data.list?.[0] || null,
  });
}

export function useCreateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: adminService.CreateUserRequest) => adminService.createUser(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });
}

export function useDeleteUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (personId: string) => adminService.deleteUser(personId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });
}

export function useChangeUserEnabledStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ personId, enabled }: { personId: string; enabled: boolean }) =>
      adminService.changeUserEnabledStatus(personId, enabled),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });
}

export function useAssignRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ personId, roleId }: { personId: string; roleId: string }) =>
      adminService.assignRoleToUser(personId, roleId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });
}

export function useChangeUserPassword() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ personId, newPassword }: { personId: string; newPassword: string }) =>
      adminService.changeUserPassword(personId, newPassword),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });
}

export function useChangeUserEmail() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ personId, email }: { personId: string; email: string }) =>
      adminService.changeUserEmail(personId, email),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });
}

export function useChangeUserMobile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ personId, mobileNumber, mobileCountryCode }: { personId: string; mobileNumber: string; mobileCountryCode: string }) =>
      adminService.changeUserMobile(personId, mobileNumber, mobileCountryCode),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });
}

export function useAssignMerchantCityAccess() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ personId, merchantId, operatingCity }: { personId: string; merchantId: string; operatingCity: string }) =>
      adminService.assignMerchantCityAccess(personId, merchantId, operatingCity),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });
}

// Role Hooks
export function useRoleList(params: adminService.RoleListParams = {}) {
  return useQuery({
    queryKey: ['roles', params],
    queryFn: () => adminService.listRoles(params),
  });
}

export function useCreateRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: adminService.CreateRoleRequest) => adminService.createRole(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] });
    },
  });
}

export function useRoleAccessMatrix(roleId: string) {
  return useQuery({
    queryKey: ['roleAccessMatrix', roleId],
    queryFn: () => adminService.getRoleAccessMatrix(roleId),
    enabled: !!roleId,
  });
}

export function useAssignAccessLevel() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ roleId, data }: { roleId: string; data: adminService.AssignAccessLevelRequest }) =>
      adminService.assignAccessLevel(roleId, data),
    onSuccess: (_, { roleId }) => {
      queryClient.invalidateQueries({ queryKey: ['roleAccessMatrix', roleId] });
    },
  });
}

// Merchant Hooks
export function useMerchantList() {
  return useQuery({
    queryKey: ['merchants'],
    queryFn: () => adminService.listMerchants(),
  });
}

export function useMerchantWithCityList() {
  return useQuery({
    queryKey: ['merchantsWithCities'],
    queryFn: () => adminService.getMerchantWithCityList(),
  });
}

export function useCreateMerchant() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: adminService.CreateMerchantRequest) => adminService.createMerchant(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['merchants'] });
    },
  });
}

export function useChangeMerchantEnabledState() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ merchantId, enabled }: { merchantId: string; enabled: boolean }) =>
      adminService.changeMerchantEnabledState(merchantId, enabled),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['merchants'] });
    },
  });
}

// Access Matrix Hooks
export function useAccessMatrix() {
  return useQuery({
    queryKey: ['accessMatrix'],
    queryFn: () => adminService.getAccessMatrix(),
  });
}

export function useUserAccessMatrix() {
  return useQuery({
    queryKey: ['userAccessMatrix'],
    queryFn: () => adminService.getUserAccessMatrix(),
  });
}

// User Profile Hooks
export function useCurrentUser() {
  return useQuery({
    queryKey: ['currentUser'],
    queryFn: () => adminService.getCurrentUser(),
  });
}

export function useCurrentMerchant() {
  return useQuery({
    queryKey: ['currentMerchant'],
    queryFn: () => adminService.getCurrentMerchant(),
  });
}

export function useSwitchMerchant() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (merchantId: string) => adminService.switchMerchant(merchantId),
    onSuccess: () => {
      queryClient.invalidateQueries();
    },
  });
}

export function useChangePassword() {
  return useMutation({
    mutationFn: ({ oldPassword, newPassword }: { oldPassword: string; newPassword: string }) =>
      adminService.changePassword(oldPassword, newPassword),
  });
}

