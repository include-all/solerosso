"use client";

import { useState } from "react";
import { Search, LayoutGrid, List } from "lucide-react";
import { AppLayout } from "@/components/layout/app-layout";
import { BoardCard } from "@/components/board-card";
import { CreateBoardDialog } from "@/components/create-board-dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Board } from "@/lib/types";
import { mockBoards } from "@/lib/mock-data";

export default function BoardsPage() {
  const [boards, setBoards] = useState<Board[]>(mockBoards);
  const [search, setSearch] = useState("");
  const [view, setView] = useState<"grid" | "list">("grid");

  const filteredBoards = boards.filter((board) =>
    board.title.toLowerCase().includes(search.toLowerCase())
  );

  const starredBoards = filteredBoards.filter((b) => b.isStarred);
  const recentBoards = filteredBoards.filter((b) => !b.isStarred);

  const handleCreateBoard = (title: string, description?: string) => {
    const newBoard: Board = {
      id: Date.now().toString(),
      title,
      description,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isStarred: false,
    };
    setBoards([newBoard, ...boards]);
  };

  const handleStarBoard = (id: string) => {
    setBoards(
      boards.map((board) =>
        board.id === id ? { ...board, isStarred: !board.isStarred } : board
      )
    );
  };

  const handleDeleteBoard = (id: string) => {
    setBoards(boards.filter((board) => board.id !== id));
  };

  return (
    <AppLayout>
      <div className="flex h-full flex-col p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">白板</h1>
            <p className="text-muted-foreground">
              管理和组织你的白板
            </p>
          </div>
          <CreateBoardDialog onCreate={handleCreateBoard} />
        </div>

        <Separator className="my-4" />

        <div className="flex items-center gap-2">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="搜索白板..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <div className="flex items-center border rounded-md">
            <Button
              variant={view === "grid" ? "secondary" : "ghost"}
              size="icon"
              className="h-8 w-8"
              onClick={() => setView("grid")}
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
            <Button
              variant={view === "list" ? "secondary" : "ghost"}
              size="icon"
              className="h-8 w-8"
              onClick={() => setView("list")}
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="mt-6 flex-1 overflow-auto">
          {starredBoards.length > 0 && (
            <div className="mb-8">
              <h2 className="mb-4 text-sm font-medium text-muted-foreground">
                收藏
              </h2>
              <div
                className={
                  view === "grid"
                    ? "grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
                    : "flex flex-col gap-2"
                }
              >
                {starredBoards.map((board) => (
                  <BoardCard
                    key={board.id}
                    board={board}
                    onStar={handleStarBoard}
                    onDelete={handleDeleteBoard}
                  />
                ))}
              </div>
            </div>
          )}

          <div>
            <h2 className="mb-4 text-sm font-medium text-muted-foreground">
              最近
            </h2>
            <div
              className={
                view === "grid"
                  ? "grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
                  : "flex flex-col gap-2"
              }
            >
              {recentBoards.map((board) => (
                <BoardCard
                  key={board.id}
                  board={board}
                  onStar={handleStarBoard}
                  onDelete={handleDeleteBoard}
                />
              ))}
            </div>
          </div>

          {filteredBoards.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <p className="text-muted-foreground">没有找到白板</p>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
