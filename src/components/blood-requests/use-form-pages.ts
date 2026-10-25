import { useCallback, useLayoutEffect, useRef, useState } from 'react';

export const useFormPages = (sectionCount: number, contentKey: string) => {
  const [pageStarts, setPageStarts] = useState([0]);
  const pageRefs = useRef<Array<HTMLElement | null>>([]);

  useLayoutEffect(() => {
    setPageStarts([0]);
  }, [sectionCount, contentKey]);

  const measure = useCallback(() => {
    for (let pageIndex = 0; pageIndex < pageStarts.length; pageIndex += 1) {
      const page = pageRefs.current[pageIndex];
      if (!page?.offsetHeight) continue;
      const sections = [...page.querySelectorAll<HTMLElement>('[data-form-section]')];
      if (sections.length < 2) continue;

      const bounds = page.getBoundingClientRect();
      const scale = bounds.height / page.offsetHeight;
      const bottom =
        bounds.bottom - Number.parseFloat(getComputedStyle(page).paddingBottom) * scale;
      const overflowIndex = sections.findIndex(
        (section) => section.getBoundingClientRect().bottom > bottom + 1,
      );
      if (overflowIndex === -1) continue;

      const nextStart = pageStarts[pageIndex] + Math.max(1, overflowIndex);
      const pageEnd = pageStarts[pageIndex + 1] ?? sectionCount;
      if (nextStart >= pageEnd) continue;
      setPageStarts((current) =>
        current === pageStarts
          ? [...pageStarts.slice(0, pageIndex + 1), nextStart, ...pageStarts.slice(pageIndex + 1)]
          : current,
      );
      return;
    }

    // Text fields can shrink after their line count is measured. Move sections
    // back into the available space so those measurements do not leave gaps.
    for (let pageIndex = 0; pageIndex < pageStarts.length - 1; pageIndex += 1) {
      const page = pageRefs.current[pageIndex];
      const nextPage = pageRefs.current[pageIndex + 1];
      if (!page?.offsetHeight || !nextPage?.offsetHeight) continue;
      const last = page.querySelector<HTMLElement>('[data-form-section]:last-child');
      const next = nextPage.querySelector<HTMLElement>('[data-form-section]');
      if (!last || !next) continue;
      const bounds = page.getBoundingClientRect();
      const scale = bounds.height / page.offsetHeight;
      const bottom =
        bounds.bottom - Number.parseFloat(getComputedStyle(page).paddingBottom) * scale;
      if (last.getBoundingClientRect().bottom + next.getBoundingClientRect().height > bottom - 1)
        continue;

      const nextStart = pageStarts[pageIndex + 1] + 1;
      const nextEnd = pageStarts[pageIndex + 2] ?? sectionCount;
      const updated = [...pageStarts];
      if (nextStart === nextEnd) updated.splice(pageIndex + 1, 1);
      else updated[pageIndex + 1] = nextStart;
      setPageStarts((current) => (current === pageStarts ? updated : current));
      return;
    }
  }, [pageStarts, sectionCount]);

  useLayoutEffect(() => {
    let frame = 0;
    const schedule = () => {
      window.cancelAnimationFrame(frame);
      frame = window.requestAnimationFrame(measure);
    };
    schedule();
    const observer = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(schedule);
    pageRefs.current.slice(0, pageStarts.length).forEach((page) => {
      if (!page) return;
      observer?.observe(page);
      if (page.firstElementChild) observer?.observe(page.firstElementChild);
    });
    return () => {
      observer?.disconnect();
      window.cancelAnimationFrame(frame);
    };
  }, [measure, pageStarts]);

  return { pageStarts, pageRefs };
};
