import { useEffect, useRef, useState } from "react";
import type { MouseEvent as ReactMouseEvent } from "react";
import { createPortal } from "react-dom";

import {
  FILTER_GROUPS,
  resolveCategory,
  groupOfCategory,
} from "../data/categories";
import { ChevronDownIcon } from "./Icons";

interface CategoryTabsProps {
  active: string;
  onSelect: (id: string) => void;
}

interface OpenMenu {
  id: string;
  top: number;
  left: number;
}

/** JobStreet-style filter chips: each chip is a dropdown of one filter group. */
export function CategoryTabs({ active, onSelect }: CategoryTabsProps) {
  const [open, setOpen] = useState<OpenMenu | null>(null);
  const navRef = useRef<HTMLElement>(null);
  const menuRef = useRef<HTMLUListElement>(null);
  const activeGroup = groupOfCategory(active);

  // Close the menu on any click outside the bar or the (portaled) menu, or on
  // scroll/resize so the fixed-position menu never detaches from its chip.
  useEffect(() => {
    if (!open) return;
    const onDown = (event: MouseEvent) => {
      const target = event.target as Node;
      const insideNav = navRef.current?.contains(target);
      const insideMenu = menuRef.current?.contains(target);
      if (!insideNav && !insideMenu) {
        setOpen(null);
      }
    };
    const close = () => setOpen(null);
    document.addEventListener("mousedown", onDown);
    window.addEventListener("scroll", close, true);
    window.addEventListener("resize", close);
    return () => {
      document.removeEventListener("mousedown", onDown);
      window.removeEventListener("scroll", close, true);
      window.removeEventListener("resize", close);
    };
  }, [open]);

  const toggle = (event: ReactMouseEvent<HTMLButtonElement>, id: string) => {
    if (open?.id === id) {
      setOpen(null);
      return;
    }
    const rect = event.currentTarget.getBoundingClientRect();
    const width = 180;
    const left = Math.min(rect.left, window.innerWidth - width - 8);
    setOpen({ id, top: rect.bottom + 6, left: Math.max(8, left) });
  };

  const choose = (id: string) => {
    onSelect(id);
    setOpen(null);
  };

  return (
    <nav className="filter-bar" ref={navRef} aria-label="Job filters">
      <button
        type="button"
        className={`chip${active === "all" ? " chip-active" : ""}`}
        onClick={() => choose("all")}
      >
        Semua
      </button>

      {FILTER_GROUPS.map((group) => {
        const isActiveGroup = activeGroup?.id === group.id;
        const selected = isActiveGroup ? resolveCategory(active) : null;
        const isOpen = open?.id === group.id;
        return (
          <div className="chip-wrap" key={group.id}>
            <button
              type="button"
              className={`chip${isActiveGroup ? " chip-active" : ""}`}
              aria-haspopup="listbox"
              aria-expanded={isOpen}
              onClick={(event) => toggle(event, group.id)}
            >
              <span>{selected ? selected.label : group.label}</span>
              <ChevronDownIcon
                width={14}
                height={14}
                className={`chip-caret${isOpen ? " up" : ""}`}
              />
            </button>

            {isOpen && open &&
              createPortal(
                <ul
                  ref={menuRef}
                  className="chip-menu"
                  role="listbox"
                  style={{ top: open.top, left: open.left }}
                >
                  {group.options.map((opt) => (
                    <li key={opt.id}>
                      <button
                        type="button"
                        role="option"
                        aria-selected={opt.id === active}
                        className={`chip-option${opt.id === active ? " selected" : ""}`}
                        onClick={() => choose(opt.id)}
                      >
                        {opt.label}
                      </button>
                    </li>
                  ))}
                </ul>,
                document.body,
              )}
          </div>
        );
      })}
    </nav>
  );
}
