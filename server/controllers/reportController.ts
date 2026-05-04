import { Request, Response } from 'express';
import pool, { query } from '../db.js';
import { AuthRequest } from '../middleware/authMiddleware.js';

export const saveReport = async (req: AuthRequest, res: Response) => {
  const client = await pool.connect();
  try {
    const { 
      id, // Si viene, es una actualización
      tipo_actividad, bodega_movil_nombre, empresa, estado_geografico, municipio, 
      parroquia, sector, nombre_comuna, comunidades_beneficiadas, comunas, 
      familias, personas, total_proteina, total_frutas, total_hortalizas, 
      total_verduras, total_viveres, latitud, longitud, estado_reporte, 
      guia_sica_estado, guia_sica_foto, datos_formulario, rubros, metodosPago, presenciaEntes, entrepreneurs 
    } = req.body;

    const inspector_id = req.user?.id;

    await client.query('BEGIN');

    let reportId = id;

    const reportSql = id 
      ? `UPDATE reports SET 
            tipo_actividad=$1, bodega_movil_nombre=$2, empresa=$3, estado_geografico=$4, municipio=$5, 
            parroquia=$6, sector=$7, nombre_comuna=$8, comunidades_beneficiadas=$9, comunas=$10, 
            familias=$11, personas=$12, total_proteina=$13, total_frutas=$14, total_hortalizas=$15, 
            total_verduras=$16, total_viveres=$17, latitud=$18, longitud=$19, estado_reporte=$20, 
            guia_sica_estado=$21, guia_sica_foto=$22, datos_formulario=$23 
         WHERE id=$24 RETURNING id`
      : `INSERT INTO reports (
            inspector_id, tipo_actividad, bodega_movil_nombre, empresa, estado_geografico, municipio, 
            parroquia, sector, nombre_comuna, comunidades_beneficiadas, comunas, 
            familias, personas, total_proteina, total_frutas, total_hortalizas, 
            total_verduras, total_viveres, latitud, longitud, estado_reporte, 
            guia_sica_estado, guia_sica_foto, datos_formulario
         ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23) 
         RETURNING id`;

    const reportValues = id 
      ? [tipo_actividad, bodega_movil_nombre, empresa, estado_geografico, municipio, parroquia, sector, nombre_comuna, comunidades_beneficiadas, comunas, familias, personas, total_proteina, total_frutas, total_hortalizas, total_verduras, total_viveres, latitud, longitud, estado_reporte, guia_sica_estado, guia_sica_foto, JSON.stringify(datos_formulario), id]
      : [inspector_id, tipo_actividad, bodega_movil_nombre, empresa, estado_geografico, municipio, parroquia, sector, nombre_comuna, comunidades_beneficiadas, comunas, familias, personas, total_proteina, total_frutas, total_hortalizas, total_verduras, total_viveres, latitud, longitud, estado_reporte, guia_sica_estado, guia_sica_foto, JSON.stringify(datos_formulario)];

    const { rows } = await client.query(reportSql, reportValues);
    reportId = rows[0].id;

    // Si es actualización, limpiamos tablas relacionadas antes de re-insertar
    if (id) {
      await client.query('DELETE FROM report_items WHERE report_id = $1', [reportId]);
      await client.query('DELETE FROM report_payment_methods WHERE report_id = $1', [reportId]);
      await client.query('DELETE FROM report_entrepreneurs WHERE report_id = $1', [reportId]);
    }

    // Insertar Rubros
    if (rubros && rubros.length > 0) {
      for (const item of rubros) {
        await client.query(
          'INSERT INTO report_items (report_id, rubro, empaque, medida, cantidad, precio_unitario) VALUES ($1, $2, $3, $4, $5, $6)',
          [reportId, item.rubro, item.empaque, item.medida, item.cantidad, item.precio || 0]
        );
      }
    }

    // Insertar Métodos de Pago
    if (metodosPago && metodosPago.length > 0) {
      for (const m of metodosPago) {
        await client.query('INSERT INTO report_payment_methods (report_id, metodo) VALUES ($1, $2)', [reportId, m]);
      }
    }

    // Insertar Emprendedores
    if (entrepreneurs && entrepreneurs.length > 0) {
      for (const e of entrepreneurs) {
        await client.query(
          'INSERT INTO report_entrepreneurs (report_id, nombre, actividad, telefono, datos_extras) VALUES ($1, $2, $3, $4, $5)',
          [reportId, e.nombre, e.actividad, e.telefono, JSON.stringify(e.datos_extras)]
        );
      }
    }

    await client.query('COMMIT');
    res.json({ id: reportId, message: 'Reporte guardado correctamente' });

  } catch (error: any) {
    await client.query('ROLLBACK');
    console.error(error);
    res.status(500).json({ error: error.message });
  } finally {
    client.release();
  }
};

export const getReports = async (req: AuthRequest, res: Response) => {
  try {
    let sql = 'SELECT * FROM reports';
    let values: any[] = [];

    // Si es inspector, solo ve los suyos
    if (req.user?.rol === 'INSPECTOR') {
      sql += ' WHERE inspector_id = $1';
      values.push(req.user.id);
    }

    sql += ' ORDER BY created_at DESC';
    const { rows } = await query(sql, values);
    res.json(rows);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const getReportById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    // 1. Obtener reporte principal
    const reportRes = await query('SELECT r.*, p.nombre, p.apellido FROM reports r LEFT JOIN profiles p ON r.inspector_id = p.id WHERE r.id = $1', [id]);
    if (reportRes.rows.length === 0) {
      return res.status(404).json({ error: 'Reporte no encontrado' });
    }
    
    const report = reportRes.rows[0];
    
    // 2. Obtener rubros
    const rubrosRes = await query('SELECT * FROM report_items WHERE report_id = $1', [id]);
    
    // 3. Obtener métodos de pago
    const pagosRes = await query('SELECT * FROM report_payment_methods WHERE report_id = $1', [id]);
    
    // 4. Obtener emprendedores
    const entrepreneursRes = await query('SELECT * FROM report_entrepreneurs WHERE report_id = $1', [id]);

    // Combinar todo en un objeto tipo "datos_formulario" enriquecido o estructura plana
    res.json({
      ...report,
      profiles: { nombre: report.nombre, apellido: report.apellido },
      datos_formulario: {
        ...(report.datos_formulario || {}),
        rubros: rubrosRes.rows.map(r => ({ ...r, precio: r.precio_unitario })),
        metodosPago: pagosRes.rows.map(p => p.metodo),
        entrepreneurs: entrepreneursRes.rows
      }
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const getInspectorReports = async (req: Request, res: Response) => {
  try {
    const { inspectorId } = req.params;
    const { rows } = await query(
      'SELECT id, tipo_actividad, parroquia, fecha, estado_reporte FROM reports WHERE inspector_id = $1 ORDER BY fecha DESC LIMIT 50', 
      [inspectorId]
    );
    res.json(rows);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const deleteReport = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    await query('DELETE FROM reports WHERE id = $1', [id]);
    res.json({ message: 'Reporte eliminado' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

