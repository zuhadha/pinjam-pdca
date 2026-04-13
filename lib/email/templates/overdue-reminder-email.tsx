import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Text,
  Hr,
  Img,
  Row,
  Column,
} from '@react-email/components'

interface BorrowItem {
  name: string
  quantity: number
  category: string
}

interface OverdueReminderEmailProps {
  userName: string
  items: BorrowItem[]
  startDate: string
  endDate: string
  usageLocation: string
  daysOverdue: number
  returnUrl: string
}

export const OverdueReminderEmail = ({
  userName = 'User',
  items = [],
  startDate = '2024-01-01',
  endDate = '2024-01-07',
  usageLocation = 'Lokasi tidak diketahui',
  daysOverdue = 1,
  returnUrl = 'https://example.com',
}: OverdueReminderEmailProps) => {
  const appUrl = (process.env.APP_URL || 'http://localhost:3000').replace(/\/$/, '')
  const logoUrl = `${appUrl}/logo-invensa.png`

  return (
    <Html>
      <Head />
      <Preview>
        {daysOverdue > 0 
          ? `Peringatan: Pengembalian barang terlambat ${daysOverdue.toString()} hari` 
          : `Pengingat: Jangan lupa kembalikan barang tepat waktu`}
      </Preview>
      <Body style={main}>
        <Container style={container}>
          {/* Header */}
          <Section style={daysOverdue > 0 ? headerOverdue : headerNormal}>
            <Section style={logoWrapper}>
              <Img
                src={logoUrl}
                alt="INVENSA"
                width="140"
                style={logoStyle}
              />
            </Section>
            <Heading style={h1}>
              {daysOverdue > 0 ? '⚠️ Peringatan Terlambat' : 'ℹ️ Pengingat Peminjaman'}
            </Heading>
          </Section>

          {/* Greeting */}
          <Section style={section}>
            <Text style={text}>Halo <strong>{userName}</strong>,</Text>
            {daysOverdue > 0 ? (
              <Text style={text}>
                Kami ingin mengingatkan bahwa waktu pengembalian barang pinjaman Anda telah{' '}
                <strong style={warningText}>terlambat {daysOverdue} hari</strong>.
              </Text>
            ) : (
              <Text style={text}>
                Email ini adalah pengingat otomatis bahwa Anda saat ini sedang meminjam barang dari INVENSA yang 
                jatuh tempo dalam <strong>{Math.abs(daysOverdue)} hari</strong>.
              </Text>
            )}
          </Section>

          {/* Borrow Details */}
          <Section style={detailsBox}>
            <Heading as="h2" style={h2}>
              📋 Detail Peminjaman
            </Heading>
            
            <Text style={detailLabel}>Barang yang dipinjam:</Text>
            {items.map((item, index) => (
              <Text key={index} style={itemText}>
                • {item.name} - <strong>{item.quantity} unit</strong>
              </Text>
            ))}

            <Hr style={divider} />

            <Text style={detailText}>
              <strong>Periode Peminjaman:</strong>
              <br />
              {startDate} - {endDate}
            </Text>

            <Text style={detailText}>
              <strong>Lokasi Penggunaan:</strong>
              <br />
              {usageLocation}
            </Text>
          </Section>

          {/* Warning Message */}
          <Section style={daysOverdue > 0 ? warningBox : infoBox}>
            <Text style={daysOverdue > 0 ? warningTextBox : infoTextBox}>
              {daysOverdue > 0 ? 
                '⚠️ Mohon segera mengembalikan barang yang dipinjam agar tidak mengganggu kebutuhan pengguna lain. Barang yang terlambat dikembalikan dapat mempengaruhi akses peminjaman Anda di masa depan.' 
              : 
                'ℹ️ Jangan lupa untuk menekan tombol konfirmasi di bawah ini apabila Anda telah selesai meminjam dan mengembalikan barangnya.'
              }
            </Text>
          </Section>

          {/* CTA Button */}
          <Section style={buttonContainer}>
            <Button style={button} href={returnUrl}>
              ✓ Konfirmasi Pengembalian Sekarang
            </Button>
          </Section>

          <Section style={section}>
            <Text style={smallText}>
              Dengan mengklik tombol di atas, Anda mengkonfirmasi bahwa barang telah dikembalikan.
              Admin akan melakukan verifikasi untuk menyelesaikan proses pengembalian.
            </Text>
          </Section>

          {/* Footer */}
          <Hr style={divider} />
          <Section style={footer}>
            <Text style={footerText}>
              Jika Anda memiliki pertanyaan atau kendala, silakan hubungi tim admin.
            </Text>
            <Text style={footerText}>
              Email ini dikirim secara otomatis oleh sistem <strong>INVENSA</strong>.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  )
}

