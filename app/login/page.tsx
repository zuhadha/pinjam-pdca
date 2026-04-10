'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { loginAction } from '@/lib/auth/actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import Image from 'next/image'

export default function LoginPage() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const result = await loginAction(username, password)
      
      if (result.error) {
        setError(result.error)
        setLoading(false)
      } else if (result.success) {
        router.push('/admin')
      }
    } catch (err) {
      setError('Terjadi kesalahan. Silakan coba lagi.')
      setLoading(false)
    }
  }

  return (
    <div className="h-screen w-screen flex items-center justify-center bg-gray-900 overflow-hidden relative">
      {/* Background Image with Blur */}
      <div className="absolute inset-0 z-0">
        <Image
          src="/bg-login.webp"
          alt="Background"
          fill
          className="object-cover blur-[8px] scale-105 opacity-60"
          priority
        />
        <div className="absolute inset-0 bg-black/20" /> {/* subtle overlay */}
      </div>

      <div className="w-full max-w-sm px-8 py-10 rounded-3xl bg-white backdrop-blur-xl shadow-2xl z-10 mx-4 border border-white/20">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <Image
            src="/logo-invensa.jpeg"
            alt="INVENSA Logo"
            width={220}
            height={80}
            className="h-20 w-auto object-contain mix-blend-multiply"
            priority
          />
        </div>

        <div className="space-y-6">
          <div className="text-center space-y-1">
            <h1 className="text-2xl font-bold tracking-tight text-gray-900">Selamat Datang</h1>
            <p className="text-sm text-gray-600">Sistem Inventaris Barang Internal</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1">
              <Input
                id="username"
                type="text"
                placeholder="Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                disabled={loading}
                autoComplete="username"
                className="h-12 bg-white/50 border-gray-200 focus:ring-2 focus:ring-primary-600 transition-all text-base rounded-xl"
              />
            </div>

            <div className="space-y-1">
              <Input
                id="password"
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
                autoComplete="current-password"
                className="h-12 bg-white/50 border-gray-200 focus:ring-2 focus:ring-primary-600 transition-all text-base rounded-xl"
              />
            </div>

            {error && (
              <div className="text-red-500 text-xs text-center font-semibold bg-red-50 py-2 rounded-lg">
                {error}
              </div>
            )}

            <Button
              type="submit"
              variant="primary"
              className="w-full h-12 text-base font-bold shadow-lg rounded-xl transition-transform active:scale-95"
              disabled={loading}
            >
              {loading ? 'Masuk...' : 'Login Admin'}
            </Button>
          </form>

          <div className="text-center">
            <button
              onClick={() => router.push('/')}
              className="text-sm font-medium text-gray-500 hover:text-gray-800 transition-colors"
            >
              ← Kembali ke Beranda
            </button>
          </div>
        </div>

        <p className="mt-12 text-center text-[10px] text-gray-500 uppercase tracking-widest font-bold">
          INVENSA &copy; 2025
        </p>
      </div>
    </div>
  )
}
