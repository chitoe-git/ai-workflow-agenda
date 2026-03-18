"use client";

import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type ChecklistItem = {
  id: string;
  label: string;
  subtle?: string;
  completed: boolean;
};

type ChecklistSectionProps = {
  title: string;
  description?: string;
  items: ChecklistItem[];
  kind: "plan" | "task";
  onToggle: (params: { kind: "plan" | "task"; itemId: string; completed: boolean }) => Promise<void>;
};

export function ChecklistSection({ title, description, items, kind, onToggle }: ChecklistSectionProps) {
  const completeCount = items.filter((item) => item.completed).length;

  return (
    <Card className="p-0">
      <CardHeader className="flex items-start justify-between gap-3 sm:flex-row">
        <div>
          <CardTitle>{title}</CardTitle>
          {description ? <CardDescription>{description}</CardDescription> : null}
        </div>
        <Badge>{`${completeCount}/${items.length} complete`}</Badge>
      </CardHeader>
      <CardContent className="space-y-2">
        {items.length ? (
          items.map((item) => (
            <Checkbox
              key={item.id}
              checked={item.completed}
              label={item.label}
              subtle={item.subtle}
              onCheckedChange={(checked) => onToggle({ kind, itemId: item.id, completed: checked })}
            />
          ))
        ) : (
          <div className="rounded-2xl border border-dashed border-line bg-panel px-4 py-6 text-center text-sm text-ink-subtle">
            Nothing here yet.
          </div>
        )}
      </CardContent>
    </Card>
  );
}
