import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

export const exportToPDF = async () => {
    const canvasElement = document.querySelector('.canvas') as HTMLElement;
    if (!canvasElement) return;

    try {
        const canvas = await html2canvas(canvasElement, {
            scrollX: 0,
            scrollY: 0,
            width: canvasElement.scrollWidth,
            height: canvasElement.scrollHeight,
            useCORS: true,
            logging: false,
        });

        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF({
            orientation: 'landscape',
            unit: 'px',
            format: [canvas.width, canvas.height]
        });

        pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
        pdf.save('diagram.pdf');

    } catch (error) {
        console.error('PDF Export failed', error);
        alert('Failed to export PDF');
    }
};
