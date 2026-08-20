const express=require('express');
const path=require('path');
const crypto=require('crypto');
const bcrypt=require('bcryptjs');
const jwt=require('jsonwebtoken');
const Database=require('better-sqlite3');
const QRCode=require('qrcode');

const app=express();
const PORT=process.env.PORT||3000;
const SECRET=process.env.JWT_SECRET||'CHANGE_THIS_SECRET_BEFORE_PRODUCTION';
const db=new Database(process.env.DB_FILE||'qrforge.db');
db.pragma('journal_mode = WAL');
db.exec(`
CREATE TABLE IF NOT EXISTS users(id INTEGER PRIMARY KEY AUTOINCREMENT,email TEXT UNIQUE NOT NULL,password TEXT NOT NULL,role TEXT DEFAULT 'user',created_at TEXT DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS qrs(id INTEGER PRIMARY KEY AUTOINCREMENT,user_id INTEGER,type TEXT,name TEXT,data TEXT,dynamic_slug TEXT UNIQUE,created_at TEXT DEFAULT CURRENT_TIMESTAMP,last_scan TEXT,total_scans INTEGER DEFAULT 0);
CREATE TABLE IF NOT EXISTS scans(id INTEGER PRIMARY KEY AUTOINCREMENT,qr_id INTEGER,created_at TEXT DEFAULT CURRENT_TIMESTAMP,user_agent TEXT);
CREATE TABLE IF NOT EXISTS posts(id INTEGER PRIMARY KEY AUTOINCREMENT,title TEXT,slug TEXT UNIQUE,body TEXT,created_at TEXT DEFAULT CURRENT_TIMESTAMP);
`);
const adminEmail=process.env.ADMIN_EMAIL||'admin@example.com';
const adminPassword=process.env.ADMIN_PASSWORD||'ChangeMe123!';
if(!db.prepare('SELECT id FROM users WHERE email=?').get(adminEmail)){
  const hash=bcrypt.hashSync(adminPassword,12);
  db.prepare('INSERT INTO users(email,password,role) VALUES(?,?,?)').run(adminEmail,hash,'admin');
}
app.use(express.json({limit:'1mb'}));
app.use(express.static(path.join(__dirname,'public')));
function auth(req,res,next){const h=req.headers.authorization||'';if(!h.startsWith('Bearer '))return res.status(401).json({error:'Login required'});try{req.user=jwt.verify(h.slice(7),SECRET);next()}catch{return res.status(401).json({error:'Invalid session'})}}
function sign(u){return jwt.sign({id:u.id,email:u.email,role:u.role},SECRET,{expiresIn:'7d'})}
app.post('/api/register',(req,res)=>{const {email,password}=req.body||{};if(!email||!password||password.length<8)return res.status(400).json({error:'Email and password (8+ characters) are required'});try{const hash=bcrypt.hashSync(password,12);const r=db.prepare('INSERT INTO users(email,password) VALUES(?,?)').run(email.toLowerCase(),hash);const u=db.prepare('SELECT id,email,role FROM users WHERE id=?').get(r.lastInsertRowid);res.json({token:sign(u),user:u})}catch(e){res.status(400).json({error:'Email is already registered'})}});
app.post('/api/login',(req,res)=>{const {email,password}=req.body||{};const u=db.prepare('SELECT * FROM users WHERE email=?').get((email||'').toLowerCase());if(!u||!bcrypt.compareSync(password||'',u.password))return res.status(401).json({error:'Incorrect email or password'});res.json({token:sign(u),user:{id:u.id,email:u.email,role:u.role}})});
app.get('/api/me',auth,(req,res)=>res.json({user:req.user}));
app.get('/api/qrs',auth,(req,res)=>res.json(db.prepare('SELECT id,type,name,data,dynamic_slug,created_at,last_scan,total_scans FROM qrs WHERE user_id=? ORDER BY id DESC').all(req.user.id)));
app.post('/api/qrs',auth,(req,res)=>{const {type,name,data,dynamic}=req.body||{};if(!data)return res.status(400).json({error:'QR data is required'});const slug=dynamic?crypto.randomBytes(5).toString('hex'):null;const r=db.prepare('INSERT INTO qrs(user_id,type,name,data,dynamic_slug) VALUES(?,?,?,?,?)').run(req.user.id,name||'My QR Code',type||'url',data,slug);res.json(db.prepare('SELECT * FROM qrs WHERE id=?').get(r.lastInsertRowid))});
app.delete('/api/qrs/:id',auth,(req,res)=>{db.prepare('DELETE FROM qrs WHERE id=? AND user_id=?').run(req.params.id,req.user.id);res.json({ok:true})});
app.get('/r/:slug', (req,res)=>{const q=db.prepare('SELECT * FROM qrs WHERE dynamic_slug=?').get(req.params.slug);if(!q)return res.status(404).send('QR code not found');db.prepare('INSERT INTO scans(qr_id,user_agent) VALUES(?,?)').run(q.id,req.headers['user-agent']||'');db.prepare('UPDATE qrs SET total_scans=total_scans+1,last_scan=CURRENT_TIMESTAMP WHERE id=?').run(q.id);let dest=q.data;if(!/^https?:\/\//i.test(dest))dest='https://'+dest;res.redirect(dest)});
app.get('/api/admin/stats',auth,(req,res)=>{if(req.user.role!=='admin')return res.status(403).json({error:'Forbidden'});res.json({users:db.prepare('SELECT COUNT(*) c FROM users').get().c,qrs:db.prepare('SELECT COUNT(*) c FROM qrs').get().c,scans:db.prepare('SELECT COUNT(*) c FROM scans').get().c})});
app.get('/api/posts',(req,res)=>res.json(db.prepare('SELECT id,title,slug,body,created_at FROM posts ORDER BY id DESC').all()));
app.post('/api/posts',auth,(req,res)=>{if(req.user.role!=='admin')return res.status(403).json({error:'Forbidden'});const {title,slug,body}=req.body;const r=db.prepare('INSERT INTO posts(title,slug,body) VALUES(?,?,?)').run(title,slug,body);res.json({id:r.lastInsertRowid})});
app.get('/sitemap.xml',(req,res)=>{res.type('application/xml').send(`<?xml version="1.0"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><url><loc>https://${req.headers.host}/</loc></url></urlset>`)});
app.get('*',(req,res)=>res.sendFile(path.join(__dirname,'public','index.html')));
app.listen(PORT,()=>console.log(`QRForge running at http://localhost:${PORT}`));