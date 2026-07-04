"use client";

import { CounterPresenter } from "@/features/landing/components/presenters/CounterPresenter";
import { useCounter } from "@/features/landing/hooks/useCounter";

export function CounterOrchestrator() {
  const { count, increment, decrement, reset } = useCounter();

  return (
    <CounterPresenter
      count={count}
      onIncrement={increment}
      onDecrement={decrement}
      onReset={reset}
    />
  );
}
