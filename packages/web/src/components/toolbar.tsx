"use client";

import {
  MousePointer2,
  StickyNote,
  Pen,
  Square,
  Circle,
  ArrowRight,
  Type,
  Trash2,
  ZoomIn,
  ZoomOut,
  Undo,
  Redo,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Tool, useWhiteboardStore } from "@/lib/store";
import { cn } from "@/lib/utils";

const tools: { id: Tool; icon: typeof MousePointer2; label: string }[] = [
  { id: "select", icon: MousePointer2, label: "选择" },
  { id: "sticky", icon: StickyNote, label: "便签" },
  { id: "pen", icon: Pen, label: "画笔" },
  { id: "rectangle", icon: Square, label: "矩形" },
  { id: "circle", icon: Circle, label: "圆形" },
  { id: "arrow", icon: ArrowRight, label: "箭头" },
  { id: "text", icon: Type, label: "文本" },
];

export function Toolbar() {
  const { tool, setTool, selectedId, removeElement } = useWhiteboardStore();

  return (
    <div className="absolute left-1/2 top-4 z-10 -translate-x-1/2">
      <div className="flex items-center gap-1 rounded-xl border bg-background/95 p-1 shadow-lg backdrop-blur">
        {tools.map((t) => (
          <Tooltip key={t.id}>
            <TooltipTrigger
              render={
                <Button
                  variant={tool === t.id ? "secondary" : "ghost"}
                  size="icon"
                  className="h-9 w-9"
                  onClick={() => setTool(t.id)}
                />
              }
            >
              <t.icon className="h-4 w-4" />
            </TooltipTrigger>
            <TooltipContent>{t.label}</TooltipContent>
          </Tooltip>
        ))}

        <Separator orientation="vertical" className="mx-1 h-6" />

        <Tooltip>
          <TooltipTrigger
            render={
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9"
                disabled={!selectedId}
                onClick={() => selectedId && removeElement(selectedId)}
              />
            }
          >
            <Trash2 className="h-4 w-4" />
          </TooltipTrigger>
          <TooltipContent>删除</TooltipContent>
        </Tooltip>

        <Separator orientation="vertical" className="mx-1 h-6" />

        <Tooltip>
          <TooltipTrigger
            render={<Button variant="ghost" size="icon" className="h-9 w-9" />}
          >
            <Undo className="h-4 w-4" />
          </TooltipTrigger>
          <TooltipContent>撤销</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger
            render={<Button variant="ghost" size="icon" className="h-9 w-9" />}
          >
            <Redo className="h-4 w-4" />
          </TooltipTrigger>
          <TooltipContent>重做</TooltipContent>
        </Tooltip>

        <Separator orientation="vertical" className="mx-1 h-6" />

        <Tooltip>
          <TooltipTrigger
            render={<Button variant="ghost" size="icon" className="h-9 w-9" />}
          >
            <ZoomIn className="h-4 w-4" />
          </TooltipTrigger>
          <TooltipContent>放大</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger
            render={<Button variant="ghost" size="icon" className="h-9 w-9" />}
          >
            <ZoomOut className="h-4 w-4" />
          </TooltipTrigger>
          <TooltipContent>缩小</TooltipContent>
        </Tooltip>
      </div>
    </div>
  );
}
