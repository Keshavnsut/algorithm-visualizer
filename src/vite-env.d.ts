/// <reference types="vite/client" />

declare module '*.cpp?raw' {
  const content: string
  export default content
}
