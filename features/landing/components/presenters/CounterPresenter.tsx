import { RiAddLine, RiRefreshLine, RiSubtractLine } from "@remixicon/react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface CounterPresenterProps {
  count: number;
  onIncrement: () => void;
  onDecrement: () => void;
  onReset: () => void;
}

// Pure and presentational: props in, JSX out. No state, no logic, no data
// fetching. Everything it needs arrives as props from the orchestrator.
export function CounterPresenter({
  count,
  onIncrement,
  onDecrement,
  onReset,
}: CounterPresenterProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-display">Live example: a counter</CardTitle>
        <CardDescription>
          This widget is one orchestrator, one hook, one presenter. State lives
          in the hook, rendering lives here, wiring lives in the orchestrator.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex items-center gap-4">
        <Button variant="outline" size="icon" onClick={onDecrement} aria-label="Decrement">
          <RiSubtractLine className="size-4" />
        </Button>
        <span className="font-mono text-3xl font-bold tabular-nums">{count}</span>
        <Button variant="outline" size="icon" onClick={onIncrement} aria-label="Increment">
          <RiAddLine className="size-4" />
        </Button>
        <Button variant="ghost" size="sm" onClick={onReset} className="ml-2 gap-1.5">
          <RiRefreshLine className="size-4" />
          Reset
        </Button>
      </CardContent>
    </Card>
  );
}
