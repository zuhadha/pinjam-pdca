import { getSettingValue } from '@/lib/actions/settings-actions'
import { SettingsForm } from '@/components/admin/settings-form'

export const metadata = {
  title: 'Pengaturan | Admin INVENSA',
  description: 'Kelola pengaturan sistem',
}

export default async function SettingsPage() {
  const adminEmails = await getSettingValue('admin_notification_emails') || ''

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Pengaturan Sistem</h1>
        <p className="text-gray-600 mt-2">Kelola konfigurasi dan preferensi aplikasi</p>
      </div>

      <SettingsForm initialEmails={adminEmails} />
    </div>
  )
}
