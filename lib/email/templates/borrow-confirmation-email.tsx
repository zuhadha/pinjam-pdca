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
  Button,
  Row,
  Column,
} from '@react-email/components'

interface BorrowItem {
  name: string
  quantity: number
  category: string
}

interface BorrowConfirmationEmailProps {
  borrowerName: string
  borrowerDivision: string
  items: BorrowItem[]
  startDate: string
  endDate: string
  usageLocation: string
  purpose: string
  isPermanent: boolean
  returnUrl: string
}

export const BorrowConfirmationEmail = ({
  borrowerName = 'Pengguna',
  borrowerDivision = '-',
  items = [],
  startDate = '-',
  endDate = '-',
  usageLocation = '-',
  purpose = '-',
  isPermanent = false,
  returnUrl = 'https://example.com',
}: BorrowConfirmationEmailProps) => {
  const appUrl = (process.env.APP_URL || 'http://localhost:3000').replace(/\/$/, '')
  const logoUrl = 'https://drive.google.com/uc?export=view&id=1VLKTrJkUUIT15YTU_cXpu8zpozAMO26f'

  return (
    <Html>
      <Head />
      <Preview>
        {isPermanent
          ? `Permintaan barang Anda berhasil — ${borrowerName}`
          : `Peminjaman barang berhasil — ${borrowerName}`}
      </Preview>
      <Body style={main}>
        <Container style={container}>
          {/* Header with logo */}
          <Section style={header}>
            <Section style={logoWrapper}>
              <Img
                src={logoUrl}
                alt="INVENSA"
                width="140"
                style={logoStyle}
              />
            </Section>
            <Heading style={h1}>
              {isPermanent ? 'Permintaan Barang Berhasil' : 'Peminjaman Barang Berhasil'}
            </Heading>
          </Section>

          {/* Greeting */}
          <Section style={section}>
            <Text style={text}>
              Halo <strong>{borrowerName}</strong>,
            </Text>
            <Text style={text}>
              {isPermanent
                ? 'Permintaan barang Anda telah berhasil dicatat oleh sistem. Silakan ambil barang yang Anda butuhkan dengan menghubungi PIC (Person in Charge) departemen terkait.'
                : 'Peminjaman barang Anda telah berhasil dicatat oleh sistem. Silakan ambil barang yang Anda butuhkan dengan menghubungi PIC (Person in Charge) departemen terkait.'}
            </Text>
          </Section>

          {/* Borrow Details Box */}
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

              <div style={detailRow}>
                <Text style={detailText}><strong>Nama:</strong> {borrowerName}</Text>
                <Text style={detailText}><strong>Divisi:</strong> {borrowerDivision}</Text>
                {!isPermanent && (
                  <>
                    <Text style={detailText}><strong>Keperluan:</strong> {purpose}</Text>
                    <Text style={detailText}><strong>Lokasi Penggunaan:</strong> {usageLocation}</Text>
                  </>
                )}
              </div>
              
              {!isPermanent && (
                <Text style={detailText}>
                  <strong>Periode Peminjaman:</strong>
                  <br />
                  <span style={dateSpan}>{startDate} — {endDate}</span>
                </Text>
              )}
            </Section>
          </Section>

          {/* Info box */}
          <Section style={infoBoxWrapper}>
            <Section style={infoBox}>
              <Text style={infoText}>
                💡 <strong>Cara Pengambilan Barang:</strong> Hubungi PIC departemen terkait dan tunjukkan email konfirmasi ini sebagai bukti {isPermanent ? 'permintaan' : 'peminjaman'} Anda.
              </Text>
            </Section>
          </Section>

          {/* Return button - only for borrowing */}
          {!isPermanent && (
            <>
              <Section style={section}>
                <Text style={text}>
                  Setelah barang selesai digunakan, mohon segera lakukan konfirmasi pengembalian dengan menekan tombol di bawah ini:
                </Text>
              </Section>

              <Section style={buttonContainer}>
                <Button style={button} href={returnUrl}>
                  ✓ Konfirmasi Pengembalian Barang
                </Button>
              </Section>

              <Section style={section}>
                <Text style={smallText}>
                  Dengan mengklik tombol di atas, Anda mengkonfirmasi bahwa barang telah dikembalikan kepada PIC terkait. Admin akan melakukan verifikasi akhir untuk menyelesaikan proses pengembalian.
                </Text>
                <Text style={smallText}>
                  Tombol ini akan tetap aktif dan dapat digunakan kapan saja saat Anda siap mengembalikan barang.
                </Text>
              </Section>
            </>
          )}

          {/* Footer */}
          <Section style={footer}>
            <Hr style={divider} />
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

export default BorrowConfirmationEmail

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
  backgroundColor: '#16a34a',
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
  marginTop: '24px',
}

const detailsBox = {
  padding: '24px',
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
  margin: '8px 0',
}

const dateSpan = {
  color: '#475569',
  fontSize: '13px',
}

const infoBoxWrapper = {
  padding: '0 24px',
  marginTop: '12px',
}

const infoBox = {
  padding: '16px 20px',
  backgroundColor: '#f0f9ff',
  borderRadius: '12px',
  borderLeft: '4px solid #3b82f6',
  width: '100%',
}

const infoText = {
  color: '#0369a1',
  fontSize: '14px',
  lineHeight: '22px',
  margin: '0',
}

const buttonContainer = {
  textAlign: 'center' as const,
  margin: '32px 0',
}

const button = {
  backgroundColor: '#16a34a',
  borderRadius: '8px',
  color: '#ffffff',
  fontSize: '15px',
  fontWeight: 'bold',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
  padding: '16px 32px',
}

const smallText = {
  color: '#64748b',
  fontSize: '13px',
  lineHeight: '20px',
  margin: '6px 32px',
  textAlign: 'center' as const,
}

const divider = {
  borderColor: '#e2e8f0',
  margin: '24px 0',
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
