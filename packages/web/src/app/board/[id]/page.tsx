"use client";

import { useEffect } from "react";
import { useParams } from "next/navigation";
import { AppLayout } from "@/components/layout/app-layout";
import { WhiteboardCanvas } from "@/components/whiteboard-canvas";
import { Toolbar } from "@/components/toolbar";
import { useWhiteboardStore } from "@/lib/store";

export default function BoardPage() {
  const params = useParams();
  const boardId = params.id as string;
  const { setBoardId, loadElements } = useWhiteboardStore();

  useEffect(() => {
    if (boardId) {
      setBoardId(boardId);
      loadElements();
    }
  }, [boardId, setBoardId, loadElements]);

  return (
    <AppLayout>
      <div className="relative h-full w-full overflow-hidden">
        <Toolbar />
        <WhiteboardCanvas />
      </div>
    </AppLayout>
  );
}
