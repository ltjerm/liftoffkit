"use client";

import { useEffect } from "react";

// One observer + one scroll listener for the whole page:
// - [data-reveal] gets .is-in when it scrolls into view
// - [data-progress] gets --p (0..1) as it passes through the viewport
// - .nav gets .is-scrolled once the page moves
export default function Motion() {
  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => {
        if (e.isIntersecting) { e.target.classList.add("is-in"); io.unobserve(e.target); }
      }),
      { rootMargin: "0px 0px -8% 0px", threshold: 0.12 },
    );
    document.querySelectorAll("[data-reveal]").forEach((el) => io.observe(el));

    const nav = document.querySelector(".nav");
    const tracks = Array.from(document.querySelectorAll<HTMLElement>("[data-progress]"));
    let raf = 0;
    const update = () => {
      raf = 0;
      nav?.classList.toggle("is-scrolled", window.scrollY > 8);
      const vh = window.innerHeight;
      for (const el of tracks) {
        const r = el.getBoundingClientRect();
        const p = Math.min(1, Math.max(0, (vh * 0.8 - r.top) / (r.height + vh * 0.3)));
        el.style.setProperty("--p", p.toFixed(3));
      }
    };
    const onScroll = () => { if (!raf) raf = requestAnimationFrame(update); };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      io.disconnect();
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);
  return null;
}
