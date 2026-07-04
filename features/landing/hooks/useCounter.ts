import { useState } from "react";

// All the state and logic for the counter lives here. No JSX: a hook returns
// data and handlers, the presenter renders them.
export function useCounter(initial = 0) {
  const [count, setCount] = useState(initial);

  const increment = () => {
    setCount((current) => current + 1);
  };
  const decrement = () => {
    setCount((current) => current - 1);
  };
  const reset = () => {
    setCount(initial);
  };

  return { count, increment, decrement, reset };
}
