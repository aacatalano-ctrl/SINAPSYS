import { Request, Response } from 'express';
import PDFDocument from 'pdfkit';
import { db } from '../database/index.js';
import type { Payment } from '../../types.js';

export const generateReceipt = async (req: Request, res: Response) => {
  try {
    const { currentUser } = req.body;
    const order = await db.orders.findById(req.params.orderId).populate('doctorId');

    if (!order || !currentUser) {
      return res.status(400).json({ error: 'Faltan datos de la orden o del usuario.' });
    }

    const doc = new PDFDocument({ size: 'A4', margin: 50 });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=recibo-${order.orderNumber}.pdf`);

    doc.pipe(res);

    // Header
    doc.fontSize(20).text('SINAPSIS Laboratorio Dental', { align: 'center' });
    doc.fontSize(12).text('Recibo de Orden', { align: 'center' });
    doc.moveDown(2);

    // Order Info
    doc.fontSize(14).text(`Orden: ${order.orderNumber}`, { continued: true });
    doc.fontSize(12).text(` - Fecha: ${new Date(order.creationDate).toLocaleDateString()}`, { align: 'right' });
    doc.moveDown();
    doc.text(`Paciente: ${order.patientName}`);
    
    let doctorName = 'N/A';
    if (order.doctorId && typeof order.doctorId === 'object' && 'firstName' in order.doctorId) {
      doctorName = `${order.doctorId.firstName} ${order.doctorId.lastName}`;
    }
    doc.text(`Doctor: ${doctorName}`);
    doc.text(`Trabajo: ${order.jobType}`);
    doc.moveDown(2);

    // Financials
    doc.fontSize(16).text('Detalles Financieros', { underline: true });
    doc.moveDown();
    doc.fontSize(12);

    const itemX = 50;
    const descriptionX = 150;
    const amountX = 450;

    // Table Header
    doc.font('Helvetica-Bold');
    doc.text('Fecha', itemX, doc.y);
    doc.text('Descripción', descriptionX, doc.y, { width: 300 });
    doc.text('Monto', amountX, doc.y, { align: 'right' });
    doc.font('Helvetica');
    doc.moveDown();
    const headerY = doc.y;
    doc.lineCap('butt').moveTo(itemX, headerY).lineTo(550, headerY).stroke();
    
    // Table Rows for Payments
    let totalPaid = 0;
    if (order.payments && order.payments.length > 0) {
      order.payments.forEach((payment: Payment) => {
        const y = doc.y;
        totalPaid += payment.amount;
        doc.text(new Date(payment.date).toLocaleDateString(), itemX, y);
        doc.text(payment.description || '', descriptionX, y, { width: 300 });
        doc.text(`${payment.amount.toFixed(2)}`, amountX, y, { align: 'right' });
        doc.moveDown();
      });
    } else {
        doc.text('No hay pagos registrados.', itemX, doc.y);
        doc.moveDown();
    }
    
    const tableBottomY = doc.y;
    doc.lineCap('butt').moveTo(itemX, tableBottomY).lineTo(550, tableBottomY).stroke();
    doc.moveDown();

    // Totals
    doc.font('Helvetica-Bold');
    const totalsY = doc.y;
    doc.text('Costo Total:', descriptionX, totalsY, { align: 'right', width: 200 });
    doc.text(`${order.cost.toFixed(2)}`, amountX, totalsY, { align: 'right' });
    doc.moveDown();
    doc.text('Total Pagado:', descriptionX, doc.y, { align: 'right', width: 200 });
    doc.text(`${totalPaid.toFixed(2)}`, amountX, doc.y, { align: 'right' });
    doc.moveDown();
    doc.text('Saldo Pendiente:', descriptionX, doc.y, { align: 'right', width: 200 });
    doc.text(`${(order.cost - totalPaid).toFixed(2)}`, amountX, doc.y, { align: 'right' });
    doc.font('Helvetica');
    doc.moveDown(3);

    // Footer
    doc.fontSize(10).text(`Recibo generado por: ${currentUser.username}`, { align: 'center' });
    doc.text(`Fecha de generación: ${new Date().toLocaleString()}`, { align: 'center' });

    doc.end();

  } catch (error) {
    console.error('Error al generar el recibo PDF:', error);
    res.status(500).json({ error: 'Error al generar el recibo.' });
  }
};

export const generatePaymentHistoryPDF = async (req: Request, res: Response) => {
  try {
    const { currentUser } = req.body;
    const order = await db.orders.findById(req.params.orderId).populate('doctorId');

    if (!order || !currentUser) {
      return res.status(400).json({ error: 'Faltan datos de la orden o del usuario.' });
    }

    const doc = new PDFDocument({ size: 'A4', margin: 50 });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=historial-pagos-${order.orderNumber}.pdf`);

    doc.pipe(res);

    // Header
    doc.fontSize(20).text('SINAPSIS Laboratorio Dental', { align: 'center' });
    doc.fontSize(12).text('Historial de Pagos', { align: 'center' });
    doc.moveDown(2);

    // Order Info
    doc.fontSize(14).text(`Orden: ${order.orderNumber}`, { continued: true });
    doc.fontSize(12).text(` - Fecha: ${new Date(order.creationDate).toLocaleDateString()}`, { align: 'right' });
    doc.moveDown();
    doc.text(`Paciente: ${order.patientName}`);
    let doctorName = 'N/A';
    if (order.doctorId && typeof order.doctorId === 'object' && 'firstName' in order.doctorId) {
      doctorName = `${order.doctorId.firstName} ${order.doctorId.lastName}`;
    }
    doc.text(`Doctor: ${doctorName}`);
    doc.text(`Trabajo: ${order.jobType}`);
    doc.moveDown(2);

    // Financials
    doc.fontSize(16).text('Historial de Pagos', { underline: true });
    doc.moveDown();
    doc.fontSize(12);

    const itemX = 50;
    const descriptionX = 150;
    const amountX = 450;

    // Table Header
    doc.font('Helvetica-Bold');
    doc.text('Fecha', itemX, doc.y);
    doc.text('Descripción', descriptionX, doc.y, { width: 300 });
    doc.text('Monto', amountX, doc.y, { align: 'right' });
    doc.font('Helvetica');
    doc.moveDown();
    const headerY = doc.y;
    doc.lineCap('butt').moveTo(itemX, headerY).lineTo(550, headerY).stroke();
    
    // Table Rows for Payments
    let totalPaid = 0;
    if (order.payments && order.payments.length > 0) {
      order.payments.forEach((payment: Payment) => {
        const y = doc.y;
        totalPaid += payment.amount;
        doc.text(new Date(payment.date).toLocaleDateString(), itemX, y);
        doc.text(payment.description || '', descriptionX, y, { width: 300 });
        doc.text(`${payment.amount.toFixed(2)}`, amountX, y, { align: 'right' });
        doc.moveDown();
      });
    } else {
        doc.text('No hay pagos registrados.', itemX, doc.y);
        doc.moveDown();
    }
    
    const tableBottomY = doc.y;
    doc.lineCap('butt').moveTo(itemX, tableBottomY).lineTo(550, tableBottomY).stroke();
    doc.moveDown();

    // Totals
    doc.font('Helvetica-Bold');
    const totalsY = doc.y;
    doc.text('Total Pagado:', descriptionX, totalsY, { align: 'right', width: 200 });
    doc.text(`${totalPaid.toFixed(2)}`, amountX, totalsY, { align: 'right' });
    doc.font('Helvetica');
    doc.moveDown(3);

    // Footer
    doc.fontSize(10).text(`Recibo generado por: ${currentUser.username}`, { align: 'center' });
    doc.text(`Fecha de generación: ${new Date().toLocaleString()}`, { align: 'center' });

    doc.end();

  } catch (error) {
    console.error('Error al generar el PDF de historial de pagos:', error);
    res.status(500).json({ error: 'Error al generar el historial de pagos.' });
  }
};
