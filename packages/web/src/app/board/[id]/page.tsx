"use client";

import { AppLayout } from "@/components/layout/app-layout";
import { WhiteboardCanvas } from "@/components/whiteboard-canvas";
import { Toolbar } from "@/components/toolbar";

export default function BoardPage() {
  return (
    <AppLayout>
      <div className="relative h-full w-full overflow-hidden">
        <Toolbar />
        <WhiteboardCanvas />
      </div>
    </AppLayout>
  );
}
