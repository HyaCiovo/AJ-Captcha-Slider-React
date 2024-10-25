import { ConfigEnv, PluginOption, UserConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import viteCompression from "vite-plugin-compression";

const VITE_DROP_CONSOLE = false;
const createVitePlugins = (isBuild: boolean) => {
  const vitePlugins: (PluginOption | PluginOption[])[] = [react()];
  if (isBuild) {
    // gzip
    vitePlugins.push(
      viteCompression({
        deleteOriginFile: true,
      })
    );
  }

  return vitePlugins;
};

// https://vitejs.dev/config/
export default ({ command }: ConfigEnv): UserConfig => {
  const isBuild = command === "build";

  return {
    plugins: createVitePlugins(isBuild),
    server: {
      proxy: {
        "/api": {
          target: "https://hyacinth.aj-captcha-slider.com", // 更换为 自己的服务器地址
          changeOrigin: true,
          secure: false,
          rewrite: (path) => path.replace(/^\/api/, "/api/h5"),
        },
      },
      host: true,
      open: true,
      port: 4000,
    },
    css: {
      preprocessorOptions: {
        less: {
          javascriptEnabled: true,
        },
      },
    },
    esbuild: {
      drop: VITE_DROP_CONSOLE ? ["console", "debugger"] : [],
    },
    build: {
      target: "modules",
      outDir: "build",
      assetsDir: "assets",
      cssCodeSplit: true,
      assetsInlineLimit: 4096,
      sourcemap: false,
      minify: "esbuild",
      chunkSizeWarningLimit: 500,
      emptyOutDir: true,
      manifest: false,
      rollupOptions: {
        output: {
          manualChunks: {
            react: ["react"],
            antd: ["antd"],
          },
        },
      },
    },
  };
};
