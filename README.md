# QRForge — Complete QR Platform Starter

## Included
- Professional responsive UI
- Static QR generator
- URL, text, Wi-Fi, email, phone, SMS, vCard, WhatsApp and location QR types
- PNG/SVG downloads and printing
- QR customization
- Local account registration/login
- Saved QR codes
- Dynamic QR redirect records
- Basic scan analytics
- Admin dashboard
- Blog/FAQ/legal pages
- Advertisement slots
- SEO metadata, sitemap and robots.txt
- SQLite database
- Password hashing and JWT authentication

## Run locally
1. Install Node.js 18+.
2. Open a terminal in this folder.
3. Run `npm install`
4. Run `npm start`
5. Open http://localhost:3000

## Production
Set environment variables:
- JWT_SECRET=replace-with-a-long-random-secret
- ADMIN_EMAIL=your-admin-email
- ADMIN_PASSWORD=your-admin-password

Then put the app behind HTTPS and a reverse proxy.

## Advertising
Replace the ad-slot placeholders with your approved ad network code. Do not place ads before complying with the network's policies and site/privacy requirements.

## Important
This is a production-oriented starter, not a hosted service. You still need hosting, a real domain, HTTPS, email delivery for password recovery/verification, and your own ad-network credentials. Dynamic QR destinations work through the included backend once deployed.
