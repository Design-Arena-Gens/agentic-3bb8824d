'use client'

import dynamic from 'next/dynamic'

const SpacecraftChase = dynamic(() => import('./SpacecraftChase'), {
  ssr: false,
})

export default function Home() {
  return <SpacecraftChase />
}
