import React, { useEffect, useId, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import Icon from "./Icon.jsx";
import { matchesSearch } from "./search.js";

export default function FunctionSearch({ groups }) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const root = useRef(null);
  const input = useRef(null);
  const id = useId();
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const items = groups.flatMap((group) =>
    group.items.map(([path, label, icon]) => ({
      path,
      label,
      icon,
      group: group.title,
    })),
  );
  const matches = items.filter((item) => matchesSearch(query, item.label));
  const results = matches.slice(0, 7);

  useEffect(() => {
    setQuery("");
    setOpen(false);
  }, [pathname]);
  useEffect(() => {
    const close = (event) => {
      if (!root.current?.contains(event.target)) setOpen(false);
    };
    document.addEventListener("pointerdown", close);
    return () => document.removeEventListener("pointerdown", close);
  }, []);

  function move(event) {
    if (event.key === "Escape") {
      event.preventDefault();
      input.current.focus();
      setOpen(false);
    } else if (["ArrowDown", "ArrowUp"].includes(event.key)) {
      event.preventDefault();
      if (!open) {
        setOpen(true);
        return;
      }
      const links = [...root.current.querySelectorAll("li a")];
      const index = links.indexOf(document.activeElement);
      const next = event.key === "ArrowDown" ? index + 1 : index - 1;
      if (next < 0) input.current.focus();
      else links[Math.min(next, links.length - 1)]?.focus();
    }
  }

  return (
    <div
      className="function-search"
      ref={root}
      onKeyDown={move}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false);
      }}
    >
      <form
        role="search"
        aria-label="Tìm chức năng"
        onSubmit={(event) => {
          event.preventDefault();
          if (query.trim() && matches.length === 1) {
            navigate(matches[0].path);
            setOpen(false);
          } else setOpen(true);
        }}
      >
        <label className="sr-only" htmlFor={id}>
          Tìm chức năng
        </label>
        <Icon name="search" size={18} />
        <input
          id={id}
          ref={input}
          type="search"
          placeholder="Tìm chức năng…"
          autoComplete="off"
          maxLength={80}
          value={query}
          onFocus={() => setOpen(true)}
          onChange={(event) => {
            setQuery(event.target.value);
            setOpen(true);
          }}
        />
        <button type="submit" aria-label="Xem kết quả tìm chức năng">
          <Icon name="arrow" size={17} />
        </button>
      </form>
      {open && (
        <div className="function-results">
          <p role="status">
            {query.trim()
              ? `${matches.length} chức năng phù hợp`
              : "Đi đến chức năng"}
            {matches.length > 7 && " · Nhập thêm để thu hẹp"}
          </p>
          <ul aria-label="Kết quả tìm chức năng">
            {results.map((item) => (
              <li key={item.path}>
                <Link to={item.path} onClick={() => setOpen(false)}>
                  <Icon name={item.icon} size={18} />
                  <span>
                    {item.label}
                    <small>{item.group}</small>
                  </span>
                  <Icon name="arrow" size={15} />
                </Link>
              </li>
            ))}
          </ul>
          {!results.length && (
            <span className="function-no-result">
              Thử “căn hộ”, “hóa đơn” hoặc tên chức năng trong menu.
            </span>
          )}
        </div>
      )}
    </div>
  );
}
