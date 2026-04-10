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
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://invensa.app'
  const logoUrl = `${appUrl}/logo-invensa.jpeg`

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
                width="120"
                height="auto"
                style={logoStyle}
              />
            </Section>
            <Heading style={h1}>
              {isPermanent ? '📦 Permintaan Barang Berhasil' : '✅ Peminjaman Barang Berhasil'}
            </Heading>
          </Section>

          {/* Greeting */}
          <Section style={section}>
            <Text style={text}>
              Halo <strong>{borrowerName}</strong>,
            </Text>
            <Text style={text}>
              {isPermanent
                ? 'Permintaan barang Anda telah berhasil dicatat oleh sistem. Silakan hubungi PIC (Person in Charge) departemen terkait untuk mengambil barang yang dibutuhkan.'
                : 'Peminjaman barang Anda telah berhasil dicatat oleh sistem. Silakan ambil barang yang Anda butuhkan dengan menghubungi PIC (Person in Charge) departemen terkait.'}
            </Text>
          </Section>

          {/* Borrow Details Box */}
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

            <Text style={detailText}>
              <strong>Nama:</strong> {borrowerName}
            </Text>
            <Text style={detailText}>
              <strong>Divisi:</strong> {borrowerDivision}
            </Text>
            <Text style={detailText}>
              <strong>Keperluan:</strong> {purpose}
            </Text>
            <Text style={detailText}>
              <strong>Lokasi Penggunaan:</strong> {usageLocation}
            </Text>
            {!isPermanent && (
              <Text style={detailText}>
                <strong>Periode Peminjaman:</strong>
                <br />
                {startDate} — {endDate}
              </Text>
            )}
          </Section>

          {/* Info box */}
          <Section style={infoBox}>
            <Text style={infoText}>
              💡 <strong>Cara Pengambilan Barang:</strong> Hubungi PIC departemen terkait dan tunjukkan email konfirmasi ini sebagai bukti {isPermanent ? 'permintaan' : 'peminjaman'} Anda.
            </Text>
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

export default BorrowConfirmationEmail

// ─── Styles ───────────────────────────────────────────────────────────────────

const main = {
  backgroundColor: '#f1f5f9',
  fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
}

const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  padding: '0 0 48px',
  marginBottom: '64px',
  maxWidth: '560px',
  width: '100%',
}

const header = {
  padding: '28px 24px 24px',
  backgroundColor: '#16a34a',
  borderRadius: '8px 8px 0 0',
  textAlign: 'center' as const,
}

const logoWrapper = {
  backgroundColor: '#ffffff',
  borderRadius: '8px',
  display: 'inline-block',
  padding: '8px 12px',
  marginBottom: '16px',
}

const logoStyle = {
  display: 'block',
  margin: '0 auto',
  borderRadius: '4px',
}

const h1 = {
  color: '#ffffff',
  fontSize: '22px',
  fontWeight: 'bold',
  margin: '0',
  padding: '0',
}

const h2 = {
  color: '#1f2937',
  fontSize: '16px',
  fontWeight: 'bold',
  margin: '0 0 12px',
}

const section = {
  padding: '0 24px',
  marginTop: '20px',
}

const text = {
  color: '#374151',
  fontSize: '14px',
  lineHeight: '22px',
  margin: '0 0 12px',
}

const detailsBox = {
  padding: '20px',
  margin: '20px 24px',
  backgroundColor: '#f9fafb',
  borderRadius: '8px',
  border: '1px solid #e5e7eb',
}

const detailLabel = {
  color: '#6b7280',
  fontSize: '11px',
  fontWeight: '600',
  margin: '0 0 6px',
  textTransform: 'uppercase' as const,
  letterSpacing: '0.5px',
}

const itemText = {
  color: '#1f2937',
  fontSize: '13px',
  lineHeight: '20px',
  margin: '3px 0',
}

const detailText = {
  color: '#374151',
  fontSize: '13px',
  lineHeight: '20px',
  margin: '6px 0',
}

const infoBox = {
  padding: '14px 16px',
  margin: '4px 24px 0',
  backgroundColor: '#eff6ff',
  borderRadius: '8px',
  borderLeft: '4px solid #3b82f6',
}

const infoText = {
  color: '#1e40af',
  fontSize: '13px',
  lineHeight: '19px',
  margin: '0',
}

const buttonContainer = {
  textAlign: 'center' as const,
  margin: '24px 0',
}

const button = {
  backgroundColor: '#16a34a',
  borderRadius: '6px',
  color: '#ffffff',
  fontSize: '14px',
  fontWeight: 'bold',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
  padding: '12px 28px',
}

const smallText = {
  color: '#6b7280',
  fontSize: '12px',
  lineHeight: '18px',
  margin: '6px 24px',
  textAlign: 'center' as const,
}

const divider = {
  borderColor: '#e5e7eb',
  margin: '20px 0',
}

const footer = {
  padding: '0 24px',
  marginTop: '16px',
}

const footerText = {
  color: '#9ca3af',
  fontSize: '11px',
  lineHeight: '17px',
  textAlign: 'center' as const,
  margin: '6px 0',
}
