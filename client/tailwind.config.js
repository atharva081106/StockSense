/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html","./src/**/*.{js,jsx,ts,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        /* ── Palette from image ── */
        cream:  { DEFAULT:"#FFF8F0", 50:"#FFFDF9", 100:"#FFF8F0", 200:"#F5EDE0", 300:"#EDE0CE", 400:"#E0CCBA", 500:"#C8B090" },
        gold:   { DEFAULT:"#C08552", 50:"#F9F1E8", 100:"#EDD9BE", 200:"#D9B88A", 300:"#C89A62", 400:"#C08552", 500:"#A36E3E", 600:"#8C5A3C", 700:"#744A30" },
        umber:  { DEFAULT:"#8C5A3C", 400:"#A06848", 500:"#8C5A3C", 600:"#7A4D32", 700:"#664028" },
        bark:   { DEFAULT:"#4B2E2B", 100:"#7A5550", 200:"#663F3C", 300:"#5C3533", 400:"#4B2E2B", 500:"#3D2422", 600:"#2E1A19", 700:"#221210" },
        /* ── Functional ── */
        gain: "var(--color-gain, #4ade80)",
        loss: "var(--color-loss, #f87171)",
        warn: "var(--color-warn, #fbbf24)",
      },
      fontFamily: {
        sans: ["Inter","system-ui","sans-serif"],
        mono: ["JetBrains Mono","monospace"],
      },
      borderRadius: { "2xl":"1rem","3xl":"1.5rem","4xl":"2rem","blob":"40% 60% 60% 40% / 40% 40% 60% 60%" },
      boxShadow: {
        "warm":    "0 8px 32px rgba(192,133,82,0.15), 0 2px 8px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,248,240,0.06)",
        "warm-lg": "0 24px 64px rgba(192,133,82,0.2), 0 8px 24px rgba(0,0,0,0.35)",
        "warm-sm": "0 4px 16px rgba(192,133,82,0.12), 0 1px 4px rgba(0,0,0,0.25)",
        "gold":    "0 0 24px rgba(192,133,82,0.35), 0 0 64px rgba(192,133,82,0.12)",
      },
      animation: {
        "fade-in":    "fadeIn .3s ease-out",
        "slide-up":   "slideUp .35s cubic-bezier(0.16,1,0.3,1)",
        "float":      "float 6s ease-in-out infinite",
        "ember-pulse":"emberPulse 3s ease-in-out infinite",
        "shimmer":    "shimmer 2.5s linear infinite",
        "spin-slow":  "spin 10s linear infinite",
      },
      keyframes: {
        fadeIn:     { from:{opacity:0},                              to:{opacity:1} },
        slideUp:    { from:{opacity:0,transform:"translateY(16px)"}, to:{opacity:1,transform:"translateY(0)"} },
        float:      { "0%,100%":{transform:"translateY(0)"},         "50%":{transform:"translateY(-8px)"} },
        emberPulse: { "0%,100%":{opacity:0.6},                       "50%":{opacity:1} },
        shimmer:    { from:{backgroundPosition:"200% 0"},            to:{backgroundPosition:"-200% 0"} },
      },
    },
  },
  plugins: [],
};
