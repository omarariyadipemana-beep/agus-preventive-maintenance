const express = require('express');
const path = require('path');
const Database = require('better-sqlite3');
const ExcelJS = require('exceljs');

const app = express();
const PORT = 3001;

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Database setup
const db = new Database(path.join(__dirname, 'database.sqlite'));
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// ============================================================
// DATABASE INITIALIZATION
// ============================================================
function initDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS inspections (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      form_id TEXT UNIQUE NOT NULL,
      machine_type TEXT NOT NULL,
      equipment_id TEXT NOT NULL,
      location TEXT NOT NULL,
      mtc_support TEXT NOT NULL,
      inspection_date TEXT NOT NULL,
      verification_result TEXT DEFAULT '',
      maintenance_support_name TEXT DEFAULT '',
      group_leader_name TEXT DEFAULT '',
      logistic_leader_name TEXT DEFAULT '',
      created_at TEXT DEFAULT (datetime('now','localtime'))
    );

    CREATE TABLE IF NOT EXISTS inspection_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      inspection_id INTEGER NOT NULL,
      item_no INTEGER NOT NULL,
      task_description TEXT NOT NULL,
      status TEXT DEFAULT '',
      remarks TEXT DEFAULT '',
      FOREIGN KEY (inspection_id) REFERENCES inspections(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS task_templates (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      machine_type TEXT NOT NULL,
      item_no INTEGER NOT NULL,
      task_description TEXT NOT NULL
    );
  `);

  // Seed GTP-GIGA task templates if not exists
  const count = db.prepare('SELECT COUNT(*) as cnt FROM task_templates WHERE machine_type = ?').get('GTP-GIGA');
  if (count.cnt === 0) {
    const insert = db.prepare('INSERT INTO task_templates (machine_type, item_no, task_description) VALUES (?, ?, ?)');
    const tasks = [
      [1, 'Cleaning : Area meja dan peralatan dari material produksi'],
      [2, 'Cleaning / Ganti : Spring no. 4 GTP Jika sudah kendor'],
      [3, 'Cleaning & Inspeksi : Cakram atas dan bawah berfungsi dengan normal (Knop & Clam)'],
      [4, 'Cleaning, Inspeksi & Lubrikasi : Bongkar Stang GTP, periksa Bearing Loop (Roller Shaft) tidak berkarat dan masih berfungsi normal'],
      [5, 'Cleaning, Inspeksi & Lubrikasi : Periksa Bearing Stang, pastikan tidak berkarat dan masih berfungsi normal'],
      [6, 'Inspeksi : Pasang kembali Stang GTP dan cek kelurusan menggunakan jig'],
      [7, 'Cleaning & Inspeksi : Stopper atas dan bawah masih menahan Stang GTP dengan baik'],
      [8, 'Cleaning & Inspeksi : Cek posisi adjuster, rod locking (Giga) sesuai mal MPV dan tidak kendor'],
      [9, 'Cleaning & Inspeksi : Bongkar Batokan dan Shim kemudian setting clearence (Batokan terhadap Loop di clicker ke 2)'],
      [10, 'Cleaning : Bersihkan bagian-bagian GTP yang kotor dari deposit debu tembakau'],
      [11, 'Cleaning / Ganti : Cek Spring GIGA No. 1, No. 2 dan No. 3, ganti Jika spring sudah kendor'],
      [12, 'Cleaning, Inspeksi & Lubrikasi : Periksa Vertical Shaft & Seal Linier Bearing'],
      [13, 'Inspeksi / Ganti : Cek kondisi klicker Bracket & Glue Pot'],
      [14, 'Cleaning : Area Support Vertical Shaft dan Cover Acrilic'],
      [15, 'Cleaning : Area bawah Plate ambri dari agal dan pastikan masing lurus / rata'],
      [16, 'Inspeksi : Cek kelurusan Pin depan, kanan, kiri dan belakang'],
      [17, 'Inspeksi : Gap Glue pot terhadap Pin & Kerataan antar Glue pot kanan & kiri (rata bawah & rata depan)'],
      [18, 'Cleaning / Ganti : Sling tidak berserabut dan cover tidak aus, retak / sobek'],
      [19, 'Cleaning : Bersihkan bagian-bagian Giga yang kotor dari deposit debu tembakau'],
    ];

    const insertMany = db.transaction((tasks) => {
      for (const [no, desc] of tasks) {
        insert.run('GTP-GIGA', no, desc);
      }
    });
    insertMany(tasks);
  }

  // Seed PC / PCA task templates
  const countPCA = db.prepare('SELECT COUNT(*) as cnt FROM task_templates WHERE machine_type = ?').get('PC / PCA');
  if (countPCA.cnt === 0) {
    const insert = db.prepare('INSERT INTO task_templates (machine_type, item_no, task_description) VALUES (?, ?, ?)');
    const tasksPCA = [
      [1, 'Cleaning : Area meja dan peralatan dari material produksi'],
      [2, 'Cleaning : Lepas pisau, periksa rumah pisau dan baut pengunci'],
      [3, 'Cleaning & Inspeksi : Pastikan Cover & Safety guard menutupi area pisau dengan baik'],
      [4, 'Cleaning / Ganti & Inspeksi : Lepas Cigaret Holder periksa panjang holder dan kerataannya'],
      [5, 'Cleaning / Ganti & Inspeksi : Periksa Pelatuk, Spring, Penekan berfungsi dengan baik'],
      [6, 'Cleaning / Ganti & Inspeksi : Periksa gerakan Arm/talang rokok, stopper arm, spring torsi dan bearing'],
      [7, 'Setting : Pasang kembali pisau dan setting clearence pisau'],
      [8, 'Cleaning / Ganti, Inspeksi, Lubrikasi : Camp Follower penggerak handle, rail kuningan & stopper handle. Posisi stopper handle sesuai dengan posisi berhentinya Arm. (PCA)'],
      [9, 'Cleaning / Ganti : Plastik pengarah sigaret'],
      [10, 'Cleaning / Ganti : Stopper samping'],
      [11, 'Cleaning : Bersihkan bagian-bagian PC/PCA yang kotor dari deposit debu tembakau'],
    ];

    const insertManyPCA = db.transaction((tasks) => {
      for (const [no, desc] of tasks) {
        insert.run('PC / PCA', no, desc);
      }
    });
    insertManyPCA(tasksPCA);
  }

  // Seed AIPS task templates
  const countAIPS = db.prepare('SELECT COUNT(*) as cnt FROM task_templates WHERE machine_type = ?').get('AIPS');
  if (countAIPS.cnt === 0) {
    const insert = db.prepare('INSERT INTO task_templates (machine_type, item_no, task_description) VALUES (?, ?, ?)');
    const tasksAIPS = [
      [1, 'Cleaning : Area meja dan peralatan dari material produksi'],
      [2, 'Cleaning : Buka Cover Gear, perika keausan gigi gear'],
      [3, 'Cleaning / Ganti, Inspeksi : Periksa tension spring dan posisi stoper handle'],
      [4, 'Cleaning / Ganti, Inspeksi : Lepas Head Attachment periksa kondisi Plate ring lock, buka Head Attachment dan periksa Insert, Spring, Pusher kemudian pasang kembali'],
      [5, 'Cleaning / Ganti & Inspeksi : Periksa fungsi komponen Break Attachment, Extention flip plate & Bantalan stopper'],
      [6, 'Cleaning & Inspeksi : Periksa kelurusan Cigarette holder dengan lubang Head Attacment dan posisi Stopper plate'],
      [7, 'Cleaning : Lepas Unit Hopper, buka segitiga rokok, papan seluncur, bersihkan dari sisa deposit tembakau'],
      [8, 'Cleaning : Bersihkan bagian dalam Auto Insert dari sisa tembakau'],
      [9, 'Cleaning, Inspeksi, Lubrikasi : Periksa shaft & linier bearing dari pendorong sigaret serta penyentil, bearing rod'],
      [10, 'Cleaning / Ganti, Inspeksi : Penyentil, vibrator dan bola vibrator'],
      [11, 'Inspeksi : Pasang kembali unit hopper, periksa tuas emergency, cover akrilik dan gerakan pendorong sigaret'],
      [12, 'Cleaning & Inspeksi : Bersihkan unit blower, cek kondisi kabel listrik dan sesuaikan arah semburan'],
      [13, 'Cleaning : Bersihkan bagian-bagian yang kotor dari deposit debu tembakau'],
    ];

    const insertManyAIPS = db.transaction((tasks) => {
      for (const [no, desc] of tasks) {
        insert.run('AIPS', no, desc);
      }
    });
    insertManyAIPS(tasksAIPS);
  }

  // Seed Heater DC task templates
  const countHeater = db.prepare('SELECT COUNT(*) as cnt FROM task_templates WHERE machine_type = ?').get('Heater DC');
  if (countHeater.cnt === 0) {
    const insert = db.prepare('INSERT INTO task_templates (machine_type, item_no, task_description) VALUES (?, ?, ?)');
    const tasksHeater = [
      [1, 'Cleaning : Area meja dan peralatan dari material produksi'],
      [2, 'Inspeksi : Matikan unit heater, cabut kabel dari sumber arus listrik'],
      [3, 'Cleaning & Inspeksi : Buka cover display, bersihkan dari debu dan periksa kondisi sambungan kabel serta sekering'],
      [4, 'Cleaning / Ganti : Periksa kondisi permukaan alumunium blok (kebersihan dan kerataan)'],
      [5, 'Cleaning / Ganti : Periksa kondisi permukaan novotec isolator'],
      [6, 'Inspeksi : Hidupkan kembali heater, periksa hasil pembacaan display'],
      [7, 'Cleaning : Bersihkan bagian-bagian yang kotor dari debu'],
    ];

    const insertManyHeater = db.transaction((tasks) => {
      for (const [no, desc] of tasks) {
        insert.run('Heater DC', no, desc);
      }
    });
    insertManyHeater(tasksHeater);
  }
}

initDatabase();

// ============================================================
// API ROUTES
// ============================================================

// Get task templates by machine type
app.get('/api/templates/:machineType', (req, res) => {
  const tasks = db.prepare('SELECT item_no, task_description FROM task_templates WHERE machine_type = ? ORDER BY item_no').all(req.params.machineType);
  res.json(tasks);
});

// Get available machine types
app.get('/api/machine-types', (req, res) => {
  const types = db.prepare('SELECT DISTINCT machine_type FROM task_templates ORDER BY machine_type').all();
  res.json(types.map(t => t.machine_type));
});

// Generate next form ID
app.get('/api/next-form-id', (req, res) => {
  const now = new Date();
  const yearMonth = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}`;
  const prefix = `PM-${yearMonth}-`;
  
  const row = db.prepare(`
    SELECT form_id FROM inspections 
    WHERE form_id LIKE ? 
    ORDER BY form_id DESC 
    LIMIT 1
  `).get(`${prefix}%`);

  let nextNum = 1;
  if (row) {
    const lastNum = parseInt(row.form_id.split('-')[2], 10);
    nextNum = lastNum + 1;
  }

  res.json({ formId: `${prefix}${String(nextNum).padStart(3, '0')}` });
});

