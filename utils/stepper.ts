export const makeStepper = (fn: (steps: number) => any, initial = 0) => {
  let prev = initial;

  return (position: number) => {
    const delta = position - prev;
    const steps = Math.floor(delta);

    prev = position - (delta - steps);

    if (steps !== 0) {
      fn(steps);
    }
  };
};

export const makeStepperUpDown = (up: () => any, down: () => any, initial = 0) => {
  let prev = initial;

  return (position: number) => {
    const delta = position - prev;
    const steps = Math.imul(delta, 1);

    console.log({ position, prev, steps });

    prev = position - (delta - steps);

    if (steps !== 0) {
      const fn = steps > 0 ? up : down;
      const count = Math.abs(steps);

      for (let i = 0; i < count; i += 1) {
        fn();
      }
    }
  };
};
