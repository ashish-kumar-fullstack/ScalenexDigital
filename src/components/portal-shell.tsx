"use client";
import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import {
  LayoutDashboard,
  Users,
  FileText,
  Wallet,
  ChartNoAxesCombined,
  Settings,
  ScrollText,
  User,
  LockKeyhole,
  ArrowUpRight,
  LogOut,
  Menu,
  Bell,
  Plus,
} from "lucide-react";
import { Brand } from "./brand";
import { markNotifications } from "@/app/actions";
type Notice = { id: string; title: string; message: string; read: boolean };
export function PortalShell({
  role,
  name,
  notices,
  unread,
  children,
}: {
  role: "ADMIN" | "INFLUENCER";
  name: string;
  notices: Notice[];
  unread: number;
  children: React.ReactNode;
}) {
  const path = usePathname();
  const [open, setOpen] = useState(false);
  const base = "/" + role.toLowerCase();
  const links =
    role === "ADMIN"
      ? [
          ["dashboard", "Overview", LayoutDashboard],
          ["influencers", "Influencers", Users],
          ["leads", "All leads", FileText],
          ["payments", "Payments", Wallet],
          ["reports", "Reports", ChartNoAxesCombined],
          ["settings", "Settings", Settings],
          ["audit-logs", "Audit logs", ScrollText],
        ]
      : [
          ["dashboard", "Overview", LayoutDashboard],
          ["leads", "My leads", FileText],
          ["leads/new", "Submit a lead", Plus],
          ["earnings", "My earnings", Wallet],
          ["profile", "My profile", User],
          ["change-password", "Change password", LockKeyhole],
        ];
  return (
    <div className="portal">
      <aside className={"portal-sidebar" + (open ? " open" : "")}>
        <Brand />
        <div className="sidebar-label">
          {role === "ADMIN" ? "ADMIN WORKSPACE" : "PARTNER WORKSPACE"}
        </div>
        <nav aria-label="Workspace navigation" className="portal-nav">
          {links.map(([slug, title, Icon]) => {
            const I = Icon as typeof Users;
            const href = base + "/" + slug;
            return (
              <Link
                href={href}
                key={String(slug)}
                className={path === href ? "active" : ""}
                onClick={() => setOpen(false)}
              >
                <I size={18} />
                {String(title)}
              </Link>
            );
          })}
        </nav>
        <div className="sidebar-bottom">
          <Link href="/contact">
            Need a hand? <ArrowUpRight size={14} />
          </Link>
          <Link href="/">
            Visit our website <ArrowUpRight size={14} />
          </Link>
          <span>Build. Rank. Grow.</span>
        </div>
      </aside>
      <div className="portal-main">
        <header className="portal-header">
          <button
            className="mobile-portal-menu"
            onClick={() => setOpen(!open)}
            aria-label="Toggle workspace menu"
            aria-expanded={open}
          >
            <Menu size={22} />
          </button>
          <span className="portal-header-title">
            Workspace <span style={{ margin: "0 10px" }}>/</span>
            <strong>{role === "ADMIN" ? "Admin" : "Influencer"} portal</strong>
          </span>
          <div className="portal-header-actions">
            <details className="notification-menu">
              <summary aria-label={`Notifications, ${unread} unread`}>
                <Bell size={20} />
                {unread > 0 && <span>{unread}</span>}
              </summary>
              <div className="notification-popover">
                <h3>Notifications</h3>
                {notices.length === 0 && <p>No notifications yet.</p>}
                {unread > 0 && (
                  <button onClick={() => markNotifications()}>
                    Mark all as read
                  </button>
                )}
                {notices.map((n) => (
                  <div className="notification-item" key={n.id}>
                    <strong>{n.title}</strong>
                    <p>{n.message}</p>
                    {!n.read && (
                      <button onClick={() => markNotifications(n.id)}>
                        Mark as read
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </details>
            <div className="user-chip">
              <div className="avatar">{name.slice(0, 2).toUpperCase()}</div>
              <span>
                {name}
                <small>
                  {role === "ADMIN" ? "Administrator" : "Referral partner"}
                </small>
              </span>
            </div>
            <button
              className="logout-button"
              onClick={() => signOut({ callbackUrl: "/login" })}
              aria-label="Sign out"
            >
              <LogOut size={18} />
            </button>
          </div>
        </header>
        <main id="main" className="portal-content">
          {children}
        </main>
      </div>
    </div>
  );
}
