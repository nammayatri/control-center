import { useMutation } from '@tanstack/react-query';
import * as authService from '../services/auth';
import type { LoginModule, FleetConfig } from '../types';

// Module info for UI display
export const MODULE_INFO: Record<LoginModule, { name: string; description: string; color: string }> = {
  BAP: {
    name: 'Customer Dashboard',
    description: 'Manage customers, bookings, and rides',
    color: 'from-blue-500 to-blue-600',
  },
  BPP: {
    name: 'Driver Dashboard',
    description: 'Manage drivers, vehicles, and operations',
    color: 'from-green-500 to-green-600',
  },
  FLEET: {
    name: 'Fleet Dashboard',
    description: 'Manage fleet vehicles and driver assignments',
    color: 'from-purple-500 to-purple-600',
  },
};

// Fleet merchants and cities for selection
export const FLEET_MERCHANTS = [
  { id: 'NAMMA_YATRI_PARTNER', name: 'Namma Yatri Partner' },
  { id: 'YATRI_PARTNER', name: 'Yatri Partner' },
  { id: 'JATRI_SAATHI_PARTNER', name: 'Jatri Saathi Partner' },
  { id: 'Y_PARTNER', name: 'Y Partner' },
];

export const FLEET_CITIES: Record<string, Array<{ id: string; name: string }>> = {
  NAMMA_YATRI_PARTNER: [
    { id: 'Bangalore', name: 'Bangalore' },
    { id: 'Chennai', name: 'Chennai' },
    { id: 'Hyderabad', name: 'Hyderabad' },
    { id: 'Kochi', name: 'Kochi' },
    { id: 'Delhi', name: 'Delhi' },
    { id: 'Mysore', name: 'Mysore' },
    { id: 'Tumkur', name: 'Tumkur' },
  ],
  YATRI_PARTNER: [
    { id: 'Kolkata', name: 'Kolkata' },
  ],
  JATRI_SAATHI_PARTNER: [
    { id: 'Kolkata', name: 'Kolkata' },
    { id: 'Siliguri', name: 'Siliguri' },
  ],
  Y_PARTNER: [
    { id: 'Delhi', name: 'Delhi' },
  ],
};

// ============================================
// BAP Login Hook (Password Based)
// ============================================

export function useBapLogin() {
  return useMutation({
    mutationFn: (data: authService.BapLoginRequest) => authService.loginBap(data),
  });
}

// ============================================
// BPP Login Hook (Password Based)
// ============================================

export function useBppLogin() {
  return useMutation({
    mutationFn: (data: authService.BppLoginRequest) => authService.loginBpp(data),
  });
}

// ============================================
// Fleet Login Hooks (OTP Based)
// ============================================

export function useFleetRequestOtp() {
  return useMutation({
    mutationFn: ({ 
      fleetConfig, 
      data 
    }: { 
      fleetConfig: FleetConfig; 
      data: authService.FleetRequestOtpRequest;
    }) => authService.requestFleetOtp(fleetConfig, data),
  });
}

export function useFleetVerifyOtp() {
  return useMutation({
    mutationFn: ({
      fleetConfig,
      data,
    }: {
      fleetConfig: FleetConfig;
      data: authService.FleetVerifyOtpRequest;
    }) => authService.verifyFleetOtp(fleetConfig, data),
  });
}

// ============================================
// Combined Login Hook (for convenience)
// ============================================

interface RequestOtpParams {
  module: LoginModule;
  data: { mobileNumber: string; mobileCountryCode: string };
  fleetConfig?: FleetConfig;
}

interface VerifyOtpParams {
  module: LoginModule;
  data: { mobileNumber: string; mobileCountryCode: string; otp: string };
  fleetConfig?: FleetConfig;
}

export function useRequestOtp() {
  return useMutation({
    mutationFn: async ({ module, data, fleetConfig }: RequestOtpParams) => {
      if (module === 'FLEET' && fleetConfig) {
        return authService.requestFleetOtp(fleetConfig, data);
      }
      throw new Error('OTP login is only supported for Fleet module');
    },
  });
}

export function useVerifyOtp() {
  return useMutation({
    mutationFn: async ({ module, data, fleetConfig }: VerifyOtpParams) => {
      if (module === 'FLEET' && fleetConfig) {
        return authService.verifyFleetOtp(fleetConfig, data);
      }
      throw new Error('OTP login is only supported for Fleet module');
    },
  });
}

// ============================================
// Logout Hook
// ============================================

export function useLogout() {
  return useMutation({
    mutationFn: (module: LoginModule) => authService.logout(module),
  });
}

