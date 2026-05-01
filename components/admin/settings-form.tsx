'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { updateSetting } from '@/lib/actions/settings-actions'
import { Save, Loader2 } from 'lucide-react'

interface SettingsFormProps {
  initialEmails: string
}

export function SettingsForm({ initialEmails }: SettingsFormProps) {
  const [emails, setEmails] = useState(initialEmails)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setMessage(null)

    try {
      const result = await updateSetting('admin_notification_emails', emails)

      if (result.error) {
        setMessage({ type: 'error', text: result.error })
      } else {
        setMessage({ type: 'success', text: 'Pengaturan berhasil disimpan' })
        router.refresh()
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Terjadi kesalahan sistem' })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Pengaturan Notifikasi</CardTitle>
        <CardDescription>
          Atur email admin yang akan menerima notifikasi jika ada peminjaman baru.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-3">
            <Label htmlFor="emails">Email Notifikasi Admin</Label>
            <Input
              id="emails"
              value={emails}
              onChange={(e) => setEmails(e.target.value)}
              placeholder="admin1@email.com, admin2@email.com"
            />
            <p className="text-sm text-gray-500">
              Pisahkan beberapa alamat email dengan koma (,). Kosongkan jika tidak ingin menerima notifikasi.
            </p>
          </div>

          {message && (
            <div
              className={`p-3 rounded-lg text-sm font-medium ${
                message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
              }`}
            >
              {message.text}
            </div>
          )}

          <Button type="submit" disabled={isSubmitting} className="w-full sm:w-auto">
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Menyimpan...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Simpan Pengaturan
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
