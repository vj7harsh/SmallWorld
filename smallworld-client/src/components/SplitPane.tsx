import React from "react";

// Fixed split: left at a percentage, right fills the rest. No drag handle.
interface SplitPaneProps {
  left: React.ReactNode;
  right: React.ReactNode;
  leftPercent?: number; // defaults to 25
}

export default function SplitPane({ left, right, leftPercent = 25 }: SplitPaneProps) {
  const leftStyle = { width: `${leftPercent}%` } as React.CSSProperties;
  return (
    <div className="w-screen h-screen flex flex-row flex-nowrap overflow-hidden">
      {/* Left pane */}
      <div className="h-full box-border overflow-auto shrink-0" style={leftStyle}>
        {left}
      </div>
      {/* Right pane */}
      <div className="flex-1 min-w-0 h-full overflow-auto">{right}</div>
    </div>
  );
}
