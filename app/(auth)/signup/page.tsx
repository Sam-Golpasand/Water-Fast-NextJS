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


export default function SignupPage() {
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
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
    setFirstName("")
    setLastName("")
  }, [])

  if (!isMounted) {
    return null 
  }

  async function signup(e: React.FormEvent) {
    e.preventDefault()
  
    try {
      console.log('Attempting signup with:', { email, firstName, lastName });
      const { data, error } = await supabase.auth.signUp({ 
        email: email, 
        password: password,
        options: {
          data: {
            first_name: firstName,
            last_name: lastName,
          }
        }
      })
  
      if (error) {
        console.error('Supabase signup error:', error);
        throw error;
      }
  
      if (data.user && data.user.identities && data.user.identities.length === 0) {
        toast.info('An account with this email already exists. Please check your email for the confirmation link.', {
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

        console.log('Signup response:', data);
      } else {
        toast.success('Signup successful!', {
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
        router.replace('/login');
      }
    } catch (error) {
      console.error('Detailed signup error:', error);
      toast.error('Error during signup', {
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
    }
  }

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <div className="w-full lg:w-1/2 flex items-center justify-center px-6 py-12 lg:px-8">
        <div className="w-full max-w-sm">
          <h3 className='text-muted-foreground text-sm mb-4'>DIN DIGITALE ASSISTENT TIL DIN FASTE</h3>
          <h2 className="text-3xl font-bold mb-6 text-left text-foreground">Create new account<span className='text-green-500'>.</span></h2>
          <h3 className='text-muted-foreground text-sm my-4'>Har du allerede en konto? <Link href="/login" className='text-green-500'>Log Ind</Link></h3>
          <form className="space-y-6" onSubmit={signup}>
            <div className="grid grid-cols-2 gap-4">
              <FloatingLabelInput value={firstName} onChange={(e: any) => setFirstName(e.target.value)} label="First Name" id="firstName"/>
              <FloatingLabelInput value={lastName} onChange={(e: any) => setLastName(e.target.value)} label="Last Name" id="lastName"/>
            </div>
            <FloatingLabelInput value={email} onChange={(e: any) => setEmail(e.target.value)} label="Email" id="email"/>
            <FloatingLabelInput value={password} onChange={(e: any) => setPassword(e.target.value)} label="Password" id="password"/>
            <Button type="submit" className="w-full h-12 rounded-full bg-green-500 hover:bg-green-600 text-white">
              Sign up
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