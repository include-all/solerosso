import { create } from "zustand";

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
  setTool: (tool: Tool) => void;
  addElement: (element: WhiteboardElement) => void;
  updateElement: (id: string, updates: Partial<WhiteboardElement>) => void;
  removeElement: (id: string) => void;
  setSelectedId: (id: string | null) => void;
  setStage: (stage: Partial<StageState>) => void;
  setIsPanning: (isPanning: boolean) => void;
}

export const useWhiteboardStore = create<WhiteboardState>((set) => ({
  tool: "select",
  elements: [],
  selectedId: null,
  stage: { x: 0, y: 0, scale: 1 },
  isPanning: false,
  setTool: (tool) => set({ tool }),
  addElement: (element) =>
    set((state) => ({ elements: [...state.elements, element] })),
  updateElement: (id, updates) =>
    set((state) => ({
      elements: state.elements.map((el) =>
        el.id === id ? { ...el, ...updates } : el
      ),
    })),
  removeElement: (id) =>
    set((state) => ({
      elements: state.elements.filter((el) => el.id !== id),
      selectedId: state.selectedId === id ? null : state.selectedId,
    })),
  setSelectedId: (id) => set({ selectedId: id }),
  setStage: (stageUpdate) =>
    set((state) => ({ stage: { ...state.stage, ...stageUpdate } })),
  setIsPanning: (isPanning) => set({ isPanning }),
}));
