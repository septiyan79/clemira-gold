"use client";

import { useState, useCallback } from "react";
import AdminSidebar from "./Sidebar";
import AdminHeader from "./Header";
import type { User } from "next-auth";

export default function AdminShell({ user, children }: { user: User | undefined; children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const close = useCallback(() => setSidebarOpen(false), []);

  return (
    <>
      <div className="adm-layout">
        <div className={`adm-overlay${sidebarOpen ? " on" : ""}`} onClick={close} />
        <AdminSidebar open={sidebarOpen} onClose={close} />
        <div className="adm-body">
          <AdminHeader user={user} onMenuClick={() => setSidebarOpen(o => !o)} />
          <main className="adm-main">{children}</main>
        </div>
      </div>
      <style>{`
        .adm-layout{height:100vh;overflow:hidden;display:flex;background:var(--dark)}
        .adm-sidebar{width:240px;height:100vh;position:fixed;left:0;top:0;z-index:50;display:flex;flex-direction:column;background:rgba(26,22,18,.97);border-right:1px solid rgba(201,168,76,.15)}
        .adm-body{flex:1;display:flex;flex-direction:column;overflow:hidden;min-width:0;margin-left:240px}
        .adm-main{flex:1;padding:28px;overflow-y:auto}
        .adm-overlay{display:none;position:fixed;inset:0;background:rgba(0,0,0,.6);z-index:40}
        .adm-overlay.on{display:block}
        .adm-hamburger{display:none;background:none;border:1px solid rgba(255,255,255,.1);border-radius:6px;padding:6px 10px;cursor:pointer;color:#7A6E5F;font-size:20px;line-height:1;align-items:center;justify-content:center;transition:all .2s}
        .adm-hamburger:hover{border-color:rgba(201,168,76,.3);color:var(--gold)}
        .adm-welcome{font-size:14px;color:var(--muted)}
        @media(max-width:768px){
          .adm-sidebar{transform:translateX(-100%);transition:transform .28s ease}
          .adm-sidebar.open{transform:translateX(0)}
          .adm-body{margin-left:0}
          .adm-main{padding:16px}
          .adm-hamburger{display:flex}
          .adm-welcome{display:none}
        }
      `}</style>
    </>
  );
}
