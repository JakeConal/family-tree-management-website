import type { ReactNode } from "react";

import Image from "next/image";
import Link from "next/link";
import { ChevronRight, Plus } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { cn } from "../lib/utils";

export interface FamilyTreeLink {
  id: string;
  name: string;
  href?: string;
  active?: boolean;
}

export interface SidebarNavItem {
  id: string;
  label: string;
  icon: LucideIcon;
  href?: string;
  active?: boolean;
}

export interface FamilySidebarProps {
  brand?: {
    title: string;
    subtitle?: string;
    logo?: ReactNode;
    logoSrc?: string;
  };
  trees: FamilyTreeLink[];
  navItems: SidebarNavItem[];
  footerUser: {
    name: string;
    role?: string;
    avatarSrc?: string;
    arrowSrc?: string;
  };
  createTreeLabel?: string;
}

export function FamilySidebar({
  brand = { title: "Family Tree" },
  trees,
  navItems,
  footerUser,
  createTreeLabel = "Create New Tree",
}: FamilySidebarProps) {
  return (
    <aside className="flex min-h-[1024px] w-[220px] flex-shrink-0 flex-col border-r border-slate-200 bg-[#F5F6F8] px-5 pb-8 pt-6 text-slate-900">
      <div className="flex items-center gap-3">
        {brand.logo ? (
          <div className="flex h-[42px] w-[42px] items-center justify-center rounded-full border border-slate-300 bg-white p-2 text-slate-700">
            {brand.logo}
          </div>
        ) : brand.logoSrc ? (
          <Image
            src={brand.logoSrc}
            alt="Family Tree logo"
            width={48}
            height={48}
            className="rounded-full border border-slate-200 bg-white p-2"
          />
        ) : (
          <div className="h-12 w-12 rounded-full bg-slate-900/90" />
        )}
        <div>
          <p className="text-xl font-serif font-semibold leading-tight">
            {brand.title}
          </p>
          {brand.subtitle && (
            <p className="text-sm text-slate-500">{brand.subtitle}</p>
          )}
        </div>
      </div>

      <section className="mt-10">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          My Family Trees
        </p>
        <div className="mt-3 space-y-2">
          {trees.map((tree) => {
            const sharedClasses = cn(
              "flex w-full items-center justify-between rounded-[28px] border px-4 py-2 text-sm font-medium transition",
              tree.active
                ? "border-transparent bg-white text-slate-900 shadow-sm"
                : "border-transparent text-slate-600 hover:bg-white/70"
            );

            const content = (
              <>
                <span>{tree.name}</span>
                <span
                  className={cn(
                    "h-2 w-2 rounded-full",
                    tree.active ? "bg-slate-900" : "bg-transparent"
                  )}
                />
              </>
            );

            if (tree.href) {
              return (
                <Link key={tree.id} href={tree.href} className={sharedClasses}>
                  {content}
                </Link>
              );
            }

            return (
              <button key={tree.id} type="button" className={sharedClasses}>
                {content}
              </button>
            );
          })}
          <button className="inline-flex items-center gap-1 text-sm font-semibold text-slate-600 transition hover:text-slate-900">
            <Plus className="h-4 w-4" />
            {createTreeLabel}
          </button>
        </div>
      </section>

      <section className="mt-8">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          Pages
        </p>
        <div className="mt-3 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const sharedClasses = cn(
              "flex w-full items-center gap-3 rounded-[28px] px-4 py-2 text-sm font-medium transition",
              item.active
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-600 hover:bg-white/70"
            );

            const content = (
              <>
                <Icon className="h-4 w-4" />
                {item.label}
              </>
            );

            if (item.href) {
              return (
                <Link key={item.id} href={item.href} className={sharedClasses}>
                  {content}
                </Link>
              );
            }

            return (
              <button key={item.id} type="button" className={sharedClasses}>
                {content}
              </button>
            );
          })}
        </div>
      </section>

      <div className="mt-auto px-1 pb-2 pt-10">
        <button type="button" className="flex w-full items-center gap-3 rounded-[32px] bg-transparent px-1 py-2 text-left">
          <div className="h-[50px] w-[50px] overflow-hidden rounded-full bg-[#DFE7F7]">
            {footerUser.avatarSrc ? (
              <Image
                src={footerUser.avatarSrc}
                alt={footerUser.name}
                width={50}
                height={50}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="h-full w-full rounded-full bg-slate-300" />
            )}
          </div>
          <div className="flex min-w-0 flex-1 flex-col justify-center">
            <p className="truncate text-base font-semibold text-slate-900">
              {footerUser.name}
            </p>
            {footerUser.role && (
              <p className="text-sm text-slate-600">{footerUser.role}</p>
            )}
          </div>
          {footerUser.arrowSrc ? (
            <Image
              src={footerUser.arrowSrc}
              alt="Open"
              width={20}
              height={20}
              className="h-5 w-5"
            />
          ) : (
            <ChevronRight className="h-5 w-5 text-slate-700" />
          )}
        </button>
      </div>
    </aside>
  );
}
