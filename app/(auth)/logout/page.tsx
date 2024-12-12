"use client"

import React, { useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'

export default function Page() {
  const router = useRouter()

  async function logsOut() {
    const supabase = await createClient()

    let { error } = await supabase.auth.signOut()
    if (error) {
      console.error('Error logging out:', error)
    } else {
      router.push('/login')
    }
  }

  useEffect(() => {
    logsOut()
  }, [])

  return (
    <div className='flex min-h-screen justify-center items-center bg-background text-foreground'>
      logging out...
    </div>
  )
}