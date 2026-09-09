"use client";

import { useCallback, useEffect, useState } from "react";

const SESSION_KEY = "rareui_admin_password";

/** Admin password, persisted in sessionStorage so it survives navigation
 *  between /library/admin and /library/admin/add but clears when the tab closes. */
export function useAdminSession() {
  const [password, setPasswordState] = useState("");
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setPasswordState(sessionStorage.getItem(SESSION_KEY) || "");
    setHydrated(true);
  }, []);

  const unlock = useCallback((value: string) => {
    sessionStorage.setItem(SESSION_KEY, value);
    setPasswordState(value);
  }, []);

  const lock = useCallback(() => {
    sessionStorage.removeItem(SESSION_KEY);
    setPasswordState("");
  }, []);

  return {
    password,
    unlocked: hydrated && password.length > 0,
    hydrated,
    unlock,
    lock,
  };
}
