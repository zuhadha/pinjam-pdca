import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Section,
  Text,
} from '@react-email/components'

export interface RoomEmailDate {
  label: string // 'Senin, 16 November 2026'
  time: string // '09:00–11:00'
  status: 'confirmed' | 'waitlisted' | 'cancelled'
}

export interface RoomBookingEmailProps {
  preview: string
  heading: string
  paragraphs: string[]
  details: { label: string; value: string }[]
  dates: RoomEmailDate[]
  buttonLabel?: string
  buttonUrl?: string
  footnote?: string
}

const STATUS_TEXT: Record<RoomEmailDate['status'], string> = {
  confirmed: 'Terkonfirmasi',
  waitlisted: 'Daftar tunggu',
  cancelled: 'Dibatalkan',
}

const STATUS_COLOR: Record<RoomEmailDate['status'], string> = {
  confirmed: '#1d4ed8',
  waitlisted: '#92400e',
  cancelled: '#6b7280',
}

const MAX_DATES_SHOWN = 30

export function RoomBookingEmail({
  preview,
  heading,
  paragraphs,
  details,
  dates,
  buttonLabel,
  buttonUrl,
  footnote,
}: RoomBookingEmailProps) {
  const shown = dates.slice(0, MAX_DATES_SHOWN)
  const hidden = dates.length - shown.length

  return (
    <Html>
      <Head />
      <Preview>{preview}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={header}>
            <Text style={brand}>INVENSA · Ruangan</Text>
            <Heading style={h1}>{heading}</Heading>
          </Section>

          <Section style={section}>
            {paragraphs.map((p, i) => (
              <Text key={i} style={text}>
                {p}
              </Text>
            ))}
          </Section>

          <Section style={section}>
            {details.map((d) => (
              <Text key={d.label} style={detailRow}>
                <span style={detailLabel}>{d.label}</span>
                <br />
                {d.value}
              </Text>
            ))}
          </Section>

          {shown.length > 0 && (
            <Section style={section}>
              <Text style={detailLabel}>Tanggal</Text>
              {shown.map((d, i) => (
                <Text key={i} style={dateRow}>
                  {d.label}, {d.time} —{' '}
                  <span style={{ color: STATUS_COLOR[d.status], fontWeight: 600 }}>{STATUS_TEXT[d.status]}</span>
                </Text>
              ))}
              {hidden > 0 && <Text style={dateRow}>dan {hidden} tanggal lainnya</Text>}
            </Section>
          )}

          {buttonLabel && buttonUrl && (
            <Section style={buttonWrap}>
              <Button style={button} href={buttonUrl}>
                {buttonLabel}
              </Button>
            </Section>
          )}

          <Section style={section}>
            <Hr style={rule} />
            {footnote && <Text style={small}>{footnote}</Text>}
            <Text style={small}>Email ini dikirim otomatis oleh sistem INVENSA.</Text>
          </Section>
        </Container>
      </Body>
    </Html>
  )
}

export default RoomBookingEmail

const main = {
  backgroundColor: '#f2f4f7',
  fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
}
const container = { backgroundColor: '#ffffff', margin: '0 auto', maxWidth: '580px', width: '100%', paddingBottom: '32px' }
const header = { padding: '28px 24px 8px' }
const brand = { margin: 0, fontSize: '13px', color: '#6b7280' }
const h1 = { margin: '8px 0 0', fontSize: '22px', lineHeight: '28px', color: '#111827', fontWeight: 600 }
const section = { padding: '0 24px' }
const text = { fontSize: '15px', lineHeight: '24px', color: '#111827', margin: '12px 0' }
const detailRow = { fontSize: '15px', lineHeight: '22px', color: '#111827', margin: '0 0 12px' }
const detailLabel = { fontSize: '13px', color: '#6b7280' }
const dateRow = { fontSize: '14px', lineHeight: '22px', color: '#111827', margin: '2px 0' }
const buttonWrap = { padding: '20px 24px 8px' }
const button = {
  backgroundColor: '#111827',
  color: '#ffffff',
  borderRadius: '6px',
  fontSize: '15px',
  fontWeight: 600,
  padding: '12px 20px',
  textDecoration: 'none',
}
const rule = { borderColor: '#e5e7eb', margin: '24px 0 12px' }
const small = { fontSize: '13px', lineHeight: '20px', color: '#6b7280', margin: '4px 0' }
