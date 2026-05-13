"use client";

import Link from "next/link";
import { ArrowRight, Sparkles, Users, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="flex items-center justify-between border-b px-6 py-4">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Sparkles className="h-4 w-4" />
          </div>
          <span className="text-lg font-bold">白板</span>
        </div>
        <Link href="/boards">
          <Button>
            开始使用
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </Link>
      </header>

      <main className="flex flex-1 flex-col items-center justify-center px-4 text-center">
        <div className="mx-auto max-w-3xl">
          <h1 className="text-5xl font-bold tracking-tight">
            与团队一起
            <br />
            <span className="text-primary">可视化协作</span>
          </h1>
          <p className="mt-6 text-lg text-muted-foreground">
            无限白板，用于头脑风暴、规划和设计。
            创建便签、绘制图表，实时协作。
          </p>
          <div className="mt-10 flex items-center justify-center gap-4">
            <Link href="/boards">
              <Button size="lg">
                开始创建
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Button variant="outline" size="lg">
              观看演示
            </Button>
          </div>

          <div className="mt-20 grid grid-cols-3 gap-8">
            <div className="flex flex-col items-center gap-2">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-muted">
                <Sparkles className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold">直观的工具</h3>
              <p className="text-sm text-muted-foreground">
                便签、形状、自由绘图和文本
              </p>
            </div>
            <div className="flex flex-col items-center gap-2">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-muted">
                <Users className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold">实时协作</h3>
              <p className="text-sm text-muted-foreground">
                与团队同时协作
              </p>
            </div>
            <div className="flex flex-col items-center gap-2">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-muted">
                <Zap className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold">极速响应</h3>
              <p className="text-sm text-muted-foreground">
                支持数千个元素的流畅画布
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
