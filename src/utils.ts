export const throttle = (func: () => void, delay: number) => {
  let throttling: any;
  return () => {
    if (throttling) {
      return;
    }
    throttling = setTimeout(() => {
      func();
      throttling = false;
    }, delay);
  };
};
