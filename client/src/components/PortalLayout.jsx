import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { IconLogout, IconMenu } from "./icons";

// Shared layout for Admin, Trainer, and Student portals.
export default function PortalLayout({ title, navItems = [], children }) {
  const { fullName, role, logout } = useAuth();

  const navigate = useNavigate();
  const location = useLocation();

  const [sidebarOpen, setSidebarOpen] = useState(true);

  // =========================================================
  // CHECK ADMIN ROLE
  // =========================================================
  // This handles "admin", "Admin", "ADMIN", etc.
  const isAdmin = role?.toString().toLowerCase().includes("admin");

  // =========================================================
  // SIDEBAR BACKGROUND
  // ADMIN = BLACK
  // TRAINER/STUDENT = WHITE
  // =========================================================

  const sidebarBg = isAdmin
    ? "!bg-[#232323]"
    : "bg-white border-r border-slate-200";

  // =========================================================
  // ACTIVE NAVIGATION
  // =========================================================

  const navLinkActive = isAdmin
    ? "bg-[#6b7c4f] text-white"
    : "bg-blue-50 text-blue-600 font-semibold";

  // =========================================================
  // INACTIVE NAVIGATION
  // =========================================================

  const navLinkInactive = isAdmin
    ? "text-slate-200 hover:bg-white/10"
    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900";

  // =========================================================
  // DISABLED ITEM
  // =========================================================

  const disabledLinkStyle = isAdmin
    ? "text-slate-500 bg-white/5 cursor-not-allowed"
    : "text-slate-400 bg-slate-100/50 cursor-not-allowed";

  // =========================================================
  // USER AREA
  // =========================================================

  const userAreaBorder = isAdmin
    ? "border-t border-white/10"
    : "border-t border-slate-200";

  const userNameText = isAdmin ? "text-white" : "text-slate-800";

  // =========================================================
  // LOGOUT
  // =========================================================

  function handleLogout() {
    logout();
    navigate("/login");
  }

  // =========================================================
  // CHECK ACTIVE LINK
  // =========================================================

  function isActive(item) {
    if (!item.href) {
      return false;
    }

    if (location.pathname === item.href) {
      return true;
    }

    if (
      item.href === "/student/assignment" &&
      location.pathname.startsWith("/student/assignment")
    ) {
      return true;
    }

    return false;
  }

  // =========================================================
  // NAVIGATION CLICK
  // =========================================================

  function handleNavClick(item, event) {
    if (item.disabled) {
      event.preventDefault();
      event.stopPropagation();
      return;
    }

    if (typeof item.onClick === "function") {
      event.preventDefault();
      item.onClick();
      return;
    }
  }

  return (
    <div className="min-h-screen flex bg-slate-50">
      {/* =====================================================
          SIDEBAR
      ====================================================== */}

      {sidebarOpen && (
        <aside className={`w-60 flex flex-col ${sidebarBg}`}>
          {/* =================================================
              LOGO
          ================================================= */}

          <div
            className="
              bg-white
              px-2
              py-2
              flex
              items-center
              justify-center
              border-r
              border-slate-800
            "
          >
            <img
              src="/titan-logo.png"
              alt="Titan SMS"
              className="h-12 object-contain"
            />
          </div>

          {/* =================================================
              NAVIGATION
          ================================================= */}

          <nav className="flex-1 px-3 py-4 space-y-1">
            {navItems.map((item) => {
              const active = isActive(item);
              const Icon = item.icon;

              {
                /* =============================================
                  DISABLED ITEM
              ============================================== */
              }

              if (item.disabled) {
                return (
                  <button
                    key={item.label}
                    type="button"
                    disabled
                    aria-disabled="true"
                    className={`
                      w-full
                      flex
                      items-center
                      gap-2.5
                      text-left
                      rounded-md
                      px-3
                      py-2.5
                      text-sm
                      ${disabledLinkStyle}
                    `}
                  >
                    {Icon && (
                      <Icon width={16} height={16} className="shrink-0" />
                    )}

                    {item.label}

                    {item.loading && (
                      <span className="ml-auto text-xs">Loading...</span>
                    )}

                    {!item.loading && (
                      <span className="ml-auto text-xs">Unavailable</span>
                    )}
                  </button>
                );
              }

              {
                /* =============================================
                  CUSTOM ONCLICK ITEM
              ============================================== */
              }

              if (typeof item.onClick === "function") {
                return (
                  <button
                    key={item.label}
                    type="button"
                    onClick={(event) => handleNavClick(item, event)}
                    className={`
                      w-full
                      flex
                      items-center
                      gap-2.5
                      text-left
                      rounded-md
                      px-3
                      py-2.5
                      text-sm
                      font-medium
                      transition-colors
                      ${active ? navLinkActive : navLinkInactive}
                    `}
                  >
                    {Icon && (
                      <Icon width={16} height={16} className="shrink-0" />
                    )}

                    {item.label}
                  </button>
                );
              }

              {
                /* =============================================
                  NORMAL LINK
              ============================================== */
              }

              return (
                <Link
                  key={item.label}
                  to={item.href}
                  onClick={(event) => handleNavClick(item, event)}
                  className={`
                    flex
                    items-center
                    gap-2.5
                    rounded-md
                    px-3
                    py-2.5
                    text-sm
                    font-medium
                    transition-colors
                    ${active ? navLinkActive : navLinkInactive}
                  `}
                >
                  {Icon && <Icon width={16} height={16} className="shrink-0" />}

                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* =================================================
              USER AREA
          ================================================= */}

          <div
            className={`
              px-4
              py-4
              ${userAreaBorder}
            `}
          >
            <p
              className={`
                text-sm
                font-medium
                truncate
                ${userNameText}
              `}
            >
              {fullName}
            </p>

            <p className="text-xs text-slate-400 capitalize mb-2">
              {role?.replace("_", " ")}
            </p>

            <button
              type="button"
              onClick={handleLogout}
              className="
                flex
                items-center
                gap-1.5
                text-xs
                text-red-400
                hover:text-red-300
                hover:underline
              "
            >
              <IconLogout width={14} height={14} />
              Log out
            </button>
          </div>
        </aside>
      )}

      {/* =====================================================
          MAIN CONTENT
      ====================================================== */}

      <div className="flex-1 flex flex-col">
        {/* =================================================
            TOP BAR
        ================================================= */}

        <div
          className="
            px-6
            py-4
            border-b
            border-slate-200
            bg-white
          "
        >
          <button
            type="button"
            onClick={() => setSidebarOpen((v) => !v)}
            className="
              text-slate-600
              hover:text-slate-900
            "
            aria-label="Toggle sidebar"
          >
            <IconMenu width={20} height={20} />
          </button>
        </div>

        {/* =================================================
            MAIN PAGE
        ================================================= */}

        <main className="flex-1 p-8">{children}</main>
      </div>
    </div>
  );
}
