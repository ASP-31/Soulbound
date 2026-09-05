import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { sepoliaChain } from "./viemPublicClient";

const WC_PROJECT_ID =
  process.env.NEXT_PUBLIC_WC_PROJECT_ID?.trim() ||
  process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID?.trim() ||
  "demo";

export const appInfo = {
  appName: "Soulbound Certificates",
  projectId: WC_PROJECT_ID,
  chains: [sepoliaChain],
  ssr: true,
} as const;

export const wagmiConfig = getDefaultConfig(appInfo);