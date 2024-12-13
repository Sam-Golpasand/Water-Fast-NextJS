'use client'

import { useState, useEffect } from 'react'
import AnomalyDetector from '@/components/AnomalyDetector'
import { createClient } from '@/utils/supabase/client'
import { User } from '@supabase/supabase-js'

export default function Home() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchUser = async () => {
      const supabase = createClient()
      try {
        const { data: { user } } = await supabase.auth.getUser()
        setUser(user)
      } catch (err) {
        console.error('Unexpected error:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchUser()
  }, [])

  if (loading) {
    return <p className='flex justify-center items-center h-screen'>Loading...</p>
  }

  return (
    <main>
      {user ? <AnomalyDetector userId={user.id} /> : <p>No user found. Please log in.</p>}
    </main>
  )
}

