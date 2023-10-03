export const makeStepperUpDown = (up: () => any, down: () => any, initial = 0) => {
  let prev = initial;

  return (position: number) => {
    const next = Math.imul(position, 1);
    const steps = Math.imul(next - prev, 1);

    prev = next;

    if (steps !== 0) {
      const fn = steps > 0 ? up : down;
      const count = Math.abs(steps);

      for (let i = 0; i < count; i += 1) {
        fn();
      }
    }
  };
};
