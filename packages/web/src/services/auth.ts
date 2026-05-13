import api from "@/lib/api";

export interface User {
  id: string;
  email: string;
  username: string;
  avatar: string | null;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}

export const authApi = {
  register: async (email: string, username: string, password: string) => {
    const { data } = await api.post<AuthResponse>("/api/auth/register", {
      email,
      username,
      password,
    });
    return data;
  },

  login: async (email: string, password: string) => {
    const { data } = await api.post<AuthResponse>("/api/auth/login", {
      email,
      password,
    });
    return data;
  },

  refresh: async (refreshToken: string) => {
    const { data } = await api.post<{ accessToken: string; refreshToken: string }>(
      "/api/auth/refresh",
      { refreshToken },
    );
    return data;
  },

  getMe: async () => {
    const { data } = await api.get<User>("/api/auth/me");
    return data;
  },
};
