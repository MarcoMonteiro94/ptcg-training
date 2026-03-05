"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PenLine, Clipboard } from "lucide-react";
import type { ReactNode } from "react";

interface NewMatchLogTabsProps {
  manualForm: ReactNode;
  logPasteForm: ReactNode;
}

export function NewMatchLogTabs({ manualForm, logPasteForm }: NewMatchLogTabsProps) {
  return (
    <Tabs defaultValue="manual" className="w-full">
      <TabsList className="mb-4">
        <TabsTrigger value="manual" className="gap-2">
          <PenLine className="h-3.5 w-3.5" />
          Manual Entry
        </TabsTrigger>
        <TabsTrigger value="paste" className="gap-2">
          <Clipboard className="h-3.5 w-3.5" />
          Paste Game Log
        </TabsTrigger>
      </TabsList>
      <TabsContent value="manual">{manualForm}</TabsContent>
      <TabsContent value="paste">{logPasteForm}</TabsContent>
    </Tabs>
  );
}
