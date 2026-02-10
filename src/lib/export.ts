/**
 * CSV export utility for admin data.
 */

interface CsvColumn<T> {
  header: string;
  accessor: (item: T) => string | number;
}

export function exportToCsv<T>(
  data: T[],
  columns: CsvColumn<T>[],
  filename: string
): void {
  if (data.length === 0) return;

  const header = columns.map(c => escapeCsvField(c.header)).join(',');
  const rows = data.map(item =>
    columns.map(c => escapeCsvField(String(c.accessor(item)))).join(',')
  );

  const csv = [header, ...rows].join('\n');
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
  downloadBlob(blob, `${filename}.csv`);
}

function escapeCsvField(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
