import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { exportPDF, exportDOCX } from '@/lib/api';
import { toast } from 'sonner';

export default function ExportButtons({ resumeId, template }) {
  const [pdfLoading, setPdfLoading] = useState(false);
  const [docxLoading, setDocxLoading] = useState(false);

  const downloadBlob = (data, filename, mimeType) => {
    const blob = new Blob([data], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handlePDF = async () => {
    setPdfLoading(true);
    try {
      const response = await exportPDF({ resumeId, template });
      downloadBlob(response.data, 'resume.pdf', 'application/pdf');
      toast.success('PDF downloaded!');
    } catch (err) {
      toast.error(err?.response?.data?.error || 'Failed to export PDF');
    } finally {
      setPdfLoading(false);
    }
  };

  const handleDOCX = async () => {
    setDocxLoading(true);
    try {
      const response = await exportDOCX({ resumeId });
      downloadBlob(
        response.data,
        'resume.docx',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      );
      toast.success('DOCX downloaded!');
    } catch (err) {
      toast.error(err?.response?.data?.error || 'Failed to export DOCX');
    } finally {
      setDocxLoading(false);
    }
  };

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        onClick={handlePDF}
        disabled={pdfLoading || !resumeId}
        className="text-xs text-slate-400 hover:text-white h-8 cursor-pointer"
      >
        {pdfLoading ? (
          <span className="flex items-center gap-1">
            <span className="animate-spin h-3 w-3 border border-slate-400 border-t-transparent rounded-full" />
            PDF...
          </span>
        ) : (
          '📄 PDF'
        )}
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={handleDOCX}
        disabled={docxLoading || !resumeId}
        className="text-xs text-slate-400 hover:text-white h-8 cursor-pointer"
      >
        {docxLoading ? (
          <span className="flex items-center gap-1">
            <span className="animate-spin h-3 w-3 border border-slate-400 border-t-transparent rounded-full" />
            DOCX...
          </span>
        ) : (
          '📝 DOCX'
        )}
      </Button>
    </>
  );
}