// Save inspection
app.post('/api/inspections', (req, res) => {
  const { form_id, machine_type, equipment_id, location, mtc_support, inspection_date, verification_result, maintenance_support_name, group_leader_name, logistic_leader_name, items } = req.body;

  try {
    const insertInspection = db.prepare(`
      INSERT INTO inspections (form_id, machine_type, equipment_id, location, mtc_support, inspection_date, verification_result, maintenance_support_name, group_leader_name, logistic_leader_name)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const insertItem = db.prepare(`
      INSERT INTO inspection_items (inspection_id, item_no, task_description, status, remarks)
      VALUES (?, ?, ?, ?, ?)
    `);

    const saveAll = db.transaction(() => {
      const info = insertInspection.run(form_id, machine_type, equipment_id, location, mtc_support, inspection_date, verification_result, maintenance_support_name, group_leader_name, logistic_leader_name);
      const inspectionId = info.lastInsertRowid;

      for (const item of items) {
        insertItem.run(inspectionId, item.item_no, item.task_description, item.status, item.remarks || '');
      }

      return inspectionId;
    });

    const id = saveAll();
    res.json({ success: true, id });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// Get all inspections (list)
app.get('/api/inspections', (req, res) => {
  const { search, machine_type, page = 1, limit = 20 } = req.query;
  const offset = (parseInt(page) - 1) * parseInt(limit);

  let where = '1=1';
  const params = [];

  if (search) {
    where += ' AND (form_id LIKE ? OR equipment_id LIKE ? OR location LIKE ? OR mtc_support LIKE ?)';
    const s = `%${search}%`;
    params.push(s, s, s, s);
  }
  if (machine_type) {
    where += ' AND machine_type = ?';
    params.push(machine_type);
  }

  const total = db.prepare(`SELECT COUNT(*) as cnt FROM inspections WHERE ${where}`).get(...params).cnt;
  const rows = db.prepare(`SELECT * FROM inspections WHERE ${where} ORDER BY created_at DESC LIMIT ? OFFSET ?`).all(...params, parseInt(limit), offset);

  res.json({ data: rows, total, page: parseInt(page), limit: parseInt(limit) });
});

// Get single inspection with items
app.get('/api/inspections/:id', (req, res) => {
  const inspection = db.prepare('SELECT * FROM inspections WHERE id = ?').get(req.params.id);
  if (!inspection) return res.status(404).json({ error: 'Not found' });

  const items = db.prepare('SELECT * FROM inspection_items WHERE inspection_id = ? ORDER BY item_no').all(req.params.id);
  res.json({ ...inspection, items });
});

// Delete inspection
app.delete('/api/inspections/:id', (req, res) => {
  const info = db.prepare('DELETE FROM inspections WHERE id = ?').run(req.params.id);
  res.json({ success: info.changes > 0 });
});

// Dashboard stats
app.get('/api/dashboard', (req, res) => {
  const now = new Date();
  const yearMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

  const totalThisMonth = db.prepare(`SELECT COUNT(*) as cnt FROM inspections WHERE inspection_date LIKE ?`).get(`${yearMonth}%`).cnt;

  const verificationOK = db.prepare(`SELECT COUNT(*) as cnt FROM inspections WHERE inspection_date LIKE ? AND verification_result = 'OK'`).get(`${yearMonth}%`).cnt;

  const verificationNOK = db.prepare(`SELECT COUNT(*) as cnt FROM inspections WHERE inspection_date LIKE ? AND verification_result = 'NOK'`).get(`${yearMonth}%`).cnt;

  // Item-level status counts this month
  const itemStats = db.prepare(`
    SELECT 
      SUM(CASE WHEN ii.status = 'OK' THEN 1 ELSE 0 END) as ok_count,
      SUM(CASE WHEN ii.status = 'NOT OKE' THEN 1 ELSE 0 END) as nok_count,
      COUNT(*) as total_items
    FROM inspection_items ii
    JOIN inspections i ON ii.inspection_id = i.id
    WHERE i.inspection_date LIKE ?
  `).get(`${yearMonth}%`);

  const recentInspections = db.prepare(`SELECT * FROM inspections ORDER BY created_at DESC LIMIT 5`).all();

  res.json({
    totalThisMonth,
    verificationOK,
    verificationNOK,
    itemOK: itemStats.ok_count || 0,
    itemNOK: itemStats.nok_count || 0,
    totalItems: itemStats.total_items || 0,
    recentInspections,
    currentMonth: yearMonth
  });
});

// Export to Excel
app.get('/api/inspections/:id/excel', async (req, res) => {
  const inspection = db.prepare('SELECT * FROM inspections WHERE id = ?').get(req.params.id);
  if (!inspection) return res.status(404).json({ error: 'Not found' });

  const items = db.prepare('SELECT * FROM inspection_items WHERE inspection_id = ? ORDER BY item_no').all(req.params.id);

  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('Preventive Maintenance');

  // Title
  sheet.mergeCells('A1:E1');
  sheet.getCell('A1').value = 'FORM Preventive Maintenance';
  sheet.getCell('A1').font = { bold: true, size: 14 };
  sheet.getCell('A1').alignment = { horizontal: 'center' };

  sheet.mergeCells('A2:E2');
  sheet.getCell('A2').value = inspection.machine_type;
  sheet.getCell('A2').font = { bold: true, size: 12 };
  sheet.getCell('A2').alignment = { horizontal: 'center' };

  // QMS number
  sheet.getCell('E3').value = 'QMS-0039442';

  // Header info
  sheet.getCell('A4').value = 'ID Alat';
  sheet.getCell('B4').value = `: ${inspection.equipment_id}`;
  sheet.getCell('A5').value = 'Lokasi';
  sheet.getCell('B5').value = `: ${inspection.location}`;
  sheet.getCell('A6').value = 'Mtc Support';
  sheet.getCell('B6').value = `: ${inspection.mtc_support}`;
  sheet.getCell('A7').value = 'Tanggal';
  sheet.getCell('B7').value = `: ${inspection.inspection_date}`;
  sheet.getCell('D4').value = `Form ID: ${inspection.form_id}`;

  // Table header
  const headerRow = 9;
  sheet.getCell(`A${headerRow}`).value = 'No';
  sheet.getCell(`B${headerRow}`).value = 'Task List';
  sheet.getCell(`D${headerRow}`).value = 'STATUS (OK/NOT OKE)';
  sheet.getCell(`E${headerRow}`).value = 'KETERANGAN';
  sheet.mergeCells(`B${headerRow}:C${headerRow}`);

  const headerStyle = { font: { bold: true }, fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE2E8F0' } }, border: { top: { style: 'thin' }, bottom: { style: 'thin' }, left: { style: 'thin' }, right: { style: 'thin' } } };
  ['A', 'B', 'D', 'E'].forEach(col => {
    const cell = sheet.getCell(`${col}${headerRow}`);
    cell.font = headerStyle.font;
    cell.fill = headerStyle.fill;
    cell.border = headerStyle.border;
  });

  // Task items
  items.forEach((item, i) => {
    const row = headerRow + 1 + i;
    sheet.getCell(`A${row}`).value = item.item_no;
    sheet.getCell(`B${row}`).value = item.task_description;
    sheet.mergeCells(`B${row}:C${row}`);
    sheet.getCell(`D${row}`).value = item.status;
    sheet.getCell(`E${row}`).value = item.remarks;
    
    ['A', 'B', 'D', 'E'].forEach(col => {
      sheet.getCell(`${col}${row}`).border = { top: { style: 'thin' }, bottom: { style: 'thin' }, left: { style: 'thin' }, right: { style: 'thin' } };
    });
  });

  // Verification result
  const vRow = headerRow + 1 + items.length + 1;
  sheet.getCell(`A${vRow}`).value = `Hasil Verifikasi : ${inspection.verification_result} (dilakukan oleh Group Leader / LPU)`;
  sheet.mergeCells(`A${vRow}:E${vRow}`);
  sheet.getCell(`A${vRow}`).font = { bold: true };

  // Signatures
  const sRow = vRow + 2;
  sheet.getCell(`A${sRow}`).value = 'Maintenance Support';
  sheet.getCell(`C${sRow}`).value = 'Group Leader/LPU';
  sheet.getCell(`E${sRow}`).value = 'Logistik Leader';
  sheet.getCell(`A${sRow + 2}`).value = inspection.maintenance_support_name;
  sheet.getCell(`C${sRow + 2}`).value = inspection.group_leader_name;
  sheet.getCell(`E${sRow + 2}`).value = inspection.logistic_leader_name;

  // Column widths
  sheet.getColumn('A').width = 5;
  sheet.getColumn('B').width = 30;
  sheet.getColumn('C').width = 25;
  sheet.getColumn('D').width = 20;
  sheet.getColumn('E').width = 20;

  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', `attachment; filename=PM_${inspection.form_id}.xlsx`);

  await workbook.xlsx.write(res);
  res.end();
});

// ============================================================
// START SERVER
// ============================================================
app.listen(PORT, '0.0.0.0', () => {
  const os = require('os');
  const interfaces = os.networkInterfaces();
  let lanIP = 'localhost';
  for (const name in interfaces) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        lanIP = iface.address;
        break;
      }
    }
  }
  console.log(`\n=============================================`);
  console.log(`  Preventive Maintenance App`);
  console.log(`  Local:   http://localhost:${PORT}`);
  console.log(`  LAN:     http://${lanIP}:${PORT}`);
  console.log(`=============================================\n`);
});
