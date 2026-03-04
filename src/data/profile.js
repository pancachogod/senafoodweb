const PROFILE_KEY = 'senafood_profile';

const defaultProfile = {
  name: 'Usuario Demo',
  email: 'usuario@sena.edu.co',
  phone: '3001234567',
  document: '1234567890',
  createdAt: '2026-02-16T00:00:00.000Z',
};

export const getProfile = () => {
  if (typeof window === 'undefined') {
    return defaultProfile;
  }

  try {
    const stored = window.localStorage.getItem(PROFILE_KEY);
    if (!stored) {
      return defaultProfile;
    }
    const parsed = JSON.parse(stored);
    return {
      ...defaultProfile,
      ...parsed,
    };
  } catch (error) {
    return defaultProfile;
  }
};

export const saveProfile = (profile) => {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
};
