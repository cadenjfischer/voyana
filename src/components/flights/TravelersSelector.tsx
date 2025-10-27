"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { Minus, Plus, User2, ChevronDown } from "lucide-react";
import { createPortal } from "react-dom";

export type CabinCode = "ECONOMY" | "PREMIUM_ECONOMY" | "BUSINESS" | "FIRST";

export interface TravelersValue {
  adults: number; // >=1
  children: number; // 2-17
  infantsLap: number; // <2
  infantsSeat: number; // <2 with seat
  cabin: CabinCode;
}

interface TravelersSelectorProps {
  value: TravelersValue;
  onChange: (value: TravelersValue) => void;
  mobile?: boolean; // If true, use mobile style with label inside
}

export default function TravelersSelector({ value, onChange, mobile = false }: TravelersSelectorProps) {
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<{ top: number; left: number; width: number }>({ top: 0, left: 0, width: 0 });

  const total = useMemo(
    () => value.adults + value.children + value.infantsLap + value.infantsSeat,
    [value]
  );

  const cabinLabel = useMemo(() => {
    switch (value.cabin) {
      case "ECONOMY":
        return "Economy";
      case "PREMIUM_ECONOMY":
        return "Premium economy";
      case "BUSINESS":
        return "Business";
      case "FIRST":
        return "First";
    }
  }, [value.cabin]);

  // Open/close outside click
  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (!wrapperRef.current) return;
      const target = e.target as Node;
      // Check if click is outside both the wrapper and the dropdown
      if (!wrapperRef.current.contains(target) && !dropdownRef.current?.contains(target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, []);

  // Position portal when open
  useEffect(() => {
    if (!open) return;
    const update = () => {
      const el = wrapperRef.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      // Use absolute positioning with scroll offsets for smooth tracking
      setPos({ top: r.bottom + window.scrollY + 8, left: r.left + window.scrollX, width: Math.max(360, r.width) });
    };
    update();
    // Use requestAnimationFrame for smoother position updates
    let rafId: number;
    const smoothUpdate = () => {
      update();
      rafId = requestAnimationFrame(smoothUpdate);
    };
    rafId = requestAnimationFrame(smoothUpdate);
    
    return () => {
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, [open]);

  const change = (patch: Partial<TravelersValue>) => onChange({ ...value, ...patch });

  const inc = (key: keyof TravelersValue) => {
    if (key === "cabin") return;
    const next = Math.min(9, (value[key] as number) + 1);
    // enforce at least 1 adult
    if (key !== "adults" && value.adults === 0) return change({ adults: 1 } as any);
    change({ [key]: next } as any);
  };

  const dec = (key: keyof TravelersValue) => {
    if (key === "cabin") return;
    const min = key === "adults" ? 1 : 0;
    const next = Math.max(min, (value[key] as number) - 1);
    // prevent all zero
    if (key === "adults" && next === 0 && total <= 1) return; 
    change({ [key]: next } as any);
  };

  return (
    <div ref={wrapperRef} className="relative">
      {/* Trigger button styled like input */}
      <button
        type="button"
        onClick={() => setOpen((s) => !s)}
        className={
          mobile
            ? "w-full h-14 border border-gray-300 rounded-lg bg-white px-4 text-left hover:border-gray-400 transition-colors flex items-center"
            : "w-full h-12 min-w-[260px] md:min-w-[300px] border border-gray-300 rounded-xl bg-white px-4 text-left hover:border-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors flex items-center justify-between whitespace-nowrap"
        }
      >
        {mobile ? (
          <>
            <User2 className="w-5 h-5 text-gray-400 mr-3 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="text-xs text-gray-600 font-medium mb-0.5">Travelers, Cabin class</div>
              <div className="text-sm text-gray-900 truncate">
                {total} traveler{total > 1 ? "s" : ""}, {cabinLabel}
              </div>
            </div>
            <ChevronDown className="w-5 h-5 text-gray-400 flex-shrink-0" />
          </>
        ) : (
          <>
            <span className="flex items-center gap-2 text-gray-900 font-medium whitespace-nowrap">
              <User2 className="w-4 h-4 text-gray-500" />
              {total} traveler{total > 1 ? "s" : ""}, {cabinLabel}
            </span>
            <ChevronDown className="w-4 h-4 text-gray-500" />
          </>
        )}
      </button>

      {open && createPortal(
        <div
          ref={dropdownRef}
          className="absolute z-[1000] bg-white border border-gray-200 rounded-2xl shadow-2xl" 
          style={{ top: pos.top, left: pos.left, width: Math.max(420, pos.width) }}
        >
          <div className="p-5">
            <h4 className="text-sm font-semibold text-gray-700 mb-4">Travelers and Cabin class</h4>

            {/* Rows */}
            {([
              { key: "adults", label: "Adults", sub: "" },
              { key: "children", label: "Children", sub: "Ages 2 to 17" },
              { key: "infantsLap", label: "Infants on lap", sub: "Younger than 2" },
              { key: "infantsSeat", label: "Infants in seat", sub: "Younger than 2" },
            ] as const).map((row) => (
              <div key={row.key} className="flex items-center justify-between py-3">
                <div>
                  <div className="text-gray-900 font-medium">{row.label}</div>
                  {row.sub && <div className="text-xs text-gray-500">{row.sub}</div>}
                </div>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => dec(row.key)}
                    className="h-8 w-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-100"
                  >
                    <Minus className="w-4 h-4 text-gray-600" />
                  </button>
                  <div className="w-6 text-center font-semibold text-gray-900">{(value as any)[row.key]}</div>
                  <button
                    type="button"
                    onClick={() => inc(row.key)}
                    className="h-8 w-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-100"
                  >
                    <Plus className="w-4 h-4 text-gray-600" />
                  </button>
                </div>
              </div>
            ))}

            {/* Cabin class and Done button row */}
            <div className="flex items-end gap-4 pt-4 border-t border-gray-100 mt-2">
              <div className="flex-1">
                <label className="block text-xs font-medium text-gray-600 mb-1.5">Cabin class</label>
                <div className="relative">
                  <select
                    value={value.cabin}
                    onChange={(e) => change({ cabin: e.target.value as CabinCode })}
                    className="w-full border border-gray-300 rounded-xl px-3 py-2.5 pr-9 text-gray-900 font-medium focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                  >
                    <option value="ECONOMY">Economy</option>
                    <option value="PREMIUM_ECONOMY">Premium economy</option>
                    <option value="BUSINESS">Business</option>
                    <option value="FIRST">First</option>
                  </select>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setOpen(false)}
                className="px-6 py-2.5 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 shadow flex-shrink-0"
              >
                Done
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
