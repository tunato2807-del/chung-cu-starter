import React, { useEffect, useRef, useState } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { useAuth } from "../features/auth/Auth.jsx";
import { useUnreadCount } from "../features/announcements/Announcements.jsx";
import { ErrorBox, homeFor, roleNames } from "../shared/ui.jsx";
import Icon from "../shared/Icon.jsx";
import { navigation } from "./navigation.js";

export default function Layout({ children }) {
  const { user, logout } = useAuth();
  const { pathname } = useLocation();
  const [error, setError] = useState();
  const [expanded, setExpanded] = useState(false);
  const menu = useRef(null);
  const profile = useRef(null);
  const unread = useUnreadCount(user, pathname);
  const workspace =
    !!user &&
    ["/quan-tri", "/ky-thuat", "/cu-dan", "/tai-khoan"].some((path) =>
      pathname.startsWith(path),
    );
  const groups = navigation[user?.vai_tro] || [];
  const initials =
    user?.ho_va_ten
      ?.trim()
      .split(/\s+/)
      .slice(-2)
      .map((word) => word[0])
      .join("") || "CC";

  useEffect(() => {
    const closeProfile = (event) => {
      if (profile.current && !profile.current.contains(event.target))
        profile.current.open = false;
    };
    document.addEventListener("pointerdown", closeProfile);
    return () => document.removeEventListener("pointerdown", closeProfile);
  }, []);

  useEffect(() => {
    setExpanded(false);
    if (profile.current) profile.current.open = false;
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
    const nav = menu.current;
    const active = nav?.querySelector('[aria-current="page"]');
    // Chỉ cuộn thanh menu ngang; không làm trang nội dung nhảy vị trí.
    if (nav && active && window.matchMedia("(max-width: 900px)").matches) {
      nav.scrollLeft = Math.max(0, active.offsetLeft - nav.offsetLeft - 16);
    }
  }, [pathname, user?.vai_tro]);

  return (
    <div className={`app-shell ${workspace ? "is-workspace" : "is-public"}`}>
      <a className="skip-link" href="#main-content">
        Đến nội dung chính
      </a>
      <header className="topbar">
        <Link to="/" className="brand">
          <span className="brand-icon">
            <Icon name="building" size={26} />
          </span>
          <span>
            CHUNG CƯ<small>QUẢN LÝ VẬN HÀNH</small>
          </span>
        </Link>
        <span className="topbar-context">
          {workspace ? "Không gian làm việc" : "Cổng dịch vụ cư dân"}
        </span>
        <div className="top-links">
          <Link className="lookup-link" to="/tra-cuu">
            <Icon name="search" size={18} />
            Tra cứu
          </Link>
          {user ? (
            <details
              className="profile-menu"
              ref={profile}
              onKeyDown={(event) => {
                if (event.key === "Escape") {
                  profile.current.open = false;
                  profile.current.querySelector("summary").focus();
                }
              }}
            >
              <summary aria-label={`Tùy chọn tài khoản ${user.ho_va_ten}`}>
                <span className="avatar" aria-hidden="true">
                  {initials}
                </span>
                <span className="profile-name">
                  {user.ho_va_ten}
                  <small>{roleNames[user.vai_tro]}</small>
                </span>
                <Icon name="chevron" size={16} />
              </summary>
              <div className="profile-dropdown">
                <p>
                  {user.ho_va_ten}
                  <small>{roleNames[user.vai_tro]}</small>
                </p>
                <Link to={homeFor(user)}>
                  <Icon name="dashboard" />
                  Không gian của tôi
                </Link>
                <Link to="/tai-khoan">
                  <Icon name="user" />
                  Cài đặt tài khoản
                </Link>
                <button type="button" onClick={() => logout().catch(setError)}>
                  <Icon name="logout" />
                  Đăng xuất
                </button>
              </div>
            </details>
          ) : (
            <Link className="button primary" to="/dang-nhap">
              Đăng nhập
              <Icon name="arrow" size={17} />
            </Link>
          )}
        </div>
      </header>
      <ErrorBox error={error} />
      <div className={workspace ? "workspace" : "public-space"}>
        {workspace && (
          <aside className={`sidebar${expanded ? " is-expanded" : ""}`}>
            <div className="sidebar-heading">
              <span className="eyebrow">{roleNames[user.vai_tro]}</span>
              <button
                className="mobile-menu-toggle"
                type="button"
                aria-controls="workspace-navigation"
                aria-expanded={expanded}
                onClick={() => setExpanded((value) => !value)}
              >
                <Icon name="menu" size={18} />
                {expanded ? "Thu gọn menu" : "Tất cả chức năng"}
                <Icon name="chevron" size={16} />
              </button>
            </div>
            <nav
              id="workspace-navigation"
              aria-label="Chức năng"
              ref={menu}
              onKeyDown={(event) => {
                if (event.key === "Escape" && expanded) {
                  setExpanded(false);
                  menu.current.previousElementSibling
                    .querySelector("button")
                    .focus();
                }
              }}
            >
              {groups.map((group) => (
                <div className="nav-group" key={group.title}>
                  <p className="nav-group-label">{group.title}</p>
                  {group.items.map(([path, label, icon]) => (
                    <NavLink
                      key={path}
                      end={path === "/quan-tri"}
                      to={path}
                      onClick={() => setExpanded(false)}
                    >
                      <Icon name={icon} size={19} />
                      <span>{label}</span>
                      {path === "/cu-dan/thong-bao" && unread > 0 && (
                        <span
                          className="notification-count"
                          aria-label={`${unread} chưa đọc`}
                        >
                          {unread > 99 ? "99+" : unread}
                        </span>
                      )}
                    </NavLink>
                  ))}
                </div>
              ))}
            </nav>
            <Link className="public-link" to="/">
              <Icon name="external" size={17} />
              Cổng dịch vụ<span aria-hidden="true">↗</span>
            </Link>
          </aside>
        )}
        <main id="main-content" tabIndex={-1} key={pathname}>
          {children}
        </main>
      </div>
      <footer>
        <span className="footer-brand">CHUNG CƯ</span>
        <span>Cổng tiếp nhận phản ánh & điều phối xử lý</span>
      </footer>
    </div>
  );
}
