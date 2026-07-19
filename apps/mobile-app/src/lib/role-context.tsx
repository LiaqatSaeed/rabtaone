"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { decodeJwt } from "@rabtaone/api-client";
import type { Role } from "@rabtaone/types";

type RoleContextValue = {
  roles: Role[];
  activeRole: Role;
  setActiveRole: (role: Role) => void;
  loaded: boolean;
};

const RoleContext = createContext<RoleContextValue | null>(null);

export function RoleProvider({ children }: { children: React.ReactNode }) {
  const [roles, setRoles] = useState<Role[]>(["USER"]);
  const [activeRole, setActiveRoleState] = useState<Role>("USER");
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("jwt");
    const decoded = token ? decodeJwt(token) : null;
    const tokenRoles = (decoded?.roles || ["USER"]) as Role[];
    setRoles(tokenRoles);

    const saved = localStorage.getItem("activeRole") as Role | null;
    if (saved && tokenRoles.includes(saved)) {
      setActiveRoleState(saved);
    } else if (tokenRoles.includes("USER")) {
      setActiveRoleState("USER");
    } else {
      setActiveRoleState(tokenRoles[0]);
    }
    setLoaded(true);
  }, []);

  const setActiveRole = (role: Role) => {
    setActiveRoleState(role);
    localStorage.setItem("activeRole", role);
  };

  const value = useMemo(
    () => ({ roles, activeRole, setActiveRole, loaded }),
    [roles, activeRole, loaded]
  );

  return <RoleContext.Provider value={value}>{children}</RoleContext.Provider>;
}

export function useRole() {
  const ctx = useContext(RoleContext);
  if (!ctx) throw new Error("useRole must be used inside RoleProvider");
  return ctx;
}
