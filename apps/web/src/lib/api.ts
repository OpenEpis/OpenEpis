import { OpenEpisClient } from "@openepis/sdk";

export const api = new OpenEpisClient({
  baseUrl: import.meta.env.VITE_API_URL || "",
});
