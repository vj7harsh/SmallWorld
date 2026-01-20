import React from "react";

type PanelProps = {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  className?: string;
  bodyClassName?: string;
};

export function Panel({ title, subtitle, children, className, bodyClassName }: PanelProps) {
  return (
    <div className={`bg-white rounded-xl shadow-2xl w-full ${className ?? ""}`}>
      <div className="p-8 pb-4 border-b border-slate-200">
        <h2 className="text-2xl font-bold text-slate-800">{title}</h2>
        {subtitle && <p className="text-slate-500 mt-1 text-sm">{subtitle}</p>}
      </div>

      <div className={`p-8 pt-6 ${bodyClassName ?? ""}`}>
        {children}
      </div>
    </div>
  );
}
