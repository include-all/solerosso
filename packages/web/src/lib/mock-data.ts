import { Board } from "./types";

export const mockBoards: Board[] = [
  {
    id: "1",
    title: "Product Roadmap Q2",
    description: "Planning and prioritization for Q2 deliverables",
    createdAt: "2024-01-15T10:00:00Z",
    updatedAt: "2024-01-20T14:30:00Z",
    isStarred: true,
  },
  {
    id: "2",
    title: "Architecture Diagram",
    description: "System architecture for the new microservices",
    createdAt: "2024-01-10T08:00:00Z",
    updatedAt: "2024-01-18T16:45:00Z",
    isStarred: true,
  },
  {
    id: "3",
    title: "User Journey Map",
    description: "Mapping the complete user onboarding flow",
    createdAt: "2024-01-05T09:00:00Z",
    updatedAt: "2024-01-15T11:20:00Z",
    isStarred: false,
  },
  {
    id: "4",
    title: "Sprint Retrospective",
    description: "Team retrospective notes and action items",
    createdAt: "2024-01-12T14:00:00Z",
    updatedAt: "2024-01-19T10:00:00Z",
    isStarred: false,
  },
  {
    id: "5",
    title: "Design System Components",
    description: "UI component library documentation",
    createdAt: "2024-01-08T11:00:00Z",
    updatedAt: "2024-01-17T09:15:00Z",
    isStarred: false,
  },
  {
    id: "6",
    title: "API Documentation",
    description: "REST API endpoints and schemas",
    createdAt: "2024-01-03T07:00:00Z",
    updatedAt: "2024-01-14T15:30:00Z",
    isStarred: false,
  },
];
