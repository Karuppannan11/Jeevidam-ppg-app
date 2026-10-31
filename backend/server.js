// server.js — Complete backend for PPG-FPO Management System

const express = require('express');
const mysql   = require('mysql2/promise');
const cors    = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// ── DB Pool ───────────────────────────────────────────────────
const db = mysql.createPool({
  host:     process.env.DB_HOST     || 'localhost',
  user:     process.env.DB_USER     || 'root',
  password: process.env.DB_PASSWORD || 'Harihara11!',
  database: process.env.DB_NAME     || 'ppgfpo',
  waitForConnections: true,
  connectionLimit: 10,
});


// ─── DASHBOARD ANALYTICS APIs ──────────────────────────────────

// 📊 Get all dashboard statistics in one call
app.get('/api/dashboard/stats', async (req, res) => {
  try {
    // Get counts from all major tables
    const [
      [ppgCount],
      [fpoCount],
      [memberCount],
      [meetingCount],
      [ppgMemberCount],
      [ppgNameCount],
      [productCount],
      [demandCount],
      [recentMeetings],
      [ppgByCluster]
    ] = await Promise.all([
      db.query('SELECT COUNT(*) as count FROM ppg_master'),
      db.query('SELECT COUNT(*) as count FROM fpo_master'),
      db.query('SELECT COUNT(*) as count FROM members'),
      db.query('SELECT COUNT(*) as count FROM ppg_meetings'),
      db.query('SELECT COUNT(*) as count FROM ppg_members'),
      db.query('SELECT COUNT(*) as count FROM ppgname_tables'),
      db.query('SELECT COUNT(*) as count FROM products'),
      db.query('SELECT COUNT(*) as count FROM meeting_member_demands'),
      db.query(`
        SELECT 
          pm.id, 
          pm.ppg_name, 
          pm.meeting_date, 
          DATE_FORMAT(pm.meeting_date, '%Y-%m-%d') as formatted_date,
          (SELECT COUNT(*) FROM ppg_meeting_participants WHERE meeting_id = pm.id) as participant_count,
          (SELECT COUNT(*) FROM meeting_member_demands WHERE meeting_id = pm.id) as demand_count
        FROM ppg_meetings pm
        ORDER BY pm.meeting_date DESC, pm.created_at DESC 
        LIMIT 5
      `),
      db.query(`
        SELECT 
          c.cluster_cname,
          COUNT(DISTINCT pm.id) as ppg_count,
          (SELECT COUNT(*) FROM ppg_members pmem WHERE pmem.cluster_ccode = c.cluster_ccode) as member_count
        FROM cluster c
        LEFT JOIN ppg_master pm ON pm.cluster_ccode = c.cluster_ccode
        GROUP BY c.cluster_ccode, c.cluster_cname
        ORDER BY ppg_count DESC
        LIMIT 10
      `)
    ]);

    // Get monthly meeting trends
    const [monthlyTrends] = await db.query(`
      SELECT 
        DATE_FORMAT(meeting_date, '%Y-%m') as month,
        COUNT(*) as meeting_count,
        SUM((SELECT COUNT(*) FROM ppg_meeting_participants WHERE meeting_id = ppg_meetings.id)) as total_participants,
        SUM((SELECT COUNT(*) FROM meeting_member_demands WHERE meeting_id = ppg_meetings.id)) as total_demands
      FROM ppg_meetings 
      WHERE meeting_date >= DATE_SUB(NOW(), INTERVAL 12 MONTH)
      GROUP BY DATE_FORMAT(meeting_date, '%Y-%m')
      ORDER BY month DESC
      LIMIT 12
    `);

    // Get top performing PPGs by meeting count and demand value
    const [topPPGs] = await db.query(`
      SELECT 
        pm.id,
        pm.ppg_code,
        pm.ppg_name,
        COUNT(DISTINCT pmeet.id) as meeting_count,
        COUNT(DISTINCT ppart.id) as participant_count,
        COALESCE(SUM(dem.total), 0) as total_demand_value
      FROM ppg_master pm
      LEFT JOIN ppg_meetings pmeet ON pmeet.ppg_id = pm.id
      LEFT JOIN ppg_meeting_participants ppart ON pmeet.id = ppart.meeting_id
      LEFT JOIN meeting_member_demands dem ON pmeet.id = dem.meeting_id
      GROUP BY pm.id, pm.ppg_code, pm.ppg_name
      ORDER BY meeting_count DESC, total_demand_value DESC
      LIMIT 10
    `);

    // Get recent PPGs created
    const [recentPPGs] = await db.query(`
      SELECT id, ppg_code, ppg_name, cluster_cname, created_at,
             DATE_FORMAT(created_at, '%Y-%m-%d') as formatted_date
      FROM ppg_master
      ORDER BY created_at DESC
      LIMIT 5
    `);

    // Get location distribution
    const [locationDistribution] = await db.query(`
      SELECT 
        s.state_sname,
        COUNT(DISTINCT pm.id) as ppg_count,
        COUNT(DISTINCT pmeet.id) as meeting_count
      FROM state s
      LEFT JOIN ppg_master pm ON pm.state_scode = s.state_scode
      LEFT JOIN ppg_meetings pmeet ON pmeet.ppg_id = pm.id
      WHERE pm.id IS NOT NULL
      GROUP BY s.state_scode, s.state_sname
      ORDER BY ppg_count DESC
    `);

    // Get total demand value
    const [totalDemandValue] = await db.query(`
      SELECT COALESCE(SUM(total), 0) as total_value 
      FROM meeting_member_demands
    `);

    res.status(200).json({
      success: true,
      data: {
        counts: {
          total_ppgs: ppgCount[0]?.count || 0,
          total_fpos: fpoCount[0]?.count || 0,
          total_members: memberCount[0]?.count || 0,
          total_meetings: meetingCount[0]?.count || 0,
          total_ppg_members: ppgMemberCount[0]?.count || 0,
          total_ppg_names: ppgNameCount[0]?.count || 0,
          total_products: productCount[0]?.count || 0,
          total_demands: demandCount[0]?.count || 0,
          total_demand_value: totalDemandValue[0]?.total_value || 0
        },
        recent: {
          meetings: recentMeetings || [],
          ppgs: recentPPGs || []
        },
        trends: {
          monthly: monthlyTrends || []
        },
        distribution: {
          by_cluster: ppgByCluster || [],
          by_state: locationDistribution || []
        },
        top: {
          ppgs: topPPGs || []
        }
      }
    });
  } catch (err) {
    console.error('Dashboard stats error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// 📊 Get quick stats only (lighter version)
app.get('/api/dashboard/quick-stats', async (req, res) => {
  try {
    const [
      [ppgCount],
      [meetingCount],
      [demandCount],
      [memberCount],
      [todayMeetings],
      [totalDemandValue]
    ] = await Promise.all([
      db.query('SELECT COUNT(*) as count FROM ppg_master'),
      db.query('SELECT COUNT(*) as count FROM ppg_meetings'),
      db.query('SELECT COUNT(*) as count FROM meeting_member_demands'),
      db.query('SELECT COUNT(*) as count FROM members'),
      db.query(`
        SELECT COUNT(*) as count 
        FROM ppg_meetings 
        WHERE DATE(meeting_date) = CURDATE()
      `),
      db.query(`SELECT COALESCE(SUM(total), 0) as total_value FROM meeting_member_demands`)
    ]);

    res.status(200).json({
      success: true,
      data: {
        total_ppgs: ppgCount[0]?.count || 0,
        total_meetings: meetingCount[0]?.count || 0,
        total_demands: demandCount[0]?.count || 0,
        total_members: memberCount[0]?.count || 0,
        today_meetings: todayMeetings[0]?.count || 0,
        total_demand_value: totalDemandValue[0]?.total_value || 0
      }
    });
  } catch (err) {
    console.error('Quick stats error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// 📊 Get meeting analytics
app.get('/api/dashboard/meeting-analytics', async (req, res) => {
  try {
    const [meetingStats] = await db.query(`
      SELECT 
        COUNT(*) as total_meetings,
        AVG((SELECT COUNT(*) FROM ppg_meeting_participants WHERE meeting_id = ppg_meetings.id)) as avg_participants,
        AVG((SELECT COUNT(*) FROM meeting_member_demands WHERE meeting_id = ppg_meetings.id)) as avg_demands,
        MAX(meeting_date) as last_meeting_date,
        MIN(meeting_date) as first_meeting_date
      FROM ppg_meetings
    `);

    const [meetingsByMonth] = await db.query(`
      SELECT 
        DATE_FORMAT(meeting_date, '%Y-%m') as month,
        COUNT(*) as count
      FROM ppg_meetings
      WHERE meeting_date >= DATE_SUB(NOW(), INTERVAL 12 MONTH)
      GROUP BY DATE_FORMAT(meeting_date, '%Y-%m')
      ORDER BY month ASC
    `);

    res.status(200).json({
      success: true,
      data: {
        stats: meetingStats[0] || {},
        monthly_distribution: meetingsByMonth || []
      }
    });
  } catch (err) {
    console.error('Meeting analytics error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// 📊 Get member analytics
app.get('/api/dashboard/member-analytics', async (req, res) => {
  try {
    const [memberStats] = await db.query(`
      SELECT 
        COUNT(*) as total_members,
        COUNT(DISTINCT group_gcode) as total_groups,
        COUNT(DISTINCT cluster_ccode) as total_clusters,
        (SELECT COUNT(*) FROM ppg_members) as ppg_members_count
      FROM members
    `);

    const [membersByGroup] = await db.query(`
      SELECT 
        g.group_cname,
        COUNT(*) as member_count
      FROM members m
      JOIN grp g ON m.group_gcode = g.group_gcode
      GROUP BY g.group_gcode, g.group_cname
      ORDER BY member_count DESC
      LIMIT 10
    `);

    res.status(200).json({
      success: true,
      data: {
        stats: memberStats[0] || {},
        by_group: membersByGroup || []
      }
    });
  } catch (err) {
    console.error('Member analytics error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// 📊 Get PPG performance analytics
app.get('/api/dashboard/ppg-performance', async (req, res) => {
  try {
    const [performance] = await db.query(`
      SELECT 
        pm.id,
        pm.ppg_code,
        pm.ppg_name,
        pm.cluster_cname,
        COUNT(DISTINCT pmeet.id) as total_meetings,
        COUNT(DISTINCT ppart.id) as total_participants,
        COUNT(DISTINCT dem.id) as total_demands,
        COALESCE(SUM(dem.total), 0) as total_demand_value,
        DATEDIFF(NOW(), MAX(pmeet.meeting_date)) as days_since_last_meeting
      FROM ppg_master pm
      LEFT JOIN ppg_meetings pmeet ON pmeet.ppg_id = pm.id
      LEFT JOIN ppg_meeting_participants ppart ON pmeet.id = ppart.meeting_id
      LEFT JOIN meeting_member_demands dem ON pmeet.id = dem.meeting_id
      GROUP BY pm.id, pm.ppg_code, pm.ppg_name, pm.cluster_cname
      ORDER BY total_meetings DESC
    `);

    // Calculate averages
    const totalPPGs = performance.length;
    const totalMeetings = performance.reduce((sum, p) => sum + (p.total_meetings || 0), 0);
    const avgMeetingsPerPPG = totalPPGs > 0 ? (totalMeetings / totalPPGs).toFixed(2) : 0;

    res.status(200).json({
      success: true,
      data: {
        summary: {
          total_ppgs: totalPPGs,
          total_meetings: totalMeetings,
          avg_meetings_per_ppg: avgMeetingsPerPPG,
          total_demand_value: performance.reduce((sum, p) => sum + parseFloat(p.total_demand_value), 0)
        },
        performance: performance || []
      }
    });
  } catch (err) {
    console.error('PPG performance error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// 📊 Get demand analytics
app.get('/api/dashboard/demand-analytics', async (req, res) => {
  try {
    const [totalDemands] = await db.query(`
      SELECT 
        COUNT(*) as total_demands,
        COALESCE(SUM(total), 0) as total_value,
        AVG(total) as avg_demand_value,
        COUNT(DISTINCT member_id) as unique_members,
        COUNT(DISTINCT product_name) as unique_products
      FROM meeting_member_demands
    `);

    const [topProducts] = await db.query(`
      SELECT 
        product_name,
        COUNT(*) as demand_count,
        SUM(quantity) as total_quantity,
        SUM(total) as total_value
      FROM meeting_member_demands
      WHERE product_name IS NOT NULL AND product_name != ''
      GROUP BY product_name
      ORDER BY total_value DESC
      LIMIT 10
    `);

    const [demandsByMonth] = await db.query(`
      SELECT 
        DATE_FORMAT(created_at, '%Y-%m') as month,
        COUNT(*) as demand_count,
        SUM(total) as total_value
      FROM meeting_member_demands
      WHERE created_at >= DATE_SUB(NOW(), INTERVAL 12 MONTH)
      GROUP BY DATE_FORMAT(created_at, '%Y-%m')
      ORDER BY month ASC
    `);

    res.status(200).json({
      success: true,
      data: {
        summary: totalDemands[0] || {},
        top_products: topProducts || [],
        monthly_trends: demandsByMonth || []
      }
    });
  } catch (err) {
    console.error('Demand analytics error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});
// ── Test ──────────────────────────────────────────────────────
app.get('/api/test', async (req, res) => {
  try {
    await db.query('SELECT 1');
    res.json({ message: 'Database connected!' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Location Cascade ──────────────────────────────────────────
app.get('/api/state', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT state_scode, state_sname FROM state ORDER BY state_sname');
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/district', async (req, res) => {
  const { state_scode } = req.query;
  if (!state_scode) return res.status(400).json({ error: 'state_scode required' });
  try {
    const [rows] = await db.query(
      'SELECT district_dcode, district_dname FROM district WHERE state_scode = ? ORDER BY district_dname',
      [state_scode]
    );
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/location', async (req, res) => {
  const { district_dcode } = req.query;
  if (!district_dcode) return res.status(400).json({ error: 'district_dcode required' });
  try {
    const [rows] = await db.query(
      'SELECT location_lcode, location_lname FROM location WHERE district_dcode = ? ORDER BY location_lname',
      [district_dcode]
    );
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/cluster', async (req, res) => {
  const { location_lcode } = req.query;
  if (!location_lcode) return res.status(400).json({ error: 'location_lcode required' });
  try {
    const [rows] = await db.query(
      'SELECT cluster_ccode, cluster_cname FROM cluster WHERE location_lcode = ? ORDER BY cluster_cname',
      [location_lcode]
    );
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/grp', async (req, res) => {
  const { cluster_ccode } = req.query;
  if (!cluster_ccode) return res.status(400).json({ error: 'cluster_ccode required' });
  try {
    const [rows] = await db.query(
      'SELECT group_gcode, group_cname FROM grp WHERE cluster_ccode = ? ORDER BY group_cname',
      [cluster_ccode]
    );
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/members', async (req, res) => {
  const { group_gcode } = req.query;
  const [rows] = await db.query(
    'SELECT id, member_mcode, unique_id FROM members WHERE group_gcode = ? ORDER BY member_mcode',
    [group_gcode]
  );
  res.json(rows);
});

// ── PPG APIs ──────────────────────────────────────────────────

app.get('/api/ppg/list', async (req, res) => {
  const { cluster_ccode } = req.query;
  try {
    let query = `SELECT id, ppg_code, ppg_name, account_number, bank_name, ifsc_code, 
                        state_scode, district_dcode, location_lcode, cluster_ccode,
                        created_at
                 FROM ppg_master`;
    let params = [];
    if (cluster_ccode) {
      query += ` WHERE cluster_ccode = ?`;
      params.push(cluster_ccode);
    }
    query += ` ORDER BY ppg_name ASC`;
    const [rows] = await db.query(query, params);
    res.status(200).json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/ppg/list-for-original', async (req, res) => {
  const { cluster_ccode } = req.query;
  if (!cluster_ccode) {
    return res.status(400).json({ error: "Cluster code is required" });
  }
  try {
    const [ppgRows] = await db.query(
      `SELECT id, ppg_code, ppg_name, account_number, bank_name, ifsc_code,
              signature1, signature2, state_scode, district_dcode, location_lcode, cluster_ccode, created_at
       FROM ppg_master WHERE cluster_ccode = ? ORDER BY ppg_name ASC`,
      [cluster_ccode]
    );
    const result = await Promise.all(ppgRows.map(async (ppg) => {
      const [memberRows] = await db.query(
        `SELECT member_ids, non_member_names FROM ppg_members WHERE ppg_id = ?`,
        [ppg.id]
      );
      let totalMembers = 0;
      memberRows.forEach(row => {
        if (row.member_ids && row.member_ids.trim()) {
          const ids = row.member_ids.split(',').filter(id => id.trim());
          totalMembers += ids.length;
        }
        if (row.non_member_names && row.non_member_names.trim()) {
          const names = row.non_member_names.split(',').filter(name => name.trim());
          totalMembers += names.length;
        }
      });
      return { ...ppg, member_count: totalMembers };
    }));
    res.status(200).json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/ppg/list-simple', async (req, res) => {
  const { cluster_ccode } = req.query;
  if (!cluster_ccode) {
    return res.status(400).json({ error: "Cluster code is required" });
  }
  try {
    const [rows] = await db.query(
      `SELECT id, ppg_code, ppg_name FROM ppg_master WHERE cluster_ccode = ? ORDER BY ppg_name ASC`,
      [cluster_ccode]
    );
    res.status(200).json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/ppg/all', async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT id, ppg_code, ppg_name FROM ppg_master ORDER BY ppg_name ASC'
    );
    res.status(200).json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/ppg/names/all', async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT id, ppg_code, ppg_name, state_scode, state_sname,
              district_dcode, district_dname, location_lcode, location_lname,
              cluster_ccode, cluster_cname, group_gcode, group_gname,
              unique_id, created_at, updated_at
       FROM ppgname_tables ORDER BY ppg_name ASC`
    );
    res.status(200).json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/ppg/names', async (req, res) => {
  const { cluster_ccode } = req.query;
  try {
    let query = `SELECT id, ppg_code, ppg_name, state_scode, state_sname,
                        district_dcode, district_dname, location_lcode, location_lname,
                        cluster_ccode, cluster_cname, group_gcode, group_gname,
                        unique_id, created_at, updated_at
                 FROM ppgname_tables`;
    let params = [];
    if (cluster_ccode) {
      query += ` WHERE cluster_ccode = ?`;
      params.push(cluster_ccode);
    }
    query += ` ORDER BY ppg_name ASC`;
    const [rows] = await db.query(query, params);
    res.status(200).json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/ppg/create-simple', async (req, res) => {
  const { state_scode, district_dcode, location_lcode, cluster_ccode, ppg_name } = req.body;
  if (!ppg_name || !cluster_ccode) {
    return res.status(400).json({ error: "PPG name and cluster are required" });
  }
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();
    const [maxCode] = await conn.query(
      `SELECT MAX(ppg_code) as max_code FROM ppg_master WHERE cluster_ccode = ?`,
      [cluster_ccode]
    );
    let nextNumber = 1;
    if (maxCode[0]?.max_code) {
      const lastCode = maxCode[0].max_code;
      const lastNumber = parseInt(lastCode.split('-').pop());
      nextNumber = lastNumber + 1;
    }
    const ppg_code = `PPG-${String(nextNumber).padStart(3, '0')}`;
    const [result] = await conn.query(
      `INSERT INTO ppg_master (ppg_code, ppg_name, state_scode, district_dcode, 
       location_lcode, cluster_ccode, account_number, bank_name, ifsc_code, signature1, signature2, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
      [ppg_code, ppg_name, state_scode, district_dcode, location_lcode, cluster_ccode, '', '', '', '', '']
    );
    await conn.commit();
    res.status(201).json({ success: true, id: result.insertId, ppg_code, ppg_name, message: 'PPG created successfully' });
  } catch (err) {
    await conn.rollback();
    res.status(500).json({ success: false, error: err.message });
  } finally {
    conn.release();
  }
});

app.post('/api/ppg/original', async (req, res) => {
  const { 
    state_scode, district_dcode, location_lcode, cluster_ccode, ppg_name,
    account_number, bank_name, ifsc_code, signature1, signature2, ppg_position,
    ppg_id  // 🔥 ADD THIS - Receive the PPG ID for update
  } = req.body;

  // Validation
  if (!state_scode) return res.status(400).json({ error: "State is required" });
  if (!district_dcode) return res.status(400).json({ error: "District is required" });
  if (!location_lcode) return res.status(400).json({ error: "Location is required" });
  if (!cluster_ccode) return res.status(400).json({ error: "Cluster is required" });
  if (!ppg_name?.trim()) return res.status(400).json({ error: "PPG Name is required" });
  if (!account_number?.trim()) return res.status(400).json({ error: "Account Number is required" });
  if (!bank_name?.trim()) return res.status(400).json({ error: "Bank Name is required" });
  if (!ifsc_code?.trim()) return res.status(400).json({ error: "IFSC Code is required" });
  if (!signature1?.trim()) return res.status(400).json({ error: "Signature 1 is required" });
  if (!signature2?.trim()) return res.status(400).json({ error: "Signature 2 is required" });

  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();
    
    let existingPPG = [];
    let ppg_id_to_use = null;
    
    // 🔥 STEP 1: Check if PPG ID was provided (UPDATE) or find by name (CREATE)
    if (ppg_id) {
      // If ID is provided, try to find that specific PPG
      const [result] = await conn.query(
        `SELECT id, ppg_code FROM ppg_master WHERE id = ?`,
        [ppg_id]
      );
      existingPPG = result;
      
      if (existingPPG.length === 0) {
        await conn.rollback();
        return res.status(404).json({ error: "PPG not found with ID: " + ppg_id });
      }
      console.log(`🔄 UPDATING PPG BY ID: ${ppg_id}`);
    } else {
      // If no ID, check if PPG exists by name
      const [result] = await conn.query(
        `SELECT id, ppg_code FROM ppg_master 
         WHERE ppg_name = ? AND cluster_ccode = ?`,
        [ppg_name.trim(), cluster_ccode]
      );
      existingPPG = result;
      console.log(`🔍 Checking by name: ${ppg_name}`);
    }
    
    let ppg_code;
    
    // Get location names
    const [stateRows] = await conn.query(
      `SELECT s.state_sname, d.district_dname, l.location_lname, c.cluster_cname
       FROM state s 
       JOIN district d ON s.state_scode = d.state_scode
       JOIN location l ON d.district_dcode = l.district_dcode
       JOIN cluster c ON l.location_lcode = c.location_lcode
       WHERE s.state_scode = ? AND d.district_dcode = ? 
         AND l.location_lcode = ? AND c.cluster_ccode = ?`,
      [state_scode, district_dcode, location_lcode, cluster_ccode]
    );
    
    if (stateRows.length === 0) {
      await conn.rollback();
      return res.status(400).json({ error: "Invalid Location Details" });
    }
    
    const { state_sname, district_dname, location_lname, cluster_cname } = stateRows[0];
    
    if (existingPPG.length > 0) {
      // ✅ UPDATE existing PPG
      const updateId = existingPPG[0].id;
      ppg_code = existingPPG[0].ppg_code;
      
      console.log(`🔄 UPDATING PPG: ${ppg_code} - ${ppg_name} (ID: ${updateId})`);
      
      // Update ppg_master
      await conn.query(
        `UPDATE ppg_master SET 
         ppg_name = ?,
         state_scode = ?, state_sname = ?,
         district_dcode = ?, district_dname = ?,
         location_lcode = ?, location_lname = ?,
         cluster_ccode = ?, cluster_cname = ?,
         account_number = ?, bank_name = ?, ifsc_code = ?,
         signature1 = ?, signature2 = ?, ppg_position = ?,
         updated_at = NOW()
         WHERE id = ?`,
        [ppg_name.trim(), state_scode, state_sname, 
         district_dcode, district_dname,
         location_lcode, location_lname, 
         cluster_ccode, cluster_cname,
         account_number.trim(), bank_name.trim(), ifsc_code.trim().toUpperCase(),
         signature1.trim(), signature2.trim(), ppg_position || 'Member', 
         updateId]
      );
      
      // Update ppgname_tables
      const [existingNameTable] = await conn.query(
        `SELECT id FROM ppgname_tables 
         WHERE ppg_code = ? AND cluster_ccode = ?`,
        [ppg_code, cluster_ccode]
      );
      
      if (existingNameTable.length > 0) {
        await conn.query(
          `UPDATE ppgname_tables SET 
           ppg_name = ?, 
           state_scode = ?, state_sname = ?,
           district_dcode = ?, district_dname = ?,
           location_lcode = ?, location_lname = ?,
           cluster_ccode = ?, cluster_cname = ?,
           updated_at = NOW()
           WHERE ppg_code = ? AND cluster_ccode = ?`,
          [ppg_name.trim(), state_scode, state_sname, 
           district_dcode, district_dname,
           location_lcode, location_lname, 
           cluster_ccode, cluster_cname,
           ppg_code, cluster_ccode]
        );
      }
      
      await conn.commit();
      return res.status(200).json({ 
        success: true, 
        id: updateId, 
        ppg_code, 
        ppg_name: ppg_name.trim(), 
        message: 'PPG updated successfully' 
      });
      
    } else {
      // ✅ CREATE new PPG
      console.log(`🆕 CREATING NEW PPG: ${ppg_name}`);
      
      // Generate unique PPG code
      const [existing] = await conn.query('SELECT ppg_code FROM ppg_master ORDER BY ppg_code');
      const existingNumbers = existing.map(row => {
        const match = row.ppg_code.match(/PPG(\d+)/);
        return match ? parseInt(match[1]) : 0;
      }).filter(num => num > 0).sort((a, b) => a - b);
      
      let nextNumber = 1;
      for (let i = 1; i <= Math.max(...existingNumbers, 0) + 1; i++) {
        if (!existingNumbers.includes(i)) { nextNumber = i; break; }
      }
      if (existingNumbers.includes(nextNumber)) nextNumber = Math.max(...existingNumbers) + 1;
      ppg_code = `PPG${String(nextNumber).padStart(5, '0')}`;

      // Insert into ppg_master
      const [result] = await conn.query(
        `INSERT INTO ppg_master (
          ppg_code, ppg_name, state_scode, state_sname,
          district_dcode, district_dname, location_lcode, location_lname,
          cluster_ccode, cluster_cname, account_number, bank_name, ifsc_code,
          signature1, signature2, ppg_position, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
        [ppg_code, ppg_name.trim(), state_scode, state_sname, 
         district_dcode, district_dname,
         location_lcode, location_lname, 
         cluster_ccode, cluster_cname,
         account_number.trim(), bank_name.trim(), ifsc_code.trim().toUpperCase(),
         signature1.trim(), signature2.trim(), ppg_position || 'Member']
      );
      const newId = result.insertId;

      // Insert into ppgname_tables
      await conn.query(
        `INSERT INTO ppgname_tables (
          ppg_code, ppg_name, state_scode, state_sname,
          district_dcode, district_dname, location_lcode, location_lname,
          cluster_ccode, cluster_cname, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
        [ppg_code, ppg_name.trim(), state_scode, state_sname, 
         district_dcode, district_dname,
         location_lcode, location_lname, 
         cluster_ccode, cluster_cname]
      );

      await conn.commit();
      return res.status(201).json({ 
        success: true, 
        id: newId, 
        ppg_code, 
        ppg_name: ppg_name.trim(), 
        message: 'PPG created successfully' 
      });
    }
    
  } catch (err) {
    await conn.rollback();
    console.error('❌ Error in /api/ppg/original:', err);
    res.status(500).json({ success: false, error: err.message });
  } finally {
    conn.release();
  }
});

app.post('/api/ppg/members', async (req, res) => {
  const { state_scode, district_dcode, location_lcode, cluster_ccode, ppg_id, group_gcode, ppg_position, member_ids, non_member_names } = req.body;
  if (!ppg_id) return res.status(400).json({ error: "PPG ID is required" });
  if (!group_gcode) return res.status(400).json({ error: "Group is required" });

  const hasMembers = Array.isArray(member_ids) && member_ids.length > 0;
  const hasNonMembers = typeof non_member_names === 'string' && non_member_names.trim().length > 0;
  if (!hasMembers && !hasNonMembers) {
    return res.status(400).json({ error: "Select at least one member or add a non-member name" });
  }

  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();
    
    // Delete existing members for this PPG and group
    await conn.query(`DELETE FROM ppg_members WHERE ppg_id = ? AND group_gcode = ?`, [ppg_id, group_gcode]);

    const [ppgRows] = await conn.query(`SELECT id, ppg_code, ppg_name FROM ppg_master WHERE id = ?`, [ppg_id]);
    if (ppgRows.length === 0) throw new Error("PPG not found");
    const ppg = ppgRows[0];

    const [[stateRow]] = await conn.query(`SELECT state_sname FROM state WHERE state_scode = ?`, [state_scode]);
    const [[districtRow]] = await conn.query(`SELECT district_dname FROM district WHERE district_dcode = ?`, [district_dcode]);
    const [[locationRow]] = await conn.query(`SELECT location_lname FROM location WHERE location_lcode = ?`, [location_lcode]);
    const [[clusterRow]] = await conn.query(`SELECT cluster_cname FROM cluster WHERE cluster_ccode = ?`, [cluster_ccode]);
    const [[groupRow]] = await conn.query(`SELECT group_cname as group_gname FROM grp WHERE group_gcode = ?`, [group_gcode]);

    let members = [];
    let memberUniqueIds = '';
    if (hasMembers) {
      const placeholders = member_ids.map(() => '?').join(',');
      const [rows] = await conn.query(`SELECT id, member_mcode, unique_id FROM members WHERE id IN (${placeholders})`, member_ids);
      members = rows;
      if (members.length === 0) throw new Error("No valid members found");
      memberUniqueIds = members.map(m => m.unique_id || m.member_mcode).join(', ');
    }

    const memberIdList = members.map(m => m.id).join(',');
    const memberCodeList = members.map(m => m.member_mcode).join(',');
    const memberUniqueIdList = members.map(m => m.unique_id || m.member_mcode).join(',');
    const cleanNonMemberNames = hasNonMembers ? non_member_names.trim() : null;

    // Insert into ppg_members
    const [result] = await conn.query(
      `INSERT INTO ppg_members (ppg_id, ppg_code, ppg_name, state_scode, state_sname,
       district_dcode, district_dname, location_lcode, location_lname,
       cluster_ccode, cluster_cname, group_gcode, group_gname, ppg_position,
       member_ids, member_codes, member_unique_ids, non_member_names, total_members, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
      [ppg.id, ppg.ppg_code, ppg.ppg_name, state_scode, stateRow?.state_sname || '',
       district_dcode, districtRow?.district_dname || '', location_lcode, locationRow?.location_lname || '',
       cluster_ccode, clusterRow?.cluster_cname || '', group_gcode, groupRow?.group_gname || '',
       ppg_position || 'Member', memberIdList, memberCodeList, memberUniqueIdList,
       cleanNonMemberNames, members.length]
    );

    // 🔥 FIX: Update or Insert into ppgname_tables
    const [existingNameTable] = await conn.query(
      `SELECT id FROM ppgname_tables 
       WHERE ppg_code = ? AND cluster_ccode = ?`,
      [ppg.ppg_code, cluster_ccode]
    );
    
    if (existingNameTable.length > 0) {
      // Update existing record
      await conn.query(
        `UPDATE ppgname_tables SET 
         ppg_name = ?, state_scode = ?, state_sname = ?,
         district_dcode = ?, district_dname = ?, 
         location_lcode = ?, location_lname = ?,
         cluster_ccode = ?, cluster_cname = ?,
         group_gcode = ?, group_gname = ?, 
         unique_id = ?, updated_at = NOW()
         WHERE ppg_code = ? AND cluster_ccode = ?`,
        [ppg.ppg_name, state_scode, stateRow?.state_sname || '',
         district_dcode, districtRow?.district_dname || '', 
         location_lcode, locationRow?.location_lname || '',
         cluster_ccode, clusterRow?.cluster_cname || '',
         group_gcode, groupRow?.group_gname || '',
         memberUniqueIds || cleanNonMemberNames || '',
         ppg.ppg_code, cluster_ccode]
      );
    } else {
      // Insert new record
      await conn.query(
        `INSERT INTO ppgname_tables (ppg_code, ppg_name, state_scode, state_sname,
         district_dcode, district_dname, location_lcode, location_lname,
         cluster_ccode, cluster_cname, group_gcode, group_gname, unique_id, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
        [ppg.ppg_code, ppg.ppg_name, state_scode, stateRow?.state_sname || '',
         district_dcode, districtRow?.district_dname || '', location_lcode, locationRow?.location_lname || '',
         cluster_ccode, clusterRow?.cluster_cname || '', group_gcode, groupRow?.group_gname || '',
         memberUniqueIds || cleanNonMemberNames || '']
      );
    }

    await conn.commit();
    res.status(201).json({ success: true, total_members: members.length, non_member_names: cleanNonMemberNames, affected_rows: result.affectedRows, message: 'PPG members saved successfully' });
  } catch (err) {
    await conn.rollback();
    console.error('❌ Error in /api/ppg/members:', err);
    res.status(500).json({ success: false, error: err.message });
  } finally {
    conn.release();
  }
});

// ── FPO APIs ──────────────────────────────────────────────────

app.get('/api/fpo/generate-code', async (req, res) => {
  try {
    const [[{ cnt }]] = await db.query('SELECT COUNT(*) AS cnt FROM fpo_master');
    const seq = String(Number(cnt) + 1).padStart(4, '0');
    const year = new Date().getFullYear().toString().slice(-2);
    res.json({ code: `FPO-${year}-${seq}` });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/fpo/original', async (req, res) => {
  const { state_scode, district_dcode, location_lcode, cluster_ccode, fpo_code, fpo_name, account_number, bank_name, ifsc_code, signature1, signature2 } = req.body;
  const [[state]] = await db.query("SELECT state_sname FROM state WHERE state_scode=?", [state_scode]);
  const [[district]] = await db.query("SELECT district_dname FROM district WHERE district_dcode=?", [district_dcode]);
  const [[location]] = await db.query("SELECT location_lname FROM location WHERE location_lcode=?", [location_lcode]);
  const [[cluster]] = await db.query("SELECT cluster_cname FROM cluster WHERE cluster_ccode=?", [cluster_ccode]);

  if (!fpo_name?.trim() || fpo_name.length > 200) return res.status(400).json({ error: 'FPO name must be 1–200 chars' });
  if (!account_number || !/^\d{9,18}$/.test(account_number)) return res.status(400).json({ error: 'Account number must be 9–18 digits' });
  if (!bank_name?.trim() || bank_name.length > 100) return res.status(400).json({ error: 'Bank name must be 1–100 chars' });
  if (!ifsc_code || !/^[A-Z]{4}0[A-Z0-9]{6}$/.test(ifsc_code)) return res.status(400).json({ error: 'Invalid IFSC code' });
  if (!signature1?.trim() || signature1.length > 100) return res.status(400).json({ error: 'Signatory 1 must be 1–100 chars' });
  if (!signature2?.trim() || signature2.length > 100) return res.status(400).json({ error: 'Signatory 2 must be 1–100 chars' });

  try {
    const [result] = await db.query(
      `INSERT INTO fpo_master (fpo_code, fpo_name, state_scode, state_sname,
       district_dcode, district_dname, location_lcode, location_lname,
       cluster_ccode, cluster_cname, fpo_ac_no, bank_name, ifsc_code, signature1, signature2, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
      [fpo_code, fpo_name.trim(), state_scode, state?.state_sname || "", district_dcode, district?.district_dname || "",
       location_lcode, location?.location_lname || "", cluster_ccode, cluster?.cluster_cname || "",
       account_number.trim(), bank_name.trim(), ifsc_code.trim(), signature1.trim(), signature2.trim()]
    );
    res.status(201).json({ id: result.insertId, fpo_code, message: 'FPO created successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/fpo/members', async (req, res) => {
  const { state_scode, district_dcode, location_lcode, cluster_ccode, ppg_id, group_gcode, member_ids } = req.body;
  const fpo_id = ppg_id;
  if (!fpo_id) return res.status(400).json({ error: "FPO ID is required" });
  if (!group_gcode) return res.status(400).json({ error: "Group is required" });
  if (!Array.isArray(member_ids) || member_ids.length === 0) return res.status(400).json({ error: "Select at least one member" });

  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();
    await conn.query(`DELETE FROM fpo_members WHERE fpo_id = ? AND group_gcode = ?`, [fpo_id, group_gcode]);

    const [[fpo]] = await conn.query(`SELECT id, fpo_code, fpo_name, fpo_ac_no, bank_name, ifsc_code, signature1, signature2 FROM fpo_master WHERE id=?`, [fpo_id]);
    if (!fpo) throw new Error("FPO not found");

    const [[state]] = await conn.query(`SELECT state_sname FROM state WHERE state_scode=?`, [state_scode]);
    const [[district]] = await conn.query(`SELECT district_dname FROM district WHERE district_dcode=?`, [district_dcode]);
    const [[location]] = await conn.query(`SELECT location_lname FROM location WHERE location_lcode=?`, [location_lcode]);
    const [[cluster]] = await conn.query(`SELECT cluster_cname FROM cluster WHERE cluster_ccode=?`, [cluster_ccode]);
    const [[group]] = await conn.query(`SELECT group_cname FROM grp WHERE group_gcode=?`, [group_gcode]);

    const uniqueMembers = [...new Set(member_ids)];
    const placeholders = uniqueMembers.map(() => '?').join(',');
    const [members] = await conn.query(`SELECT id, member_mcode FROM members WHERE id IN (${placeholders})`, uniqueMembers);
    if (members.length === 0) throw new Error("No valid members found");

    const bulkValues = [];
    const baseData = [fpo.id, fpo.fpo_code, fpo.fpo_name, state_scode, state?.state_sname || "",
      district_dcode, district?.district_dname || "", location_lcode, location?.location_lname || "",
      cluster_ccode, cluster?.cluster_cname || "", fpo.fpo_ac_no, fpo.bank_name, fpo.ifsc_code,
      fpo.signature1, fpo.signature2, group_gcode, group?.group_cname || ""];

    for (const member of members) {
      bulkValues.push(...baseData, member.id, member.member_mcode);
    }

    const rowPlaceholders = uniqueMembers.map(() => '(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())').join(', ');
    const sql = `INSERT INTO fpo_members (fpo_id, fpo_code, fpo_name, state_scode, state_sname,
      district_dcode, district_dname, location_lcode, location_lname, cluster_ccode, cluster_cname,
      fpo_ac_no, bank_name, ifsc_code, signature1, signature2, group_gcode, group_gname,
      unique_id, member_mcode, created_at) VALUES ${rowPlaceholders}`;

    const [result] = await conn.query(sql, bulkValues);
    await conn.commit();
    res.status(201).json({ success: true, total_members: members.length, affected_rows: result.affectedRows, message: `${members.length} FPO Members saved successfully` });
  } catch (err) {
    await conn.rollback();
    res.status(500).json({ success: false, error: err.message });
  } finally {
    conn.release();
  }
});

// ── UNITS & PRODUCTS APIs ─────────────────────────────────────

app.get('/api/units', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT id, unit_name FROM units ORDER BY unit_name');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/units', async (req, res) => {
  const { unit_name } = req.body;
  if (!unit_name?.trim()) return res.status(400).json({ error: 'unit_name is required' });
  try {
    const [result] = await db.query(`INSERT INTO units (unit_name) VALUES (?) ON DUPLICATE KEY UPDATE unit_name = unit_name`, [unit_name.trim()]);
    let id = result.insertId;
    if (!id) {
      const [[existing]] = await db.query('SELECT id FROM units WHERE unit_name = ?', [unit_name.trim()]);
      id = existing?.id;
    }
    res.status(201).json({ success: true, id, unit_name: unit_name.trim() });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// server.js - Updated POST /api/products endpoint

app.post('/api/products', async (req, res) => {
  const { ppg_id, product_name, unit_id } = req.body;
  
  console.log('📦 Creating product:', { ppg_id, product_name, unit_id });
  
  if (!ppg_id) return res.status(400).json({ error: 'ppg_id is required' });
  if (!product_name?.trim()) return res.status(400).json({ error: 'product_name is required' });
  if (!unit_id) return res.status(400).json({ error: 'unit_id is required' });

  try {
    // 🔥 Get PPG name and Unit name
    const [ppg] = await db.query(
      'SELECT id, ppg_name FROM ppg_master WHERE id = ?', 
      [ppg_id]
    );
    if (ppg.length === 0) {
      return res.status(400).json({ error: 'PPG does not exist' });
    }
    
    const [unit] = await db.query(
      'SELECT id, unit_name FROM units WHERE id = ?', 
      [unit_id]
    );
    if (unit.length === 0) {
      return res.status(400).json({ error: 'Unit does not exist' });
    }

    const ppgName = ppg[0].ppg_name;
    const unitName = unit[0].unit_name;

    // 🔥 Check for existing product with same name AND unit for this PPG
    const [existing] = await db.query(
      `SELECT id, product_name, unit_id FROM products 
       WHERE ppg_id = ? AND product_name = ? AND unit_id = ?`,
      [ppg_id, product_name.trim(), parseInt(unit_id)]
    );
    
    if (existing.length > 0) {
      console.log(`⚠️ Duplicate found: ${product_name} with unit ${unitName} for PPG ${ppgName}`);
      return res.status(409).json({ 
        error: `Product "${product_name}" with unit "${unitName}" already exists for PPG "${ppgName}"`
      });
    }

    // 🔥 Insert new product with ppg_name and unit_name
    const [result] = await db.query(
      `INSERT INTO products (ppg_id, ppg_name, product_name, unit_id, unit_name) 
       VALUES (?, ?, ?, ?, ?)`,
      [ppg_id, ppgName, product_name.trim(), parseInt(unit_id), unitName]
    );
    
    console.log(`✅ Product created: ${product_name} for PPG ${ppgName} with unit ${unitName}`);
    res.status(201).json({ 
      success: true, 
      id: result.insertId, 
      message: 'Product created successfully' 
    });
  } catch (err) {
    console.error('❌ Error creating product:', err);
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ 
        error: 'This product already exists for this PPG with this unit' 
      });
    }
    res.status(500).json({ error: err.message });
  }
});

// 🔥 Updated GET /api/products/ppg/:ppgId endpoint
app.get('/api/products/ppg/:ppgId', async (req, res) => {
  const { ppgId } = req.params;
  if (!ppgId) return res.status(400).json({ error: 'PPG ID is required' });
  try {
    // Now we can just select directly from products table since we store the names
    const [rows] = await db.query(
      `SELECT id, ppg_id, ppg_name, product_name, unit_id, unit_name, created_at
       FROM products 
       WHERE ppg_id = ? 
       ORDER BY product_name ASC`,
      [ppgId]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 🔥 Updated GET /api/products endpoint
app.get('/api/products', async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT id, ppg_id, ppg_name, product_name, unit_id, unit_name, created_at
       FROM products 
       ORDER BY ppg_name, product_name ASC`
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Determine PPG Member Mode (groups vs non-members-only) ──
app.get('/api/ppg/:ppgId/members-mode', async (req, res) => {
  const { ppgId } = req.params;
  if (!ppgId) return res.status(400).json({ error: 'ppgId is required' });

  try {
    const [rows] = await db.query(
      `SELECT id, group_gcode, group_gname, member_ids, member_codes,
              member_unique_ids, non_member_names, total_members
       FROM ppg_members
       WHERE ppg_id = ?`,
      [ppgId]
    );

    const groupsWithRealMembers = [];
    const nonMembers = [];

    rows.forEach(row => {
      const hasRealMembers = !!(row.member_ids && row.member_ids.trim() !== '');

      if (hasRealMembers) {
        groupsWithRealMembers.push({
          group_gcode: row.group_gcode,
          group_gname: row.group_gname,
        });
        return; // don't pull non-members out of a real-member row
      }

      // 🔑 THIS is the part that must split into individuals
      if (row.non_member_names && row.non_member_names.trim() !== '') {
        const names = row.non_member_names
          .split(',')
          .map(n => n.trim())
          .filter(n => n.length > 0);

        names.forEach((name, idx) => {
          nonMembers.push({
            id: `nm_${row.id}_${idx}`,   // unique per person
            name,                        // ← individual name only
            group_gcode: row.group_gcode,
            group_gname: row.group_gname,
          });
        });
      }
    });

    const hasRealMembers = groupsWithRealMembers.length > 0;

    res.json({
      success: true,
      has_real_members: hasRealMembers,
      groups: hasRealMembers ? groupsWithRealMembers : [],
      non_members: hasRealMembers ? [] : nonMembers,
    });
  } catch (err) {
    console.error('members-mode error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// server.js - Replace the POST /api/products endpoint with this:

app.post('/api/products', async (req, res) => {
  const { ppg_id, product_name, unit_id } = req.body;
  
  console.log('📦 Creating product:', { ppg_id, product_name, unit_id });
  
  if (!ppg_id) return res.status(400).json({ error: 'ppg_id is required' });
  if (!product_name?.trim()) return res.status(400).json({ error: 'product_name is required' });
  if (!unit_id) return res.status(400).json({ error: 'unit_id is required' });

  try {
    // Check if PPG exists
    const [ppg] = await db.query('SELECT id FROM ppg_master WHERE id = ?', [ppg_id]);
    if (ppg.length === 0) {
      return res.status(400).json({ error: 'PPG does not exist' });
    }
    
    // Check if unit exists
    const [unit] = await db.query('SELECT id FROM units WHERE id = ?', [unit_id]);
    if (unit.length === 0) {
      return res.status(400).json({ error: 'Unit does not exist' });
    }

    // 🔥 CHECK FOR EXISTING PRODUCT - This is the key fix
    const [existing] = await db.query(
      `SELECT id, product_name, unit_id FROM products 
       WHERE ppg_id = ? AND product_name = ? AND unit_id = ?`,
      [ppg_id, product_name.trim(), parseInt(unit_id)]
    );
    
    if (existing.length > 0) {
      console.log(`⚠️ Duplicate found: ${product_name} with unit ${unit_id} for PPG ${ppg_id}`);
      console.log(`⚠️ Existing product ID: ${existing[0].id}`);
      return res.status(409).json({ 
        error: `Product "${product_name}" with unit ID ${unit_id} already exists for this PPG`,
        existing_id: existing[0].id
      });
    }

    // Insert new product
    const [result] = await db.query(
      'INSERT INTO products (ppg_id, product_name, unit_id) VALUES (?, ?, ?)',
      [ppg_id, product_name.trim(), parseInt(unit_id)]
    );
    
    console.log(`✅ Product created: ${product_name} with ID ${result.insertId}`);
    res.status(201).json({ 
      success: true, 
      id: result.insertId, 
      message: 'Product created successfully' 
    });
  } catch (err) {
    console.error('❌ Error creating product:', err);
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/products/:id', async (req, res) => {
  try {
    const [result] = await db.query('DELETE FROM products WHERE id = ?', [req.params.id]);
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Product not found' });
    res.json({ success: true, message: 'Product deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/products/ppg/:ppgId', async (req, res) => {
  const { ppgId } = req.params;
  if (!ppgId) return res.status(400).json({ error: 'PPG ID is required' });
  try {
    const [rows] = await db.query(
      `SELECT p.id, p.product_name, p.unit_id, u.unit_name, p.ppg_id
       FROM products p JOIN units u ON p.unit_id = u.id
       WHERE p.ppg_id = ? ORDER BY p.product_name ASC`,
      [ppgId]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── PPG NAME TABLE APIs ──────────────────────────────────────

app.get('/api/ppgname/list', async (req, res) => {
  const { cluster_ccode } = req.query;
  if (!cluster_ccode) return res.status(400).json({ error: 'cluster_ccode required' });
  try {
    const [rows] = await db.query(
      `SELECT ppg_code, ppg_name, MIN(id) AS id FROM ppgname_tables
       WHERE cluster_ccode = ? GROUP BY ppg_code, ppg_name ORDER BY ppg_name`,
      [cluster_ccode]
    );
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/ppgname/groups', async (req, res) => {
  const { ppg_code } = req.query;
  if (!ppg_code) return res.status(400).json({ error: 'ppg_code required' });
  try {
    const [rows] = await db.query(
      `SELECT DISTINCT group_gcode, group_gname FROM ppgname_tables
       WHERE ppg_code = ? ORDER BY group_gname`,
      [ppg_code]
    );
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/ppgname/members', async (req, res) => {
  const { ppg_code, group_gcode } = req.query;
  if (!ppg_code || !group_gcode) return res.status(400).json({ error: 'ppg_code and group_gcode required' });
  try {
    const [rows] = await db.query(
      `SELECT id, unique_id, group_gcode, group_gname FROM ppgname_tables
       WHERE ppg_code = ? AND group_gcode = ? ORDER BY unique_id`,
      [ppg_code, group_gcode]
    );
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ─── PPG MEMBERS FROM TABLE ──────────────────────────────────

app.get('/api/ppg/members/table', async (req, res) => {
  const { ppg_id, group_gcode } = req.query;
  if (!ppg_id) return res.status(400).json({ error: 'ppg_id is required' });
  if (!group_gcode) return res.status(400).json({ error: 'group_gcode is required' });

  try {
    const [rows] = await db.query(
      `SELECT id, ppg_id, ppg_code, ppg_name, group_gcode, group_gname,
              member_ids, member_codes, member_unique_ids, non_member_names, total_members
       FROM ppg_members WHERE ppg_id = ? AND group_gcode = ?
       ORDER BY created_at DESC LIMIT 1`,
      [ppg_id, group_gcode]
    );

    if (rows.length === 0) return res.json([]);
    const row = rows[0];
    const members = [];

    if (row.member_unique_ids && row.member_unique_ids.trim()) {
      const uniqueIds = row.member_unique_ids.split(',').filter(id => id.trim());
      const codes = row.member_codes ? row.member_codes.split(',').filter(c => c.trim()) : [];
      const ids = row.member_ids ? row.member_ids.split(',').filter(id => id.trim()) : [];

      uniqueIds.forEach((uniqueId, index) => {
        const memberId = ids[index] || `member_${index + 1}`;
        members.push({
          id: memberId,
          member_id: memberId,
          member_codes: codes[index] || '',
          member_unique_id: uniqueId.trim(),
          group_gcode: row.group_gcode,
          group_gname: row.group_gname,
          ppg_id: row.ppg_id,
          ppg_code: row.ppg_code,
          ppg_name: row.ppg_name,
        });
      });
    }

    if (row.non_member_names && row.non_member_names.trim()) {
      const nonMembers = row.non_member_names.split(',').filter(name => name.trim());
      nonMembers.forEach((name, index) => {
        members.push({
          id: `nonmember_${index + 1}`,
          member_id: `nonmember_${index + 1}`,
          member_codes: '',
          member_unique_id: name.trim(),
          group_gcode: row.group_gcode,
          group_gname: row.group_gname,
          is_non_member: true,
          ppg_id: row.ppg_id,
          ppg_code: row.ppg_code,
          ppg_name: row.ppg_name,
        });
      });
    }

    res.json(members);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── FPO DEMAND APIs ──────────────────────────────────────────

app.post('/api/fpo/demand', async (req, res) => {
  const { fpo_id, product_name, quantity, unit_price, demand_date, notes } = req.body;
  if (!fpo_id) return res.status(400).json({ error: "FPO ID is required" });
  if (!product_name) return res.status(400).json({ error: "Product name is required" });
  if (!quantity) return res.status(400).json({ error: "Quantity is required" });
  if (!unit_price) return res.status(400).json({ error: "Unit price is required" });

  try {
    const [result] = await db.query(
      `INSERT INTO fpo_demands (fpo_id, product_name, quantity, unit_price, demand_date, notes, created_at)
       VALUES (?, ?, ?, ?, ?, ?, NOW())`,
      [fpo_id, product_name, quantity, unit_price, demand_date || new Date(), notes || null]
    );
    res.status(201).json({ success: true, id: result.insertId, message: 'FPO demand created successfully' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get('/api/fpo/demands', async (req, res) => {
  const { fpo_id } = req.query;
  try {
    let query = `SELECT * FROM fpo_demands`;
    let params = [];
    if (fpo_id) { query += ` WHERE fpo_id = ?`; params.push(fpo_id); }
    query += ` ORDER BY created_at DESC`;
    const [rows] = await db.query(query, params);
    res.status(200).json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─── SAVE PPG MEETING WITH DEMANDS ──────────────────────────
// ─── SAVE PPG MEETING WITH DEMANDS ──────────────────────────
// server.js - Updated PPG Meeting endpoint with proper member demand storage
// server.js - Updated endpoint with better member ID handling

// server.js - Updated endpoint to store each demand separately
// server.js - Updated endpoint to store each demand separately

// server.js - Fix participants insertion

app.post('/api/ppg/meeting', async (req, res) => {
  const {
    ppg_id, ppg_code, ppg_name,
    state_scode, state_sname,
    district_dcode, district_dname,
    location_lcode, location_lname,
    cluster_ccode, cluster_cname,
    meeting_date, meeting_time, venue,
    discussions, major_resolutions,
    created_by,
    participants,  // This should be an array of participant objects
    cash_at_bank,
    total_receipt,
    total_expense,
    voucher_number,
    balance,
    member_demands = [],
    fpo_supply = [],
    fpo_demand = [],
  } = req.body;

  console.log('📦 ========== SAVING MEETING ==========');
  console.log('📦 ppg_id:', ppg_id);
  console.log('📦 ppg_code:', ppg_code);
  console.log('📦 Participants received:', participants ? participants.length : 0);
  console.log('📦 Participants data:', JSON.stringify(participants, null, 2));
  console.log('📦 Total member demands received:', member_demands.length);

  if (!ppg_code) return res.status(400).json({ error: 'ppg_code is required' });
  if (!meeting_date) return res.status(400).json({ error: 'meeting_date is required' });

  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    // Get location details from the PPG
    const [ppgDetails] = await conn.query(
      `SELECT state_scode, district_dcode, location_lcode, cluster_ccode 
       FROM ppg_master WHERE id = ?`,
      [ppg_id]
    );

    const location = ppgDetails[0] || {};

    // Insert meeting
    const [result] = await conn.query(
      `INSERT INTO ppg_meetings
        (ppg_id, ppg_code, ppg_name, 
         state_scode, district_dcode, location_lcode, cluster_ccode,
         meeting_date, meeting_time, venue,
         discussions, major_resolutions, 
         created_by, 
         cash_at_bank, total_receipt, total_expense, voucher_number, balance,
         created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
      [
        ppg_id || null, 
        ppg_code, 
        ppg_name || '',
        location.state_scode || null,
        location.district_dcode || null,
        location.location_lcode || null,
        location.cluster_ccode || null,
        meeting_date, 
        meeting_time || null, 
        venue || null,
        discussions || null, 
        major_resolutions || null,
        created_by || null,
        parseFloat(cash_at_bank) || 0,
        parseFloat(total_receipt) || 0,
        parseFloat(total_expense) || 0,
        voucher_number || null,
        parseFloat(balance) || 0,
      ]
    );
    const meetingId = result.insertId;
    console.log('✅ Meeting created with ID:', meetingId);

    // ─── INSERT PARTICIPANTS ───
    if (Array.isArray(participants) && participants.length > 0) {
      console.log(`📦 Inserting ${participants.length} participants...`);
      
      let participantsInserted = 0;
      for (const p of participants) {
        // Skip non-member entries
        if (p.id && p.id.toString().startsWith('nonmember_')) {
          console.log('⚠️ Skipping non-member participant:', p.id);
          continue;
        }
        
        // Ensure we have all required fields
        const memberId = p.id || p.member_id || 'unknown';
        const memberUniqueId = p.unique_id || p.member_unique_id || memberId;
        const memberName = p.member_name || p.name || memberId;
        const groupGcode = p.group_gcode || null;
        const groupGname = p.group_gname || null;
        
        console.log(`📝 Inserting participant: ${memberName} (${memberId})`);
        
        try {
          await conn.query(
            `INSERT INTO ppg_meeting_participants 
             (meeting_id, member_id, member_unique_id, member_name, group_gcode, group_gname)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [
              meetingId,
              memberId,
              memberUniqueId,
              memberName,
              groupGcode,
              groupGname
            ]
          );
          participantsInserted++;
          console.log(`✅ Participant inserted: ${memberName}`);
        } catch (err) {
          console.error(`❌ Failed to insert participant ${memberId}:`, err.message);
        }
      }
      console.log(`✅ ${participantsInserted} participants inserted successfully`);
    } else {
      console.log('⚠️ No participants to insert');
    }

    // ─── INSERT MEMBER DEMANDS ───
    if (Array.isArray(member_demands) && member_demands.length > 0) {
      console.log(`📦 Inserting ${member_demands.length} member demands...`);
      
      const demandValues = member_demands.map(d => {
        const memberId = d.member_id || d.member_unique_id || 'unknown';
        const memberName = d.member_name || d.member_unique_id || memberId;
        const memberUniqueId = d.member_unique_id || memberId;
        
        return [
          meetingId,
          ppg_id || null,
          ppg_code,
          ppg_name || '',
          d.group_gcode || null,
          d.group_gname || null,
          memberId,
          memberName,
          memberUniqueId,
          d.product_id || null,
          d.product_name || '',
          parseFloat(d.quantity) || 0,
          parseFloat(d.unit_price) || 0,
          parseFloat(d.total) || 0,
        ];
      });
      
      const [demandResult] = await conn.query(
        `INSERT INTO meeting_member_demands
          (meeting_id, ppg_id, ppg_code, ppg_name,
           group_gcode, group_gname,
           member_id, member_name, member_unique_id,
           product_id, product_name,
           quantity, unit_price, total)
         VALUES ?`,
        [demandValues]
      );
      
      console.log(`✅ ${demandResult.affectedRows} member demands inserted`);
    }

    await conn.commit();
    console.log('✅ Transaction committed successfully');
    
    // Get final summary
    const [demandSummary] = await conn.query(
      `SELECT 
        COUNT(DISTINCT member_id) as unique_members,
        COUNT(*) as total_demands,
        SUM(total) as total_amount
       FROM meeting_member_demands 
       WHERE meeting_id = ?`,
      [meetingId]
    );
    
    const [participantSummary] = await conn.query(
      `SELECT COUNT(*) as participant_count 
       FROM ppg_meeting_participants 
       WHERE meeting_id = ?`,
      [meetingId]
    );
    
    res.status(201).json({ 
      success: true, 
      id: meetingId, 
      message: 'Meeting saved successfully',
      summary: {
        participants: participantSummary[0]?.participant_count || 0,
        total_demands: demandSummary[0]?.total_demands || 0,
        unique_members: demandSummary[0]?.unique_members || 0,
        total_amount: demandSummary[0]?.total_amount || 0
      }
    });
  } catch (err) {
    await conn.rollback();
    console.error('❌ Error saving meeting:', err);
    res.status(500).json({ success: false, error: err.message });
  } finally {
    conn.release();
  }
});

// server.js - Debug endpoint to verify member demands
// server.js - Debug endpoint to see all demands separately

// server.js - Enhanced debug endpoint with participants

app.get('/api/debug/meeting-all-demands/:meetingId', async (req, res) => {
  const { meetingId } = req.params;
  try {
    // Get ALL demands with full details
    const [demands] = await db.query(
      `SELECT 
        id,
        meeting_id,
        member_id,
        member_name,
        member_unique_id,
        product_id,
        product_name,
        quantity,
        unit_price,
        total,
        created_at
       FROM meeting_member_demands 
       WHERE meeting_id = ?
       ORDER BY member_id, id`,
      [meetingId]
    );
    
    // 🔥 Get participants with proper fields
    const [participants] = await db.query(
      `SELECT 
        id,
        member_id,
        member_name,
        member_unique_id,
        group_gcode,
        group_gname,
        created_at
       FROM ppg_meeting_participants 
       WHERE meeting_id = ?
       ORDER BY member_id`,
      [meetingId]
    );
    
    // Get meeting summary
    const [meeting] = await db.query(
      `SELECT * FROM ppg_meetings WHERE id = ?`,
      [meetingId]
    );
    
    res.json({
      success: true,
      meeting_id: meetingId,
      meeting: meeting[0] || null,
      summary: {
        total_demands: demands.length,
        total_participants: participants.length,
        unique_members: demands.length > 0 ? new Set(demands.map(d => d.member_id)).size : 0
      },
      // Show each demand as a separate record
      demands: demands.map(d => ({
        record_id: d.id,
        member_id: d.member_id,
        member_name: d.member_name,
        product: d.product_name,
        quantity: parseFloat(d.quantity),
        unit_price: parseFloat(d.unit_price),
        total: parseFloat(d.total)
      })),
      // Show all participants
      participants: participants.map(p => ({
        participant_id: p.id,
        member_id: p.member_id,
        member_name: p.member_name,
        member_unique_id: p.member_unique_id,
        group: p.group_gname,
        group_code: p.group_gcode
      }))
    });
  } catch (err) {
    console.error('Error fetching demands:', err);
    res.status(500).json({ error: err.message });
  }
});

// ─── GET MEETING DETAILS ─────────────────────────────────────

// server.js - Get complete member demands with all details
app.get('/api/meeting/:id/member-demands', async (req, res) => {
  const { id } = req.params;
  try {
    // Get all demands with full details
    const [demands] = await db.query(
      `SELECT 
        id,
        meeting_id,
        member_id,
        member_name,
        member_unique_id,
        group_gcode,
        group_gname,
        product_id,
        product_name,
        quantity,
        unit_price,
        total,
        created_at
       FROM meeting_member_demands 
       WHERE meeting_id = ?
       ORDER BY member_id, id`,
      [id]
    );
    
    // Group by member with full details
    const groupedByMember = {};
    demands.forEach(d => {
      const key = d.member_id;
      if (!groupedByMember[key]) {
        groupedByMember[key] = {
          member_id: d.member_id,
          member_name: d.member_name,
          member_unique_id: d.member_unique_id,
          group_gcode: d.group_gcode,
          group_gname: d.group_gname,
          total_demands: 0,
          total_amount: 0,
          demands: []
        };
      }
      
      // Add each demand with all details
      groupedByMember[key].demands.push({
        id: d.id,
        product_id: d.product_id,
        product_name: d.product_name,
        quantity: parseFloat(d.quantity),
        unit_price: parseFloat(d.unit_price),
        total: parseFloat(d.total)
      });
      
      groupedByMember[key].total_demands++;
      groupedByMember[key].total_amount += parseFloat(d.total);
    });
    
    res.json({
      success: true,
      meeting_id: id,
      summary: {
        total_members: Object.keys(groupedByMember).length,
        total_demands: demands.length,
        total_amount: demands.reduce((sum, d) => sum + parseFloat(d.total), 0)
      },
      members: Object.values(groupedByMember)
    });
  } catch (err) {
    console.error('Error fetching member demands:', err);
    res.status(500).json({ error: err.message });
  }
});


app.get('/api/ppg/meetings', async (req, res) => {
  const { ppg_id } = req.query;
  try {
    let query = `SELECT pm.*, COUNT(ppm.id) as participant_count,
                 (SELECT COUNT(*) FROM meeting_member_demands WHERE meeting_id = pm.id) as demand_count
                 FROM ppg_meetings pm
                 LEFT JOIN ppg_meeting_participants ppm ON pm.id = ppm.meeting_id`;
    let params = [];
    if (ppg_id) { query += ` WHERE pm.ppg_id = ?`; params.push(ppg_id); }
    query += ` GROUP BY pm.id ORDER BY pm.meeting_date DESC, pm.created_at DESC`;
    const [rows] = await db.query(query, params);
    res.status(200).json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get('/api/meeting/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const [meeting] = await db.query('SELECT * FROM ppg_meetings WHERE id = ?', [id]);
    if (meeting.length === 0) return res.status(404).json({ error: 'Meeting not found' });
    const [participants] = await db.query('SELECT * FROM ppg_meeting_participants WHERE meeting_id = ?', [id]);
    const [memberDemands] = await db.query('SELECT * FROM meeting_member_demands WHERE meeting_id = ?', [id]);
    const [fpoDemands] = await db.query('SELECT * FROM meeting_fpo_demands WHERE meeting_id = ?', [id]);
    const [fpoSupply] = await db.query('SELECT * FROM meeting_fpo_supply WHERE meeting_id = ?', [id]);
    res.json({ meeting: meeting[0], participants, member_demands: memberDemands, fpo_demands: fpoDemands, fpo_supply: fpoSupply });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── TEST APIs ─────────────────────────────────────────────────

app.get('/api/test/ppg-members-all', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM ppg_members');
    res.json({ count: rows.length, data: rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/test/ppg-members/:ppgId', async (req, res) => {
  const { ppgId } = req.params;
  try {
    const [rows] = await db.query('SELECT * FROM ppg_members WHERE ppg_id = ?', [ppgId]);
    res.json({ ppg_id: ppgId, count: rows.length, data: rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Global Error Handler ──────────────────────────────────────
app.use((err, req, res, next) => {
  console.error('❌', err.message);
  res.status(500).json({ error: err.message });
});





const PORT = process.env.PORT || 5030;
app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
  console.log(`📡 Test DB: http://localhost:${PORT}/api/test`);
});