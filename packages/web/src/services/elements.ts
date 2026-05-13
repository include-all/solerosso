import api from "@/lib/api";

export interface Element {
  id: string;
  type: string;
  data: any;
  zIndex: number;
  locked: boolean;
  boardId: string;
  createdBy: string | null;
  createdAt: string;
  updatedAt: string;
}

export const elementsApi = {
  getByBoard: async (boardId: string) => {
    const { data } = await api.get<Element[]>(`/api/boards/${boardId}/elements`);
    return data;
  },

  create: async (boardId: string, type: string, elementData: any, zIndex?: number, id?: string) => {
    const { data } = await api.post<Element>(`/api/boards/${boardId}/elements`, {
      id,
      type,
      data: elementData,
      zIndex,
    });
    return data;
  },

  update: async (boardId: string, elementId: string, updates: { data?: any; zIndex?: number; locked?: boolean }) => {
    const { data } = await api.patch<Element>(
      `/api/boards/${boardId}/elements/${elementId}`,
      updates,
    );
    return data;
  },

  delete: async (boardId: string, elementId: string) => {
    const { data } = await api.delete(`/api/boards/${boardId}/elements/${elementId}`);
    return data;
  },
};
