import { getClinicConfig, updateClinicConfig } from './dataStore';

export const featureFlags = () => getClinicConfig().features;

export const setFeatureFlag = (flag, value) =>
  updateClinicConfig((prev) => ({
    ...prev,
    features: { ...prev.features, [flag]: value },
  }));

export const setBanner = (text) =>
  updateClinicConfig((prev) => ({
    ...prev,
    banner: text || null,
  }));

export const setAppointmentTypes = (types = []) =>
  updateClinicConfig((prev) => ({
    ...prev,
    appointmentTypes: Array.from(new Set(types.filter(Boolean))),
  }));

export const getAdminSettings = () => getClinicConfig();
