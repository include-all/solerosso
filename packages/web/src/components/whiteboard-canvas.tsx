"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import {
  Stage,
  Layer,
  Rect,
  Circle,
  Arrow,
  Text,
  Line,
  Group,
  Transformer,
} from "react-konva";
import { KonvaEventObject } from "konva/lib/Node";
import { useWhiteboardStore, WhiteboardElement } from "@/lib/store";
import { v4 as uuidv4 } from "uuid";
import Konva from "konva";

const COLORS = {
  sticky: "#FEF08A",
  stickyText: "#854D0E",
  shape: "#818CF8",
  shapeStroke: "#6366F1",
  text: "#1E293B",
};

const MIN_SCALE = 0.1;
const MAX_SCALE = 5;

function getTextPosition(element: WhiteboardElement) {
  if (element.type === "sticky") {
    return { x: element.x + 12, y: element.y + 12 };
  }
  return { x: element.x, y: element.y };
}

function getTextAreaStyle(
  element: WhiteboardElement,
  stageX: number,
  stageY: number,
  stageScale: number,
) {
  const { x, y } = getTextPosition(element);

  const textAreaWidth = element.type === "sticky" ? (element.width ?? 150) - 24 : 200;
  const textAreaHeight = element.type === "sticky" ? (element.height ?? 150) - 24 : 30;
  const fontSize = element.fontSize ?? 14;

  return {
    left: x * stageScale + stageX,
    top: y * stageScale + stageY,
    width: textAreaWidth * stageScale,
    height: textAreaHeight,
    fontSize: fontSize,
    fontFamily: "Inter",
  };
}

