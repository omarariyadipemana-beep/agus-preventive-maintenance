const express = require('express');
const { createClient } = require('@supabase/supabase-js');
const ExcelJS = require('exceljs');
require('dotenv').config();

const path = require('path');
const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, '..', 'public')));

// Inisialisasi Supabase Client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY || process.env.SUPABASE_ANON_KEY;

let supabase = null;
if (supabaseUrl && supabaseKey) {
  supabase = createClient(supabaseUrl, supabaseKey);
} else {
  console.warn('PERINGATAN: SUPABASE_URL atau SUPABASE_KEY belum disetel di Environment Variables!');
}

function checkSupabase(res) {
  if (!supabase) {
    res.status(500).json({ error: 'Supabase credentials not configured in environment variables.' });
    return false;
  }
  return true;
}

// ============================================================
// API ROUTES (Serverless on Vercel)
// ============================================================

// Get task templates by machine type
app.get('/api/templates/:machineType', async (req, res) => {
  if (!checkSupabase(res)) return;
  try {
    const { data, error } = await supabase
      .from('task_templates')
      .select('item_no, task_description')
      .eq('machine_type', req.params.machineType)
      .order('item_no', { ascending: true });

    if (error) throw error;
    res.json(data || []);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get available machine types
app.get('/api/machine-types', async (req, res) => {
  if (!checkSupabase(res)) return;
  try {
    const { data, error } = await supabase
      .from('task_templates')
      .select('machine_type');

    if (error) throw error;
    const types = [...new Set((data || []).map(t => t.machine_type))].sort();
    res.json(types);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Generate next form ID
app.get('/api/next-form-id', async (req, res) => {
  if (!checkSupabase(res)) return;
  try {
    const now = new Date();
    const yearMonth = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}`;
    const prefix = `PM-${yearMonth}-`;

    const { data, error } = await supabase
      .from('inspections')
      .select('form_id')
      .like('form_id', `${prefix}%`)
      .order('form_id', { ascending: false })
      .limit(1);

    if (error) throw error;

    let nextNum = 1;
    if (data && data.length > 0) {
      const parts = data[0].form_id.split('-');
      if (parts.length >= 3) {
        nextNum = parseInt(parts[2], 10) + 1;
      }
    }

    res.json({ formId: `${prefix}${String(nextNum).padStart(3, '0')}` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Save inspection
app.post('/api/inspections', async (req, res) => {
  if (!checkSupabase(res)) return;
  const {
    form_id, machine_type, equipment_id, location, mtc_support,
    inspection_date, verification_result, maintenance_support_name,
    group_leader_name, logistic_leader_name, items
  } = req.body;

  try {
    // 1. Insert header
    const { data: inspection, error: insError } = await supabase
      .from('inspections')
      .insert([{
        form_id, machine_type, equipment_id, location, mtc_support,
        inspection_date, verification_result, maintenance_support_name,
        group_leader_name, logistic_leader_name
      }])
      .select('id')
      .single();

    if (insError) throw insError;

    // 2. Insert items
    if (items && items.length > 0) {
      const itemRows = items.map(it => ({
        inspection_id: inspection.id,
        item_no: it.item_no,
        task_description: it.task_description,
        status: it.status,
        remarks: it.remarks || ''
      }));

      const { error: itemsError } = await supabase
        .from('inspection_items')
        .insert(itemRows);

      if (itemsError) throw itemsError;
    }

    res.json({ success: true, id: inspection.id });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// Get all inspections (list with search, filter, pagination)
app.get('/api/inspections', async (req, res) => {
  if (!checkSupabase(res)) return;
  const { search, machine_type, page = 1, limit = 20 } = req.query;
  const p = parseInt(page);
  const l = parseInt(limit);
  const from = (p - 1) * l;
  const to = from + l - 1;

  try {
    let query = supabase
      .from('inspections')
      .select('*', { count: 'exact' });

    if (search) {
      query = query.or(`form_id.ilike.%${search}%,equipment_id.ilike.%${search}%,location.ilike.%${search}%,mtc_support.ilike.%${search}%`);
    }

    if (machine_type) {
      query = query.eq('machine_type', machine_type);
    }

    const { data, count, error } = await query
      .order('created_at', { ascending: false })
      .range(from, to);

    if (error) throw error;

    res.json({ data: data || [], total: count || 0, page: p, limit: l });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get single inspection with items
app.get('/api/inspections/:id', async (req, res) => {
  if (!checkSupabase(res)) return;
  try {
    const { data: inspection, error: insError } = await supabase
      .from('inspections')
      .select('*')
      .eq('id', req.params.id)
      .single();

    if (insError) throw insError;
    if (!inspection) return res.status(404).json({ error: 'Not found' });

    const { data: items, error: itemsError } = await supabase
      .from('inspection_items')
      .select('*')
      .eq('inspection_id', req.params.id)
      .order('item_no', { ascending: true });

    if (itemsError) throw itemsError;

    res.json({ ...inspection, items: items || [] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete inspection
app.delete('/api/inspections/:id', async (req, res) => {
  if (!checkSupabase(res)) return;
  try {
    const { error } = await supabase
      .from('inspections')
      .delete()
      .eq('id', req.params.id);

    if (error) throw error;
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Dashboard stats
app.get('/api/dashboard', async (req, res) => {
  if (!checkSupabase(res)) return;
  try {
    const now = new Date();
    const yearMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const startOfMonth = `${yearMonth}-01`;
    const endOfMonth = `${yearMonth}-31`;

    // 1. Total this month
    const { count: totalThisMonth } = await supabase
      .from('inspections')
      .select('*', { count: 'exact', head: true })
      .gte('inspection_date', startOfMonth)
      .lte('inspection_date', endOfMonth);

    // 2. Verification OK
    const { count: verificationOK } = await supabase
      .from('inspections')
      .select('*', { count: 'exact', head: true })
      .gte('inspection_date', startOfMonth)
      .lte('inspection_date', endOfMonth)
      .eq('verification_result', 'OK');

    // 3. Verification NOK
    const { count: verificationNOK } = await supabase
      .from('inspections')
      .select('*', { count: 'exact', head: true })
      .gte('inspection_date', startOfMonth)
      .lte('inspection_date', endOfMonth)
      .eq('verification_result', 'NOK');

    // 4. Recent inspections
    const { data: recentInspections } = await supabase
      .from('inspections')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5);

    // 5. Item counts this month
    const { data: monthInspections } = await supabase
      .from('inspections')
      .select('id')
      .gte('inspection_date', startOfMonth)
      .lte('inspection_date', endOfMonth);

    let itemOK = 0;
    let itemNOK = 0;
    let totalItems = 0;
    const nokItems = [];

    if (monthInspections && monthInspections.length > 0) {
      const ids = monthInspections.map(i => i.id);
      const { data: items } = await supabase
        .from('inspection_items')
        .select(`
          id,
          inspection_id,
          item_no,
          task_description,
          status,
          remarks,
          inspections (
            form_id,
            machine_type,
            equipment_id,
            location,
            inspection_date
          )
        `)
        .in('inspection_id', ids);

      if (items) {
        totalItems = items.length;
        items.forEach(it => {
          if (it.status === 'OK') {
            itemOK++;
          } else if (it.status === 'NOT OKE') {
            itemNOK++;
            const insp = it.inspections || {};
            nokItems.push({
              item_id: it.id,
              inspection_id: it.inspection_id,
              form_id: insp.form_id || '',
              machine_type: insp.machine_type || '',
              equipment_id: insp.equipment_id || '',
              location: insp.location || '',
              inspection_date: insp.inspection_date || '',
              item_no: it.item_no,
              task_description: it.task_description,
              remarks: it.remarks || ''
            });
          }
        });
      }
    }

    res.json({
      totalThisMonth: totalThisMonth || 0,
      verificationOK: verificationOK || 0,
      verificationNOK: verificationNOK || 0,
      itemOK,
      itemNOK,
      totalItems,
      nokItems,
      recentInspections: recentInspections || [],
      currentMonth: yearMonth
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Export to Excel
app.get('/api/inspections/:id/excel', async (req, res) => {
  if (!checkSupabase(res)) return;
  try {
    const { data: inspection } = await supabase
      .from('inspections')
      .select('*')
      .eq('id', req.params.id)
      .single();

    if (!inspection) return res.status(404).json({ error: 'Not found' });

    const { data: items } = await supabase
      .from('inspection_items')
      .select('*')
      .eq('inspection_id', req.params.id)
      .order('item_no', { ascending: true });

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Preventive Maintenance');

    sheet.mergeCells('A1:E1');
    sheet.getCell('A1').value = 'FORM Preventive Maintenance';
    sheet.getCell('A1').font = { bold: true, size: 14 };
    sheet.getCell('A1').alignment = { horizontal: 'center' };

    sheet.mergeCells('A2:E2');
    sheet.getCell('A2').value = inspection.machine_type;
    sheet.getCell('A2').font = { bold: true, size: 12 };
    sheet.getCell('A2').alignment = { horizontal: 'center' };

    sheet.getCell('E3').value = 'QMS-0039442';
    sheet.getCell('A4').value = 'ID Alat';
    sheet.getCell('B4').value = `: ${inspection.equipment_id}`;
    sheet.getCell('A5').value = 'Lokasi';
    sheet.getCell('B5').value = `: ${inspection.location}`;
    sheet.getCell('A6').value = 'Mtc Support';
    sheet.getCell('B6').value = `: ${inspection.mtc_support}`;
    sheet.getCell('A7').value = 'Tanggal';
    sheet.getCell('B7').value = `: ${inspection.inspection_date}`;
    sheet.getCell('D4').value = `Form ID: ${inspection.form_id}`;

    const headerRow = 9;
    sheet.getCell(`A${headerRow}`).value = 'No';
    sheet.getCell(`B${headerRow}`).value = 'Task List';
    sheet.getCell(`D${headerRow}`).value = 'STATUS (OK/NOT OKE)';
    sheet.getCell(`E${headerRow}`).value = 'KETERANGAN';
    sheet.mergeCells(`B${headerRow}:C${headerRow}`);

    const headerStyle = {
      font: { bold: true },
      fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE2E8F0' } },
      border: { top: { style: 'thin' }, bottom: { style: 'thin' }, left: { style: 'thin' }, right: { style: 'thin' } }
    };
    ['A', 'B', 'D', 'E'].forEach(col => {
      const cell = sheet.getCell(`${col}${headerRow}`);
      cell.font = headerStyle.font;
      cell.fill = headerStyle.fill;
      cell.border = headerStyle.border;
    });

    (items || []).forEach((item, i) => {
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

    const vRow = headerRow + 1 + (items ? items.length : 0) + 1;
    sheet.getCell(`A${vRow}`).value = `Hasil Verifikasi : ${inspection.verification_result} (dilakukan oleh Group Leader / LPU)`;
    sheet.mergeCells(`A${vRow}:E${vRow}`);
    sheet.getCell(`A${vRow}`).font = { bold: true };

    const sRow = vRow + 2;
    sheet.getCell(`A${sRow}`).value = 'Maintenance Support';
    sheet.getCell(`C${sRow}`).value = 'Group Leader/LPU';
    sheet.getCell(`E${sRow}`).value = 'Logistik Leader';
    sheet.getCell(`A${sRow + 2}`).value = inspection.maintenance_support_name;
    sheet.getCell(`C${sRow + 2}`).value = inspection.group_leader_name;
    sheet.getCell(`E${sRow + 2}`).value = inspection.logistic_leader_name;

    sheet.getColumn('A').width = 5;
    sheet.getColumn('B').width = 30;
    sheet.getColumn('C').width = 25;
    sheet.getColumn('D').width = 20;
    sheet.getColumn('E').width = 20;

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=PM_${inspection.form_id}.xlsx`);

    await workbook.xlsx.write(res);
    res.end();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Serve frontend SPA fallback for all non-matching routes
app.use((req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
});

// Export handler for Vercel Serverless
module.exports = app;
