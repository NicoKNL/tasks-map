import { useContext } from "react";
import { AppContext } from "../contexts/context";
import { App } from "obsidian";

export const useApp = (): App | undefined => {
	return useContext(AppContext);
};