export function WhiteboardCanvas() {
  const stageRef = useRef<Konva.Stage>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const transformerRef = useRef<Konva.Transformer>(null);
  const textAreaRef = useRef<HTMLTextAreaElement>(null);
  const {
    tool,
    elements,
    selectedId,
    stage,
    isPanning,
    addElement,
    updateElement,
    setSelectedId,
    setTool,
    setStage,
    setIsPanning,
  } = useWhiteboardStore();

  const [isDrawing, setIsDrawing] = useState(false);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  const [currentLine, setCurrentLine] = useState<number[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [lastPanPos, setLastPanPos] = useState({ x: 0, y: 0 });

  const editingElement = editingId ? elements.find((e) => e.id === editingId) : null;

  const handleStageClick = useCallback(
    (e: KonvaEventObject<MouseEvent>) => {
      if (isPanning) return;
      const clickedOnEmpty = e.target === e.target.getStage();
      if (clickedOnEmpty) {
        setSelectedId(null);
      }
    },
    [setSelectedId, isPanning],
  );

  const handleWheel = useCallback(
    (e: KonvaEventObject<WheelEvent>) => {
      e.evt.preventDefault();
      const stage = stageRef.current;
      if (!stage) return;

      const oldScale = stage.scaleX();
      const pointer = stage.getPointerPosition();
      if (!pointer) return;

      const mousePointTo = {
        x: (pointer.x - stage.x()) / oldScale,
        y: (pointer.y - stage.y()) / oldScale,
      };

      const direction = e.evt.deltaY > 0 ? -1 : 1;
      const factor = 1.1;
      const newScale = Math.min(Math.max(oldScale * (direction > 0 ? factor : 1 / factor), MIN_SCALE), MAX_SCALE);

      setStage({
        scale: newScale,
        x: pointer.x - mousePointTo.x * newScale,
        y: pointer.y - mousePointTo.y * newScale,
      });
    },
    [setStage],
  );

  const handleMouseDown = useCallback(
    (e: KonvaEventObject<MouseEvent>) => {
      const isMiddleButton = e.evt.button === 1;
      if (isMiddleButton || (tool === "select" && e.target === e.target.getStage())) {
        setIsPanning(true);
        setLastPanPos({ x: e.evt.clientX, y: e.evt.clientY });
        e.evt.preventDefault();
        return;
      }
    },
    [tool, setIsPanning],
  );

  const handleMouseMove = useCallback(
    (e: KonvaEventObject<MouseEvent>) => {
      if (isPanning) {
        const dx = e.evt.clientX - lastPanPos.x;
        const dy = e.evt.clientY - lastPanPos.y;
        const currentStage = useWhiteboardStore.getState().stage;
        setStage({
          x: currentStage.x + dx,
          y: currentStage.y + dy,
        });
        setLastPanPos({ x: e.evt.clientX, y: e.evt.clientY });
        return;
      }

      if (!isDrawing) return;

      const konvaStage = stageRef.current;
      if (!konvaStage) return;

      const pos = konvaStage.getPointerPosition();
      if (!pos) return;

      if (tool === "pen") {
        setCurrentLine((prev) => [...prev, pos.x, pos.y]);
      }
    },
    [isPanning, lastPanPos, setStage, isDrawing, tool],
  );

  const handleMouseUp = useCallback(
    (e: KonvaEventObject<MouseEvent>) => {
      if (isPanning) {
        setIsPanning(false);
        return;
      }

      if (!isDrawing) return;

      const stage = stageRef.current;
      if (!stage) return;

      const pos = stage.getPointerPosition();
      if (!pos) return;

      const id = uuidv4();

      if (tool === "pen" && currentLine.length > 2) {
        addElement({
          id,
          type: "freehand",
          x: 0,
          y: 0,
          points: currentLine,
          stroke: COLORS.shapeStroke,
        });
      }

      if (tool === "rectangle") {
        const width = pos.x - startPos.x;
        const height = pos.y - startPos.y;
        if (Math.abs(width) > 5 && Math.abs(height) > 5) {
          addElement({
            id,
            type: "rectangle",
            x: width > 0 ? startPos.x : pos.x,
            y: height > 0 ? startPos.y : pos.y,
            width: Math.abs(width),
            height: Math.abs(height),
            fill: COLORS.shape,
            stroke: COLORS.shapeStroke,
          });
        }
      }

      if (tool === "circle") {
        const radius = Math.sqrt(
          Math.pow(pos.x - startPos.x, 2) + Math.pow(pos.y - startPos.y, 2),
        );
        if (radius > 5) {
          addElement({
            id,
            type: "circle",
            x: startPos.x,
            y: startPos.y,
            width: radius * 2,
            height: radius * 2,
            fill: COLORS.shape,
            stroke: COLORS.shapeStroke,
          });
        }
      }

      if (tool === "arrow") {
        const dx = pos.x - startPos.x;
        const dy = pos.y - startPos.y;
        if (Math.sqrt(dx * dx + dy * dy) > 10) {
          addElement({
            id,
            type: "arrow",
            x: startPos.x,
            y: startPos.y,
            points: [0, 0, dx, dy],
            stroke: COLORS.shapeStroke,
          });
        }
      }

      setIsDrawing(false);
      setCurrentLine([]);
    },
    [isPanning, isDrawing, tool, startPos, currentLine, addElement, setIsPanning],
  );

  const handleStageMouseDown = useCallback(
    (e: KonvaEventObject<MouseEvent>) => {
      if (tool === "select") return;

      const stage = stageRef.current;
      if (!stage) return;

      const pos = stage.getPointerPosition();
      if (!pos) return;

      const id = uuidv4();

      if (tool === "sticky") {
        addElement({
          id,
          type: "sticky",
          x: pos.x - 75,
          y: pos.y - 75,
          width: 150,
          height: 150,
          text: "双击编辑",
          fill: COLORS.sticky,
        });
        setSelectedId(id);
        setTool("select");
        return;
      }

      if (tool === "text") {
        addElement({
          id,
          type: "text",
          x: pos.x,
          y: pos.y,
          text: "文本",
          fontSize: 20,
          fill: COLORS.text,
        });
        setSelectedId(id);
        setTool("select");
        return;
      }

      if (tool === "pen") {
        setIsDrawing(true);
        setCurrentLine([pos.x, pos.y]);
        return;
      }

      if (["rectangle", "circle", "arrow"].includes(tool)) {
        setIsDrawing(true);
        setStartPos(pos);
      }
    },
    [tool, addElement, setSelectedId, setTool],
  );

  const handleElementClick = useCallback(
    (e: KonvaEventObject<MouseEvent>, id: string) => {
      e.cancelBubble = true;
      setSelectedId(id);
    },
    [setSelectedId],
  );

  const handleDragEnd = useCallback(
    (e: KonvaEventObject<DragEvent>, id: string) => {
      updateElement(id, {
        x: e.target.x(),
        y: e.target.y(),
      });
    },
    [updateElement],
  );

  const handleTransformEnd = useCallback(
    (e: KonvaEventObject<Event>, id: string) => {
      const node = e.target;
      const element = elements.find((el) => el.id === id);
      if (!element) return;

      const scaleX = node.scaleX();
      const scaleY = node.scaleY();

      let newWidth = element.width ?? 150;
      let newHeight = element.height ?? 150;

      if (element.type === "sticky") {
        newWidth = Math.max(50, (element.width ?? 150) * scaleX);
        newHeight = Math.max(50, (element.height ?? 150) * scaleY);
      } else if (element.type === "rectangle") {
        newWidth = Math.max(5, (element.width ?? 100) * scaleX);
        newHeight = Math.max(5, (element.height ?? 100) * scaleY);
      } else if (element.type === "circle") {
        newWidth = Math.max(10, (element.width ?? 100) * scaleX);
        newHeight = Math.max(10, (element.height ?? 100) * scaleY);
      }

      node.scaleX(1);
      node.scaleY(1);

      updateElement(id, {
        x: node.x(),
        y: node.y(),
        width: newWidth,
        height: newHeight,
      });
    },
    [updateElement, elements],
  );

  const handleDblClick = useCallback(
    (e: KonvaEventObject<MouseEvent>, element: WhiteboardElement) => {
      if (element.type === "sticky" || element.type === "text") {
        setEditingId(element.id);
      }
    },
    [],
  );

  const finishEditing = useCallback(() => {
    if (!editingId || !textAreaRef.current) return;
    const newText = textAreaRef.current.value;
    updateElement(editingId, { text: newText });
    setEditingId(null);
  }, [editingId, updateElement]);

  useEffect(() => {
    if (editingId && textAreaRef.current) {
      textAreaRef.current.focus();
      textAreaRef.current.select();
    }
  }, [editingId]);

  useEffect(() => {
    if (!transformerRef.current || !stageRef.current) return;

    if (selectedId && tool === "select" && !isPanning) {
      const node = stageRef.current.findOne(`#${selectedId}`);
      if (node) {
        transformerRef.current.nodes([node]);
        transformerRef.current.forceUpdate();
        transformerRef.current.getLayer()?.batchDraw();
      }
    } else {
      transformerRef.current.nodes([]);
      transformerRef.current.forceUpdate();
      transformerRef.current.getLayer()?.batchDraw();
    }
  }, [selectedId, tool, isPanning, elements]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === "Space" && !editingId) {
        e.preventDefault();
        setIsPanning(true);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === "Space") {
        setIsPanning(false);
      }
    };

    container.addEventListener("keydown", handleKeyDown);
    container.addEventListener("keyup", handleKeyUp);

    return () => {
      container.removeEventListener("keydown", handleKeyDown);
      container.removeEventListener("keyup", handleKeyUp);
    };
  }, [editingId, setIsPanning]);

  const renderElement = (element: WhiteboardElement) => {
    const isSelected = selectedId === element.id;
    const isEditing = editingId === element.id;
    const eventProps = {
      draggable: tool === "select" && !isEditing && !isPanning,
      onClick: (e: KonvaEventObject<MouseEvent>) =>
        handleElementClick(e, element.id),
      onDragEnd: (e: KonvaEventObject<DragEvent>) =>
        handleDragEnd(e, element.id),
      onDblClick: (e: KonvaEventObject<MouseEvent>) =>
        handleDblClick(e, element),
      onTransformEnd: (e: KonvaEventObject<Event>) =>
        handleTransformEnd(e, element.id),
    };

    switch (element.type) {
      case "sticky":
        return (
          <Group
            key={element.id}
            id={element.id}
            {...eventProps}
            x={element.x}
            y={element.y}
          >
            <Rect
              width={element.width}
              height={element.height}
              fill={element.fill}
              cornerRadius={4}
              shadowColor="black"
              shadowBlur={8}
              shadowOpacity={0.15}
              shadowOffsetY={2}
              stroke={isSelected ? "#6366F1" : undefined}
              strokeWidth={isSelected ? 2 : 0}
            />
            {!isEditing && (
              <Text
                x={12}
                y={12}
                text={element.text}
                width={(element.width ?? 150) - 24}
                fontSize={14}
                fontFamily="Inter"
                fill={COLORS.stickyText}
                wrap="word"
              />
            )}
          </Group>
        );

      case "rectangle":
        return (
          <Rect
            key={element.id}
            id={element.id}
            {...eventProps}
            x={element.x}
            y={element.y}
            width={element.width}
            height={element.height}
            fill={element.fill}
            stroke={element.stroke}
            strokeWidth={2}
            cornerRadius={4}
          />
        );

      case "circle":
        return (
          <Circle
            key={element.id}
            id={element.id}
            {...eventProps}
            x={element.x}
            y={element.y}
            radius={(element.width ?? 0) / 2}
            fill={element.fill}
            stroke={element.stroke}
            strokeWidth={2}
          />
        );

      case "arrow":
        return (
          <Arrow
            key={element.id}
            id={element.id}
            {...eventProps}
            x={element.x}
            y={element.y}
            points={element.points || []}
            stroke={element.stroke}
            strokeWidth={2}
            pointerLength={10}
            pointerWidth={10}
          />
        );

      case "text":
        return (
          <>
            {!isEditing && (
              <Text
                key={element.id}
                id={element.id}
                {...eventProps}
                x={element.x}
                y={element.y}
                text={element.text}
                fontSize={element.fontSize}
                fontFamily="Inter"
                fill={element.fill}
              />
            )}
          </>
        );

      case "freehand":
        return (
          <Line
            key={element.id}
            id={element.id}
            {...eventProps}
            points={element.points}
            stroke={element.stroke}
            strokeWidth={2}
            tension={0.5}
            lineCap="round"
            lineJoin="round"
          />
        );

      default:
        return null;
    }
  };

  return (
    <div
      ref={containerRef}
      className="relative h-full w-full"
      tabIndex={0}
      style={{ cursor: isPanning ? "grab" : "default" }}
    >
      <Stage
        ref={stageRef}
        width={typeof window !== "undefined" ? window.innerWidth - 60 : 1000}
        height={typeof window !== "undefined" ? window.innerHeight : 800}
        x={stage.x}
        y={stage.y}
        scaleX={stage.scale}
        scaleY={stage.scale}
        className="bg-gray-50"
        onClick={handleStageClick}
        onMouseDown={(e) => {
          handleMouseDown(e);
          handleStageMouseDown(e);
        }}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onWheel={handleWheel}
      >
        <Layer listening={false}>
          {(() => {
            const stageWidth = typeof window !== "undefined" ? window.innerWidth - 60 : 1000;
            const stageHeight = typeof window !== "undefined" ? window.innerHeight : 800;
            const gridSize = 40;
            const startX = Math.floor(-stage.x / stage.scale / gridSize) * gridSize - gridSize;
            const startY = Math.floor(-stage.y / stage.scale / gridSize) * gridSize - gridSize;
            const endX = startX + stageWidth / stage.scale + gridSize * 2;
            const endY = startY + stageHeight / stage.scale + gridSize * 2;
            const lines = [];

            for (let x = startX; x <= endX; x += gridSize) {
              lines.push(
                <Line
                  key={`v-${x}`}
                  points={[x, startY, x, endY]}
                  stroke="#E5E7EB"
                  strokeWidth={1}
                />
              );
            }
            for (let y = startY; y <= endY; y += gridSize) {
              lines.push(
                <Line
                  key={`h-${y}`}
                  points={[startX, y, endX, y]}
                  stroke="#E5E7EB"
                  strokeWidth={1}
                />
              );
            }
            return lines;
          })()}
        </Layer>
        <Layer>
          {elements.map(renderElement)}
          {isDrawing && tool === "pen" && currentLine.length > 2 && (
            <Line
              points={currentLine}
              stroke={COLORS.shapeStroke}
              strokeWidth={2}
              tension={0.5}
              lineCap="round"
              lineJoin="round"
            />
          )}
          <Transformer
            ref={transformerRef}
            enabledAnchors={["top-left", "top-right", "bottom-left", "bottom-right"]}
            anchorSize={8}
            anchorFill="#6366F1"
            anchorStroke="#fff"
            anchorStrokeWidth={1}
            borderStroke="#6366F1"
            borderStrokeWidth={1}
            boundBoxFunc={(oldBox, newBox) => {
              if (Math.abs(newBox.width) < 5 || Math.abs(newBox.height) < 5) {
                return oldBox;
              }
              return newBox;
            }}
          />
        </Layer>
      </Stage>
      {editingElement && (() => {
        const style = getTextAreaStyle(editingElement, stage.x, stage.y, stage.scale);
        const bgColor = editingElement.type === "sticky" ? COLORS.sticky : "transparent";
        const txtColor = editingElement.type === "sticky" ? COLORS.stickyText : COLORS.text;
        return (
          <textarea
            ref={textAreaRef}
            defaultValue={editingElement.text}
            onBlur={finishEditing}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                finishEditing();
              }
              if (e.key === "Escape") {
                setEditingId(null);
              }
            }}
            className="absolute outline-none resize-none z-50"
            style={{
              left: style.left,
              top: style.top,
              width: style.width,
              height: style.height,
              fontSize: style.fontSize * stage.scale,
              fontFamily: style.fontFamily,
              lineHeight: "1.4",
              boxSizing: "border-box",
              backgroundColor: bgColor,
              color: txtColor,
              padding: 0,
              margin: 0,
              border: "none",
              overflow: "hidden",
              whiteSpace: "pre-wrap",
              wordWrap: "break-word",
            }}
          />
        );
      })()}
    </div>
  );
}
