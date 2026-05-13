"use client";

import { useState, useEffect } from "react";
import { Search, LayoutGrid, List } from "lucide-react";
import { AppLayout } from "@/components/layout/app-layout";
import { BoardCard } from "@/components/board-card";
import { CreateBoardDialog } from "@/components/create-board-dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Board, boardsApi } from "@/services/boards";

export default function BoardsPage() {
  const [boards, setBoards] = useState<Board[]>([]);
  const [search, setSearch] = useState("");
  const [view, setView] = useState<"grid" | "list">("grid");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadBoards();
  }, []);

  const loadBoards = async () => {
    try {
      const data = await boardsApi.getAll();
      setBoards(data);
    } catch (err) {
      console.error("Failed to load boards:", err);
    } finally {
      setLoading(false);
    }
  };

  const filteredBoards = boards.filter((board) =>
    board.title.toLowerCase().includes(search.toLowerCase()),
  );

  const starredBoards = filteredBoards.filter((b) => b.isPublic);
  const recentBoards = filteredBoards.filter((b) => !b.isPublic);

  const handleCreateBoard = async (title: string, description?: string) => {
    try {
      const newBoard = await boardsApi.create(title, description);
      setBoards([newBoard, ...boards]);
    } catch (err) {
      console.error("Failed to create board:", err);
    }
  };

  const handleDeleteBoard = async (id: string) => {
    try {
      await boardsApi.delete(id);
      setBoards(boards.filter((board) => board.id !== id));
    } catch (err) {
      console.error("Failed to delete board:", err);
    }
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="flex h-full items-center justify-center">
          <div className="text-muted-foreground">加载中...</div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="flex h-full flex-col p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">白板</h1>
            <p className="text-muted-foreground">管理和组织你的白板</p>
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
          <div>
            <h2 className="mb-4 text-sm font-medium text-muted-foreground">
              所有白板
            </h2>
            <div
              className={
                view === "grid"
                  ? "grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
                  : "flex flex-col gap-2"
              }
            >
              {filteredBoards.map((board) => (
                <BoardCard
                  key={board.id}
                  board={board}
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
