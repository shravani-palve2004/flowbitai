// src/components/IconBar.tsx
import React from "react";

const IconBar: React.FC = () => {
  return (
    <div
      // position absolute relative to viewport so it sits to the right of the sidebar (w-96 = 384px)
      style={{ left: 384 }}
      className="absolute top-20 z-50"
    >
      <div className="flex flex-col items-center gap-4">
        <button
          title="Navigation"
          className="flex items-center justify-center w-14 h-14 rounded-xl bg-[#3b3b3b] shadow"
        >
          <img src="/icons/nav.svg" alt="nav" className="w-10 h-10" />
        </button>

        <button
          title="Home"
          className="flex items-center justify-center w-14 h-14 rounded-xl bg-[#3b3b3b] shadow"
        >
          <img src="/icons/home.svg" alt="home" className="w-10 h-10" />
        </button>

        <button
          title="Grid"
          className="flex items-center justify-center w-14 h-14 rounded-xl bg-[#3b3b3b] shadow"
        >
          <img src="/icons/grid.svg" alt="grid" className="w-10 h-10" />
        </button>
      </div>
    </div>
  );
};

export default IconBar;
