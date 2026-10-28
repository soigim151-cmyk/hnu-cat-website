import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // GitHub Pages 주소(https://아이디.github.io/hnu-cat-website/)에서 동작하도록
  // 배포할 때만 하위 경로를 붙입니다. 로컬 실행(npm run dev)에는 영향 없음.
  base: process.env.GITHUB_PAGES ? '/hnu-cat-website/' : '/',
})
