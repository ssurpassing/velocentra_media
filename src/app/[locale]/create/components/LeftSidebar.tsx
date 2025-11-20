'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';
import { ReactNode } from 'react';

interface LeftSidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  children: ReactNode;
}

export function LeftSidebar({ isOpen, onToggle, children }: LeftSidebarProps) {
  return (
    <>
      {/* 左侧面板 - 始终打开，无折叠功能 */}
      <div className="w-[420px] bg-card/80 backdrop-blur-xl border-r border-border/50">
        {/* 内容区域 */}
        <div className="h-full overflow-y-auto">
          {children}
        </div>
      </div>
    </>
  );
}

