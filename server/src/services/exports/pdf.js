import PDFDocument from 'pdfkit';

export function streamSummaryPdf(summary, res) {
  const filename = sanitizeFilename(summary.title) + '.pdf';
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

  const doc = new PDFDocument({ size: 'A4', margin: 56 });
  doc.pipe(res);

  doc.fontSize(20).text(summary.title, { align: 'left' });
  doc.moveDown(0.5);
  doc
    .fontSize(10)
    .fillColor('#666')
    .text(
      `Type: ${summary.summaryType}   Length: ${summary.length}   Tone: ${summary.tone}   Language: ${summary.language}`,
    );
  doc.text(`Source: ${summary.sourceType}   Created: ${new Date(summary.createdAt).toLocaleString()}`);
  doc.moveDown();
  doc.moveTo(56, doc.y).lineTo(539, doc.y).strokeColor('#ddd').stroke();
  doc.moveDown();

  doc.fillColor('#111').fontSize(12).text(summary.output, { align: 'left', lineGap: 4 });

  doc.end();
}

function sanitizeFilename(name) {
  return (name || 'summary').replace(/[^a-z0-9-_ ]/gi, '_').slice(0, 80) || 'summary';
}
