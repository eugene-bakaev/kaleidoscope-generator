'use client'
import dynamic from 'next/dynamic'

const BuilderPage = dynamic(() => import('./BuilderPage'), { ssr: false })

export default function Page() {
  return <BuilderPage />
}
