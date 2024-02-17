import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import Unfonts from 'unplugin-fonts/vite'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    Unfonts({
      // Google Fonts API V2
      google: {
        text: 'Boar Gallery',
        families: [
          {
            name: 'Dancing Script',
            styles: 'wght@400..700',
            defer: false,
          },
        ],
      },
    }),
  ],
})
