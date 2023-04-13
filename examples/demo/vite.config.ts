import { defineConfig } from 'vite';
import solidPlugin from 'vite-plugin-solid';
import thalerPlugin from 'unplugin-thaler';

export default defineConfig({
  plugins: [
    solidPlugin({
      ssr: true,
    }),
    thalerPlugin.vite({
      origin: 'http://localhost:3000',
      mode: 'server',
    }),
  ],
  ssr: {
    external: ['venatu'],
  }
});
