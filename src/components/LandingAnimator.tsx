"use client";

import { useEffect } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

export function LandingAnimator() {
  useEffect(() => {
    // Respect prefers-reduced-motion
    if (typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return;
    }

    const ctx = gsap.context(() => {
      // ── Hero entrance: crisp, fast staggered fade-up
      gsap.fromTo(
        "[data-gsap='hero-item']",
        { opacity: 0, y: 16 },
        {
          opacity: 1,
          y: 0,
          duration: 0.55,
          stagger: 0.08,
          ease: "power2.out",
          clearProps: "transform,opacity",
        },
      );

      // ── Scroll-triggered sections & cards
      const scrollGroups = [
        "[data-gsap='stats-item']",
        "[data-gsap='feature-card']",
        "[data-gsap='step-card']",
        "[data-gsap='demo-section']",
        "[data-gsap='faq-item']",
        "[data-gsap='cta-section']",
      ];

      scrollGroups.forEach((selector) => {
        const els = document.querySelectorAll(selector);
        if (!els.length) return;

        gsap.fromTo(
          els,
          { opacity: 0, y: 16 },
          {
            opacity: 1,
            y: 0,
            duration: 0.55,
            stagger: 0.08,
            ease: "power2.out",
            clearProps: "transform,opacity",
            scrollTrigger: {
              trigger: els[0] as Element,
              start: "top 85%",
              once: true,
            },
          },
        );
      });
    });

    return () => ctx.revert();
  }, []);

  return null;
}
