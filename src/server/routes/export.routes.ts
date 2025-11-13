import { Router } from 'express';
import ExcelJS from 'exceljs';
import { db } from '../database/index.js';
import authMiddleware from '../middleware/authMiddleware.js';

const router = Router();

// Protect all export routes
router.use(authMiddleware);

router.get('/doctors', async (req, res) => {
  try {
    const doctors = await db.doctors.find({});

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Doctores');

    // Set up columns
    worksheet.columns = [
      { header: 'Título', key: 'title', width: 10 },
      { header: 'Nombre', key: 'firstName', width: 20 },
      { header: 'Apellido', key: 'lastName', width: 20 },
      { header: 'Email', key: 'email', width: 30 },
      { header: 'Teléfono', key: 'phone', width: 20 },
      { header: 'Dirección', key: 'address', width: 40 },
    ];

    // Add data
    doctors.forEach((doctor) => {
      worksheet.addRow({
        title: doctor.title,
        firstName: doctor.firstName,
        lastName: doctor.lastName,
        email: doctor.email,
        phone: doctor.phone,
        address: doctor.address,
      });
    });

    // Style headers
    worksheet.getRow(1).eachCell((cell) => {
      cell.font = { bold: true };
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFD3D3D3' }, // Light gray
      };
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' },
      };
    });

    // Set response headers
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    res.setHeader('Content-Disposition', 'attachment; filename=' + 'doctores.xlsx');

    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error('Error exporting doctors to Excel:', error);
    res.status(500).json({ error: 'Error al exportar doctores a Excel.' });
  }
});

export default router;
