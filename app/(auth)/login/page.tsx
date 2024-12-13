'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import Image from 'next/image'
import Link from 'next/link'
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { toast, Zoom } from 'react-toastify'
import FloatingLabelInput from "@/components/FloatingLabelInput";

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isMounted, setIsMounted] = useState(false)
  const [supabase, setSupabase] = useState<any>(null)
  const router = useRouter()

  useEffect(() => {
    setIsMounted(true)
    setSupabase(createClient())
    setEmail("")
    setPassword("")
  }, [])

  if (!isMounted) {
    return null
  }

  async function login(e: React.FormEvent) {
    e.preventDefault()
    try {
      let { data: { user }, error } = await supabase.auth.signInWithPassword({ email, password })
  
      if (error) throw error
  
      if (!user) throw new Error('User not found after login')
  

      toast.success('Logged in successfully', {
        position: "bottom-right",
        autoClose: 4000,
        hideProgressBar: true,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: "dark",
        transition: Zoom,
      });
  
      router.push('/')
  
    } catch (error: any) {
      toast.error(`Login error: ${error.message || 'Unknown error'}`, {
        position: "bottom-right",
        autoClose: 4000,
        hideProgressBar: true,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: "dark",
        transition: Zoom,
      });
      console.error('Error during login:', error);
    } 
  }

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <div className="w-full lg:w-1/2 flex items-center justify-center px-6 py-12 lg:px-8">
        <div className="w-full max-w-sm">
          <h3 className='text-muted-foreground text-sm mb-4'>DIN DIGITALE ASSISTENT TIL DIN FASTE</h3>
          <h2 className="text-3xl font-bold mb-6 text-left text-foreground">Log ind i din konto<span className='text-green-500'>.</span></h2>
          <h3 className='text-muted-foreground text-sm my-4'>Mangler du en konto? <Link href="/signup" className='text-green-500'>Lav en her</Link></h3>
          <form className="space-y-6" onSubmit={login}>
            <FloatingLabelInput value={email} onChange={(e: any) => setEmail(e.target.value)} label="Email" id="email"/>
            <FloatingLabelInput value={password} onChange={(e: any) => setPassword(e.target.value)} label="Password" id="password"/>
            <Button type="submit" className="w-full h-12 rounded-full bg-blue-500 hover:bg-blue-600 text-white">
              Log ind
            </Button>
          </form>
        </div>
      </div>
      <div className="hidden lg:block lg:w-1/2 relative">
        <Image
          src="/3.jpg"
          alt="Login background"
          layout="fill"
          objectFit="cover"
        />
        <div className="absolute inset-0 bg-gradient-to-l from-transparent to-background"></div>
      </div>
    </div>
  )
}