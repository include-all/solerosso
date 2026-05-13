import api from "@/lib/api";

export interface Board {
  id: string;
  title: string;
  description: string | null;
  isPublic: boolean;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
  members?: BoardMember[];
}

export interface BoardMember {
  id: string;
  role: string;
  userId: string;
  boardId: string;
  user: {
    id: string;
    username: string;
    avatar: string | null;
  };
}

export const boardsApi = {
  getAll: async (search?: string, starred?: boolean) => {
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (starred) params.set("starred", "true");
    const { data } = await api.get<Board[]>(`/api/boards?${params.toString()}`);
    return data;
  },

  getById: async (id: string) => {
    const { data } = await api.get<Board>(`/api/boards/${id}`);
    return data;
  },

  create: async (title: string, description?: string) => {
    const { data } = await api.post<Board>("/api/boards", { title, description });
    return data;
  },

  update: async (id: string, updates: { title?: string; description?: string }) => {
    const { data } = await api.patch<Board>(`/api/boards/${id}`, updates);
    return data;
  },

  delete: async (id: string) => {
    const { data } = await api.delete(`/api/boards/${id}`);
    return data;
  },

  addMember: async (boardId: string, email: string, role: string = "editor") => {
    const { data } = await api.post<BoardMember>(`/api/boards/${boardId}/members`, {
      email,
      role,
    });
    return data;
  },

  removeMember: async (boardId: string, memberUserId: string) => {
    const { data } = await api.delete(`/api/boards/${boardId}/members/${memberUserId}`);
    return data;
  },
};
