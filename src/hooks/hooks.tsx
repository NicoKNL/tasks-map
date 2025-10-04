import { useContext } from "react";
import { AppContext } from "../contexts/context";
import { App } from "obsidian";

export const useApp = (): App => {
  const app = useContext(AppContext);

  if (!app) {
    console.error("App context is not available");
    throw new Error("App context is not available");
  }

  return app;
};
