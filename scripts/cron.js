const fs = require('fs');
const path = require('path');

async function triggerCron() {
    try {
        const envPath = path.resolve(__dirname, '../.env.local');
        if (!fs.existsSync(envPath)) {
            console.error('[Cron] File .env.local tidak ditemukan!');
            return;
        }

        const envContent = fs.readFileSync(envPath, 'utf8');
        
        let appUrl = '';
        let cronSecret = '';

        envContent.split('\n').forEach(line => {
            const matchUrl = line.match(/^APP_URL=(.*)$/);
            if (matchUrl) appUrl = matchUrl[1].replace(/^"|"$/g, '').trim();
            
            const matchSecret = line.match(/^CRON_SECRET=(.*)$/);
            if (matchSecret) cronSecret = matchSecret[1].replace(/^"|"$/g, '').trim();
        });

        if (!appUrl || !cronSecret) {
            console.error('[Cron] APP_URL atau CRON_SECRET tidak ditemukan di .env.local');
            return;
        }

        const targetUrl = `${appUrl}/api/cron/send-reminders`;
        console.log(`\n[Cron] [${new Date().toLocaleString()}] Mengeksekusi cron job ke: ${targetUrl}`);

        const response = await fetch(targetUrl, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${cronSecret}`
            }
        });

        const data = await response.json();
        console.log('[Cron] Response server:', data);

    } catch (error) {
        console.error('[Cron] Gagal mengeksekusi cron job:', error.message);
    }
}

// Variabel untuk melacak kapan cron terakhir kali dijalankan
// agar tidak tereksekusi dua kali di menit yang sama
let lastRunDate = null;

console.log('====================================================');
console.log('[Cron] Worker berjalan (Tanpa Admin).');
console.log('[Cron] Menunggu pukul 09:00 setiap harinya...');
console.log('====================================================');

// Cek waktu setiap 30 detik
setInterval(() => {
    const now = new Date();
    const currentDate = now.toLocaleDateString();

    // Jalankan hanya jika jam menunjukkan 09:00 dan belum pernah jalan di hari ini
    if (now.getHours() === 9 && now.getMinutes() === 0) {
        if (lastRunDate !== currentDate) {
            lastRunDate = currentDate;
            triggerCron();
        }
    }
}, 30 * 1000);
