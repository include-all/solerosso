import React from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { Button } from '@/components/ui/button'

console.log('👋 This message is being logged by "renderer.ts", included via Vite')

const App = () => {
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Hello from React + shadcn/ui!</h1>
      <div className="flex flex-wrap gap-2">
        <Button>Default</Button>
        <Button variant="secondary">Secondary</Button>
        <Button variant="destructive">Destructive</Button>
        <Button variant="outline">Outline</Button>
        <Button variant="ghost">Ghost</Button>
        <Button variant="link">Link</Button>
      </div>
    </div>
  )
}

const container = document.getElementById('root')
if (container) {
  const root = createRoot(container)
  root.render(<App />)
}
