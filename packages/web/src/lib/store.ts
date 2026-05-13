import { create } from "zustand";
import { elementsApi, Element } from "@/services/elements";

export type Tool = "select" | "sticky" | "pen" | "rectangle" | "circle" | "arrow" | "text";

export interface WhiteboardElement {
  id: string;
  type: "sticky" | "rectangle" | "circle" | "arrow" | "text" | "freehand";
  x: number;
  y: number;
  width?: number;
  height?: number;
  text?: string;
  fill?: string;
  stroke?: string;
  points?: number[];
  fontSize?: number;
}

interface StageState {
  x: number;
  y: number;
  scale: number;
}

interface WhiteboardState {
  tool: Tool;
  elements: WhiteboardElement[];
  selectedId: string | null;
  stage: StageState;
  isPanning: boolean;
  boardId: string | null;
  setTool: (tool: Tool) => void;
  addElement: (element: WhiteboardElement) => void;
  updateElement: (id: string, updates: Partial<WhiteboardElement>) => void;
  removeElement: (id: string) => void;
  setSelectedId: (id: string | null) => void;
  setStage: (stage: Partial<StageState>) => void;
  setIsPanning: (isPanning: boolean) => void;
  setBoardId: (boardId: string) => void;
  loadElements: () => Promise<void>;
}

// 将 API Element 转换为 WhiteboardElement
function apiElementToWhiteboardElement(element: Element): WhiteboardElement {
  const data = element.data as any;
  return {
    id: element.id,
    type: element.type as WhiteboardElement["type"],
    x: data.x || 0,
    y: data.y || 0,
    width: data.width,
    height: data.height,
    text: data.text,
    fill: data.fill,
    stroke: data.stroke,
    points: data.points,
    fontSize: data.fontSize,
  };
}

export const useWhiteboardStore = create<WhiteboardState>((set, get) => ({
  tool: "select",
  elements: [],
  selectedId: null,
  stage: { x: 0, y: 0, scale: 1 },
  isPanning: false,
  boardId: null,
  setTool: (tool) => set({ tool }),
  setBoardId: (boardId) => set({ boardId }),

  addElement: async (element) => {
    set((state) => ({ elements: [...state.elements, element] }));

    const boardId = get().boardId;
    if (!boardId) return;

    try {
      await elementsApi.create(
        boardId,
        element.type,
        {
          x: element.x,
          y: element.y,
          width: element.width,
          height: element.height,
          text: element.text,
          fill: element.fill,
          stroke: element.stroke,
          points: element.points,
          fontSize: element.fontSize,
        },
        undefined,
        element.id,
      );
    } catch (err) {
      console.error("Failed to save element:", err);
    }
  },

  updateElement: async (id, updates) => {
    const element = get().elements.find((el) => el.id === id);
    const fullData = element ? { ...element, ...updates } : updates;

    set((state) => ({
      elements: state.elements.map((el) =>
        el.id === id ? { ...el, ...updates } : el
      ),
    }));

    const boardId = get().boardId;
    if (!boardId) return;

    try {
      await elementsApi.update(boardId, id, {
        data: {
          x: fullData.x,
          y: fullData.y,
          width: fullData.width,
          height: fullData.height,
          text: fullData.text,
          fill: fullData.fill,
          stroke: fullData.stroke,
          points: fullData.points,
          fontSize: fullData.fontSize,
        },
      });
    } catch (err) {
      console.error("Failed to update element:", err);
    }
  },

  removeElement: async (id) => {
    set((state) => ({
      elements: state.elements.filter((el) => el.id !== id),
      selectedId: state.selectedId === id ? null : state.selectedId,
    }));

    const boardId = get().boardId;
    if (!boardId) return;

    try {
      await elementsApi.delete(boardId, id);
    } catch (err) {
      console.error("Failed to delete element:", err);
    }
  },

  setSelectedId: (id) => set({ selectedId: id }),
  setStage: (stageUpdate) =>
    set((state) => ({ stage: { ...state.stage, ...stageUpdate } })),
  setIsPanning: (isPanning) => set({ isPanning }),

  loadElements: async () => {
    const boardId = get().boardId;
    if (!boardId) return;

    try {
      const elements = await elementsApi.getByBoard(boardId);
      set({ elements: elements.map(apiElementToWhiteboardElement) });
    } catch (err) {
      console.error("Failed to load elements:", err);
    }
  },
}));
