import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

export const reportService = {
    /**
     * Export data to PDF with a table
     * @param title Report Title
     * @param columns Column headers
     * @param data Array of arrays containing row data
     * @param filename Output filename (without extension)
     */
    exportToPDF: (title: string, columns: string[], data: any[][], filename: string) => {
        const doc = new jsPDF();

        // Add Title
        doc.setFontSize(18);
        doc.text(title, 14, 22);
        doc.setFontSize(11);
        doc.setTextColor(100);
        doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 30);

        // Add Table
        autoTable(doc, {
            head: [columns],
            body: data,
            startY: 40,
            theme: 'grid',
            styles: { fontSize: 8, cellPadding: 2 },
            headStyles: { fillColor: [66, 66, 66] }
        });

        // Save
        doc.save(`${filename}.pdf`);
    },

    /**
     * Export data to Excel
     * @param data Array of objects to export
     * @param sheetName Name of the worksheet
     * @param filename Output filename (without extension)
     */
    exportToExcel: (data: any[], sheetName: string, filename: string) => {
        const worksheet = XLSX.utils.json_to_sheet(data);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
        XLSX.writeFile(workbook, `${filename}.xlsx`);
    },

    /**
     * Generate a simple analytics summary
     */
    generateAnalyticsSummary: (data: any[]) => {
        return {
            totalCount: data.length,
            timestamp: new Date().toISOString()
        };
    }
};
