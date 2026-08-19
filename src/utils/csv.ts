import Papa from 'papaparse';

export function downloadCSV(data: any[], filename: string) {
  const csv = Papa.unparse(data);
  const blob = new Blob([new Uint8Array([0xEF, 0xBB, 0xBF]), csv], { type: 'text/csv;charset=utf-8;' }); // Add BOM for Excel
  const link = document.createElement('a');
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}

export function toCSVString(data: any[]): string {
  return Papa.unparse(data);
}

export function parseCSV<T>(file: File, callback: (data: T[]) => void) {
  Papa.parse(file, {
    header: true,
    skipEmptyLines: true,
    complete: (results) => {
      callback(results.data as T[]);
    },
  });
}

export function parseCSVString<T>(csvString: string): T[] {
  const results = Papa.parse(csvString, {
    header: true,
    skipEmptyLines: true,
  });
  return results.data as T[];
}
