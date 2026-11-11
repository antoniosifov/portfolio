/** The print sheet shows every chip, so the closed "+ more" lists open for printing and close again after. */
export function startPrint(): () => void {
  let opened: HTMLDetailsElement[] = [];

  const before = () => {
    opened = [...document.querySelectorAll<HTMLDetailsElement>("details:not([open])")];
    opened.forEach((details) => (details.open = true));
  };
  const after = () => {
    opened.forEach((details) => (details.open = false));
    opened = [];
  };

  window.addEventListener("beforeprint", before);
  window.addEventListener("afterprint", after);
  return () => {
    window.removeEventListener("beforeprint", before);
    window.removeEventListener("afterprint", after);
  };
}