export default OverdueReminderEmail

// Styles
const main = {
  backgroundColor: '#f1f5f9',
  fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
}

const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  paddingBottom: '48px',
  marginBottom: '64px',
  maxWidth: '580px',
  width: '100%',
  borderCollapse: 'collapse' as const,
}

const headerOverdue = {
  padding: '32px 24px',
  backgroundColor: '#dc2626',
  borderRadius: '8px 8px 0 0',
  textAlign: 'center' as const,
}

const headerNormal = {
  padding: '32px 24px',
  backgroundColor: '#2563eb', // Blue for normal reminder
  textAlign: 'center' as const,
}

const logoWrapper = {
  backgroundColor: '#ffffff',
  borderRadius: '12px',
  display: 'inline-block',
  padding: '12px 16px',
  marginBottom: '20px',
  width: 'auto',
}

const logoStyle = {
  display: 'block',
  margin: '0 auto',
}

const h1 = {
  color: '#ffffff',
  fontSize: '24px',
  fontWeight: 'bold',
  margin: '0',
}

const h2 = {
  color: '#1f2937',
  fontSize: '18px',
  fontWeight: 'bold',
  margin: '0 0 16px',
}

const section = {
  padding: '0 24px',
  marginTop: '24px',
}

const text = {
  color: '#374151',
  fontSize: '16px',
  lineHeight: '24px',
  margin: '0 0 16px',
}

const detailsBox = {
  padding: '24px',
  margin: '24px',
  backgroundColor: '#f9fafb',
  borderRadius: '8px',
  border: '1px solid #e5e7eb',
}

const detailLabel = {
  color: '#6b7280',
  fontSize: '14px',
  fontWeight: '600',
  margin: '0 0 8px',
  textTransform: 'uppercase' as const,
  letterSpacing: '0.5px',
}

const itemText = {
  color: '#1f2937',
  fontSize: '15px',
  lineHeight: '22px',
  margin: '4px 0',
}

const detailText = {
  color: '#374151',
  fontSize: '15px',
  lineHeight: '22px',
  margin: '12px 0',
}

const warningBox = {
  padding: '20px 24px',
  margin: '24px',
  backgroundColor: '#fef3c7',
  borderRadius: '8px',
  borderLeft: '4px solid #f59e0b',
}

const warningText = {
  color: '#dc2626',
  fontWeight: 'bold',
}

const warningTextBox = {
  color: '#92400e',
  fontSize: '14px',
  lineHeight: '20px',
  margin: '0',
}

const infoBox = {
  padding: '20px 24px',
  margin: '24px',
  backgroundColor: '#eff6ff',
  borderRadius: '8px',
  borderLeft: '4px solid #3b82f6',
}

const infoTextBox = {
  color: '#1e3a8a',
  fontSize: '14px',
  lineHeight: '20px',
  margin: '0',
}

const buttonContainer = {
  textAlign: 'center' as const,
  margin: '32px 0',
}

const button = {
  backgroundColor: '#16a34a',
  borderRadius: '6px',
  color: '#ffffff',
  fontSize: '16px',
  fontWeight: 'bold',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
  padding: '14px 32px',
}

const smallText = {
  color: '#6b7280',
  fontSize: '13px',
  lineHeight: '20px',
  margin: '0 24px',
  textAlign: 'center' as const,
}

const divider = {
  borderColor: '#e5e7eb',
  margin: '24px 0',
}

const footer = {
  padding: '0 24px',
  marginTop: '24px',
}

const footerText = {
  color: '#6b7280',
  fontSize: '12px',
  lineHeight: '18px',
  textAlign: 'center' as const,
  margin: '8px 0',
}
