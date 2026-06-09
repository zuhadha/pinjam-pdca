import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Img,
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

interface AdminBorrowNotificationEmailProps {
  borrowerName: string
  borrowerEmail: string
  borrowerDivision: string
  items: BorrowItem[]
  startDate: string
  endDate: string
  usageLocation: string
  purpose: string
  isPermanent: boolean
  requestId: string
}

export const AdminBorrowNotificationEmail = ({
  borrowerName = 'Pengguna',
  borrowerEmail = '-',
  borrowerDivision = '-',
  items = [],
  startDate = '-',
  endDate = '-',
  usageLocation = '-',
  purpose = '-',
  isPermanent = false,
  requestId = '-',
}: AdminBorrowNotificationEmailProps) => {
  const appUrl = (process.env.APP_URL || 'http://localhost:3000').replace(/\/$/, '')
  const logoUrl = `${appUrl}/logo-email.png`
  const adminUrl = `${appUrl}/admin/requests`

  return (
    <Html>
      <Head />
      <Preview>
        {isPermanent
          ? `[INVENSA] Permintaan barang baru dari ${borrowerName} (${borrowerDivision})`
          : `[INVENSA] Peminjaman barang baru dari ${borrowerName} (${borrowerDivision})`}
      </Preview>
      <Body style={main}>
        <Container style={container}>
          {/* Header */}
          <Section style={header}>
            {/* <Section style={logoWrapper}>
              <Img
                src={logoUrl}
                alt="INVENSA"
                width="140"
                style={logoStyle}
              />
            </Section> */}
            <Heading style={h1}>
              {isPermanent ? '📦 Permintaan Barang Baru' : '📋 Peminjaman Barang Baru'}
            </Heading>
          </Section>

          {/* Intro */}
          <Section style={section}>
            <Text style={text}>
              Ada {isPermanent ? 'permintaan barang' : 'peminjaman barang'} baru yang masuk ke sistem.
              Silakan periksa lebih lanjut melalui halaman admin.
            </Text>
          </Section>

          {/* Borrower Info */}
          <Section style={detailsBoxWrapper}>
            <Section style={detailsBox}>
              <Heading as="h2" style={h2}>
                👤 Informasi Peminjam
              </Heading>

              <div style={detailRow}>
                <Text style={detailText}><strong>Nama:</strong> {borrowerName}</Text>
                <Text style={detailText}><strong>Email:</strong> {borrowerEmail}</Text>
                <Text style={detailText}><strong>Divisi:</strong> {borrowerDivision}</Text>
                <Text style={detailText}><strong>Tipe:</strong> {isPermanent ? '🏷️ Permintaan Tetap' : '🔄 Peminjaman Sementara'}</Text>
              </div>
            </Section>
          </Section>

          {/* Request Details */}
          <Section style={detailsBoxWrapper}>
            <Section style={detailsBox}>
              <Heading as="h2" style={h2}>
                📋 Detail {isPermanent ? 'Permintaan' : 'Peminjaman'}
              </Heading>

              <Text style={detailLabel}>Barang yang {isPermanent ? 'diminta' : 'dipinjam'}:</Text>
              {items.map((item, index) => (
                <Text key={index} style={itemText}>
                  • {item.name} ({item.category}) — <strong>{item.quantity} unit</strong>
                </Text>
              ))}

              <Hr style={divider} />

              <Text style={detailText}><strong>Keperluan:</strong> {purpose}</Text>
              {!isPermanent && (
                <>
                  <Text style={detailText}><strong>Lokasi Penggunaan:</strong> {usageLocation}</Text>
                  <Text style={detailText}>
                    <strong>Periode Peminjaman:</strong>
                    <br />
                    <span style={dateSpan}>{startDate} — {endDate}</span>
                  </Text>
                </>
              )}

              <Hr style={divider} />

              <Text style={detailText}>
                <strong>ID Request:</strong>{' '}
                <span style={monoText}>{requestId}</span>
              </Text>
            </Section>
          </Section>

          {/* Action Info */}
          <Section style={infoBoxWrapper}>
            <Section style={infoBox}>
              <Text style={infoText}>
                🔗 <strong>Tindak Lanjut:</strong> Masuk ke halaman admin untuk melihat detail peminjaman dan melakukan verifikasi pengembalian ketika barang sudah dikembalikan.
              </Text>
              <Text style={infoText}>
                Link Admin: <a href={adminUrl} style={linkStyle}>{adminUrl}</a>
              </Text>
            </Section>
          </Section>

          {/* Footer */}
          <Section style={footer}>
            <Hr style={divider} />
            <Text style={footerText}>
              Email ini dikirim secara otomatis oleh sistem <strong>INVENSA</strong> karena alamat email Anda terdaftar sebagai penerima notifikasi admin.
            </Text>
            <Text style={footerText}>
              Untuk mengubah pengaturan notifikasi, kunjungi <a href={`${appUrl}/admin/settings`} style={linkStyle}>Pengaturan Admin</a>.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  )
}

export default AdminBorrowNotificationEmail

// ─── Styles ───────────────────────────────────────────────────────────────────

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

const header = {
  padding: '32px 24px',
  backgroundColor: '#1e40af',
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
  fontSize: '16px',
  fontWeight: 'bold',
  margin: '0 0 12px',
}

const section = {
  padding: '0 32px',
  marginTop: '24px',
}

const text = {
  color: '#334155',
  fontSize: '15px',
  lineHeight: '24px',
  margin: '0 0 12px',
}

const detailsBoxWrapper = {
  padding: '0 24px',
  marginTop: '16px',
}

const detailsBox = {
  padding: '20px 24px',
  backgroundColor: '#f8fafc',
  borderRadius: '12px',
  border: '1px solid #e2e8f0',
  width: '100%',
}

const detailRow = {
  margin: '0',
  padding: '0',
}

const detailLabel = {
  color: '#64748b',
  fontSize: '12px',
  fontWeight: '700',
  margin: '0 0 8px',
  textTransform: 'uppercase' as const,
  letterSpacing: '0.05em',
}

const itemText = {
  color: '#0f172a',
  fontSize: '14px',
  lineHeight: '22px',
  margin: '4px 0',
}

const detailText = {
  color: '#334155',
  fontSize: '14px',
  lineHeight: '22px',
  margin: '6px 0',
}

const dateSpan = {
  color: '#475569',
  fontSize: '13px',
}

const monoText = {
  fontFamily: 'monospace',
  color: '#6b7280',
  fontSize: '12px',
}

const infoBoxWrapper = {
  padding: '0 24px',
  marginTop: '12px',
}

const infoBox = {
  padding: '16px 20px',
  backgroundColor: '#eff6ff',
  borderRadius: '12px',
  borderLeft: '4px solid #3b82f6',
  width: '100%',
}

const infoText = {
  color: '#1e40af',
  fontSize: '14px',
  lineHeight: '22px',
  margin: '4px 0',
}

const linkStyle = {
  color: '#2563eb',
  textDecoration: 'underline',
}

const divider = {
  borderColor: '#e2e8f0',
  margin: '16px 0',
}

const footer = {
  padding: '0 32px',
  marginTop: '32px',
}

const footerText = {
  color: '#94a3b8',
  fontSize: '12px',
  lineHeight: '18px',
  textAlign: 'center' as const,
  margin: '8px 0',
}
