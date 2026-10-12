const pool = require('../config/db');
const { success, error } = require('../utils/response');

/* ── Zones ── */
exports.getZones = async (req, res, next) => {
  try {
    const [rows] = await pool.execute(
      `SELECT z.id, z.name_en, z.name_am, z.is_active,
              COUNT(DISTINCT j.id) AS active_jobs
       FROM zones z
       LEFT JOIN jobs j ON j.zone_id = z.id AND j.status = 'published'
       WHERE z.is_active = 1
       GROUP BY z.id ORDER BY z.name_en`
    );
    return success(res, { zones: rows });
  } catch (err) { next(err); }
};

exports.createZone = async (req, res, next) => {
  try {
    const { name_en, name_am } = req.body;
    if (!name_en?.trim()) return error(res, 'English name is required');
    const [r] = await pool.execute(
      'INSERT INTO zones (name_en, name_am) VALUES (?, ?)',
      [name_en.trim(), name_am?.trim() || name_en.trim()]
    );
    return success(res, { id: r.insertId }, 'Zone created', 201);
  } catch (err) { next(err); }
};

exports.updateZone = async (req, res, next) => {
  try {
    const { name_en, name_am, is_active } = req.body;
    await pool.execute(
      `UPDATE zones SET
         name_en   = COALESCE(?, name_en),
         name_am   = COALESCE(?, name_am),
         is_active = COALESCE(?, is_active)
       WHERE id = ?`,
      [name_en?.trim(), name_am?.trim(), is_active ?? null, req.params.id]
    );
    return success(res, {}, 'Zone updated');
  } catch (err) { next(err); }
};

/* ── Woredas ── */
exports.getWoredas = async (req, res, next) => {
  try {
    const zoneId = req.query.zone_id || req.params.zoneId;
    let sql = `SELECT w.id, w.zone_id, w.name_en, w.name_am, w.is_active,
                      z.name_en AS zone_name_en, z.name_am AS zone_name_am
               FROM woredas w JOIN zones z ON z.id = w.zone_id
               WHERE w.is_active = 1`;
    const params = [];
    if (zoneId) { sql += ' AND w.zone_id = ?'; params.push(zoneId); }
    sql += ' ORDER BY w.name_en';
    const [rows] = await pool.execute(sql, params);
    return success(res, { woredas: rows });
  } catch (err) { next(err); }
};

exports.createWoreda = async (req, res, next) => {
  try {
    const { zone_id, name_en, name_am } = req.body;
    if (!zone_id || !name_en?.trim()) return error(res, 'zone_id and name_en are required');
    const [r] = await pool.execute(
      'INSERT INTO woredas (zone_id, name_en, name_am) VALUES (?, ?, ?)',
      [zone_id, name_en.trim(), name_am?.trim() || name_en.trim()]
    );
    return success(res, { id: r.insertId }, 'Woreda created', 201);
  } catch (err) { next(err); }
};

/* ── Cities ── */
exports.getCities = async (req, res, next) => {
  try {
    const { zone_id, woreda_id } = req.query;
    let sql = 'SELECT * FROM cities WHERE is_active = 1';
    const params = [];
    if (zone_id)   { sql += ' AND zone_id = ?';   params.push(zone_id); }
    if (woreda_id) { sql += ' AND woreda_id = ?';  params.push(woreda_id); }
    sql += ' ORDER BY name_en';
    const [rows] = await pool.execute(sql, params);
    return success(res, { cities: rows });
  } catch (err) { next(err); }
};

/* ── Zone with job count tree ── */
exports.getZoneTree = async (req, res, next) => {
  try {
    const [zones] = await pool.execute(
      `SELECT z.id, z.name_en, z.name_am,
              COUNT(DISTINCT j.id) AS active_jobs
       FROM zones z
       LEFT JOIN jobs j ON j.zone_id = z.id AND j.status = 'published'
       WHERE z.is_active = 1
       GROUP BY z.id ORDER BY z.name_en`
    );
    for (const zone of zones) {
      const [woredas] = await pool.execute(
        `SELECT w.id, w.name_en, w.name_am,
                COUNT(DISTINCT j.id) AS active_jobs
         FROM woredas w
         LEFT JOIN jobs j ON j.woreda_id = w.id AND j.status = 'published'
         WHERE w.zone_id = ? AND w.is_active = 1
         GROUP BY w.id ORDER BY w.name_en`,
        [zone.id]
      );
      zone.woredas = woredas;
    }
    return success(res, { zones });
  } catch (err) { next(err); }
};
