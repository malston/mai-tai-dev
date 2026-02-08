'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

// Shared AudioContext for all sounds
let sharedAudioContext: AudioContext | null = null
let audioUnlocked = false

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null

  if (!sharedAudioContext) {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
    if (AudioContextClass) {
      sharedAudioContext = new AudioContextClass()
    }
  }
  return sharedAudioContext
}

// Play ping using Web Audio API
function playPing() {
  const ctx = getAudioContext()
  if (!ctx) return

  // Resume context if suspended (iOS requirement)
  if (ctx.state === 'suspended') {
    ctx.resume()
  }

  try {
    const oscillator = ctx.createOscillator()
    const gainNode = ctx.createGain()

    oscillator.connect(gainNode)
    gainNode.connect(ctx.destination)

    // Pleasant notification tone - two quick notes
    oscillator.frequency.setValueAtTime(880, ctx.currentTime) // A5
    oscillator.frequency.setValueAtTime(1100, ctx.currentTime + 0.08) // C#6
    oscillator.type = 'sine'

    // Soft envelope
    gainNode.gain.setValueAtTime(0, ctx.currentTime)
    gainNode.gain.linearRampToValueAtTime(0.15, ctx.currentTime + 0.01)
    gainNode.gain.linearRampToValueAtTime(0.1, ctx.currentTime + 0.08)
    gainNode.gain.linearRampToValueAtTime(0.15, ctx.currentTime + 0.09)
    gainNode.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.2)

    oscillator.start(ctx.currentTime)
    oscillator.stop(ctx.currentTime + 0.2)
  } catch (e) {
    console.warn('Could not play notification sound:', e)
  }
}

export function useNotificationSound() {
  const [enabled, setEnabled] = useState(true)
  const [mounted, setMounted] = useState(false)
  const hasInteracted = useRef(false)

  // Load preference from localStorage
  useEffect(() => {
    setMounted(true)
    const stored = localStorage.getItem('notificationSound')
    if (stored !== null) {
      setEnabled(stored === 'true')
    }

    // Unlock audio on first user interaction (iOS requirement)
    const unlockAudio = () => {
      if (!audioUnlocked) {
        const ctx = getAudioContext()
        if (ctx && ctx.state === 'suspended') {
          ctx.resume()
        }
        audioUnlocked = true
        hasInteracted.current = true
      }
    }

    document.addEventListener('touchstart', unlockAudio, { once: true })
    document.addEventListener('click', unlockAudio, { once: true })

    return () => {
      document.removeEventListener('touchstart', unlockAudio)
      document.removeEventListener('click', unlockAudio)
    }
  }, [])

  // Save preference to localStorage
  const setNotificationEnabled = useCallback((value: boolean) => {
    setEnabled(value)
    localStorage.setItem('notificationSound', String(value))
  }, [])

  const playSound = useCallback(() => {
    if (enabled && mounted) {
      playPing()
    }
  }, [enabled, mounted])

  return {
    enabled,
    setEnabled: setNotificationEnabled,
    playSound,
  }
}

