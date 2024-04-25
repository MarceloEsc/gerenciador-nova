import { resolve } from 'path'
import { defineConfig, externalizeDepsPlugin } from 'electron-vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  main: {
    plugins: [externalizeDepsPlugin()]
  },
  preload: {
    plugins: [externalizeDepsPlugin()]
  },
  renderer: {
    resolve: {
      alias: {
        '@renderer': resolve('src/renderer/src')
      }
    },
    plugins: [vue({
      template: {
        compilerOptions: {
          // treat all tags with a dash as custom elements
          /* isCustomElement: (tag) => tag.startsWith("Calendar"), */
        },
      },
    })]
  }
})
