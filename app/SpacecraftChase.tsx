'use client'

import { useRef, useState, useEffect } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { PerspectiveCamera, Stars } from '@react-three/drei'
import * as THREE from 'three'

function Spacecraft({ position, color, isChaser }: { position: [number, number, number], color: string, isChaser?: boolean }) {
  const meshRef = useRef<THREE.Group>(null)

  return (
    <group ref={meshRef} position={position}>
      {/* Main body */}
      <mesh>
        <coneGeometry args={[0.5, 2, 4]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={0.3}
          metalness={0.8}
          roughness={0.2}
        />
      </mesh>

      {/* Wings */}
      <mesh position={[0.8, 0, 0]} rotation={[0, 0, Math.PI / 4]}>
        <boxGeometry args={[1.5, 0.1, 0.5]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={0.2}
          metalness={0.7}
          roughness={0.3}
        />
      </mesh>
      <mesh position={[-0.8, 0, 0]} rotation={[0, 0, -Math.PI / 4]}>
        <boxGeometry args={[1.5, 0.1, 0.5]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={0.2}
          metalness={0.7}
          roughness={0.3}
        />
      </mesh>

      {/* Engine glow */}
      <pointLight
        position={[-1, 0, 0]}
        color={isChaser ? "#ff3300" : "#0099ff"}
        intensity={2}
        distance={3}
      />
      <mesh position={[-1, 0, 0]}>
        <sphereGeometry args={[0.3, 16, 16]} />
        <meshBasicMaterial
          color={isChaser ? "#ff6600" : "#00ccff"}
          transparent
          opacity={0.8}
        />
      </mesh>
    </group>
  )
}

function Asteroids() {
  const count = 50
  const asteroids = useRef<THREE.Group>(null)

  useFrame((state) => {
    if (asteroids.current) {
      asteroids.current.children.forEach((asteroid, i) => {
        asteroid.position.z += 0.5
        if (asteroid.position.z > 20) {
          asteroid.position.z = -100
        }
      })
    }
  })

  return (
    <group ref={asteroids}>
      {Array.from({ length: count }).map((_, i) => (
        <mesh
          key={i}
          position={[
            (Math.random() - 0.5) * 60,
            (Math.random() - 0.5) * 40,
            -Math.random() * 100
          ]}
          rotation={[Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI]}
        >
          <dodecahedronGeometry args={[Math.random() * 0.5 + 0.3]} />
          <meshStandardMaterial
            color="#666666"
            roughness={0.8}
            metalness={0.3}
          />
        </mesh>
      ))}
    </group>
  )
}

function Scene({ time }: { time: number }) {
  const targetRef = useRef<THREE.Group>(null)
  const chaserRef = useRef<THREE.Group>(null)
  const cameraRef = useRef<THREE.PerspectiveCamera>(null)

  useFrame((state) => {
    const t = time / 1000

    if (targetRef.current && chaserRef.current && cameraRef.current) {
      // Target spacecraft movement - evasive maneuvers
      const targetX = Math.sin(t * 0.8) * 8
      const targetY = Math.cos(t * 1.2) * 4 + 2
      const targetZ = t * 5

      targetRef.current.position.set(targetX, targetY, targetZ)
      targetRef.current.rotation.z = Math.sin(t * 2) * 0.3
      targetRef.current.rotation.y = Math.PI / 2

      // Chaser spacecraft - following with slight lag
      const chaserX = Math.sin(t * 0.8 - 0.3) * 7
      const chaserY = Math.cos(t * 1.2 - 0.3) * 3.5 + 1.5
      const chaserZ = t * 5 - 8

      chaserRef.current.position.set(chaserX, chaserY, chaserZ)

      // Chaser looks at target
      chaserRef.current.lookAt(targetRef.current.position)
      chaserRef.current.rotateY(Math.PI / 2)

      // Dynamic camera following the chase
      const cameraPhase = t * 0.5
      const cameraDistance = 12 + Math.sin(cameraPhase) * 3
      const cameraHeight = 5 + Math.cos(cameraPhase * 0.7) * 2
      const cameraAngle = Math.sin(cameraPhase * 0.3) * Math.PI * 0.3

      const avgX = (targetX + chaserX) / 2
      const avgY = (targetY + chaserY) / 2
      const avgZ = (targetZ + chaserZ) / 2

      cameraRef.current.position.set(
        avgX + Math.sin(cameraAngle) * cameraDistance,
        avgY + cameraHeight,
        avgZ - Math.cos(cameraAngle) * cameraDistance
      )

      cameraRef.current.lookAt(avgX, avgY, avgZ + 5)
    }
  })

  return (
    <>
      <PerspectiveCamera ref={cameraRef} makeDefault position={[0, 8, -15]} fov={75} />

      <ambientLight intensity={0.2} />
      <directionalLight position={[10, 10, 5]} intensity={0.5} color="#ffffff" />
      <pointLight position={[0, 0, 0]} intensity={1} color="#4488ff" />

      <Stars radius={300} depth={100} count={5000} factor={6} saturation={0} fade speed={1} />

      <Asteroids />

      <group ref={targetRef}>
        <Spacecraft position={[0, 0, 0]} color="#0099ff" />
      </group>

      <group ref={chaserRef}>
        <Spacecraft position={[0, 0, 0]} color="#ff3300" isChaser />
      </group>

      {/* Nebula background effect */}
      <mesh position={[0, 0, -50]}>
        <sphereGeometry args={[100, 32, 32]} />
        <meshBasicMaterial
          color="#110033"
          side={THREE.BackSide}
          transparent
          opacity={0.6}
        />
      </mesh>
    </>
  )
}

export default function SpacecraftChase() {
  const [isPlaying, setIsPlaying] = useState(false)
  const [time, setTime] = useState(0)
  const animationRef = useRef<number>()
  const startTimeRef = useRef<number>(0)

  useEffect(() => {
    if (isPlaying) {
      startTimeRef.current = Date.now() - time

      const animate = () => {
        const elapsed = Date.now() - startTimeRef.current

        if (elapsed >= 20000) {
          setTime(20000)
          setIsPlaying(false)
        } else {
          setTime(elapsed)
          animationRef.current = requestAnimationFrame(animate)
        }
      }

      animationRef.current = requestAnimationFrame(animate)
    } else if (animationRef.current) {
      cancelAnimationFrame(animationRef.current)
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [isPlaying])

  const handlePlay = () => {
    setIsPlaying(true)
  }

  const handleRestart = () => {
    setTime(0)
    setIsPlaying(true)
  }

  return (
    <div style={{ width: '100vw', height: '100vh' }}>
      <div className="title">Spacecraft Chase</div>
      <Canvas gl={{ antialias: true, alpha: false }}>
        <color attach="background" args={['#000000']} />
        <fog attach="fog" args={['#000000', 30, 100]} />
        <Scene time={time} />
      </Canvas>
      <div className="controls">
        {!isPlaying && time === 0 && (
          <button onClick={handlePlay}>▶ Play</button>
        )}
        {!isPlaying && time > 0 && (
          <>
            <button onClick={handlePlay}>▶ Resume</button>
            <button onClick={handleRestart}>↻ Restart</button>
          </>
        )}
        {isPlaying && (
          <button onClick={() => setIsPlaying(false)}>⏸ Pause</button>
        )}
      </div>
    </div>
  )
}
