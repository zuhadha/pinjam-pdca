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
  return (
    <Html>
      <Head />
      <Preview>Reminder: Pengembalian barang telah terlambat {daysOverdue.toString()} hari</Preview>
      <Body style={main}>
        <Container style={container}>
          {/* Header */}
          <Section style={header}>
            <Heading style={h1}>⚠️ Pengingat Pengembalian Barang</Heading>
          </Section>

          {/* Greeting */}
          <Section style={section}>
            <Text style={text}>Halo <strong>{userName}</strong>,</Text>
            <Text style={text}>
              Kami ingin mengingatkan bahwa waktu pengembalian barang pinjaman Anda telah{' '}
              <strong style={warningText}>terlambat {daysOverdue} hari</strong>.
            </Text>
          </Section>

          {/* Borrow Details */}
          <Section style={detailsBox}>
            <Heading as="h2" style={h2}>
              📋 Detail Peminjaman
            </Heading>
            
            <Text style={detailLabel}>Barang yang dipinjam:</Text>
            {items.map((item, index) => (
              <Text key={index} style={itemText}>
                • {item.name} ({item.category}) - <strong>{item.quantity} unit</strong>
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
          <Section style={warningBox}>
            <Text style={warningTextBox}>
              ⚠️ Mohon segera mengembalikan barang yang dipinjam agar tidak mengganggu kebutuhan
              pengguna lain. Barang yang terlambat dikembalikan dapat mempengaruhi akses peminjaman
              Anda di masa depan.
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
              Email ini dikirim secara otomatis oleh sistem Peminjaman Barang PDCA.
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
  backgroundColor: '#f6f9fc',
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
}

const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  padding: '20px 0 48px',
  marginBottom: '64px',
  maxWidth: '600px',
}

const header = {
  padding: '32px 24px',
  backgroundColor: '#dc2626',
  borderRadius: '8px 8px 0 0',
  textAlign: 'center' as const,
}

const h1 = {
  color: '#ffffff',
  fontSize: '28px',
  fontWeight: 'bold',
  margin: '0',
  padding: '0',
}

const h2 = {
  color: '#1f2937',
  fontSize: '20px',
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
