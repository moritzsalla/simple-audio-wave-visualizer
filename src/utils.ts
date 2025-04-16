export const getCssVariable = (name: string) => {
  return getComputedStyle(document.documentElement).getPropertyValue(name);
};
