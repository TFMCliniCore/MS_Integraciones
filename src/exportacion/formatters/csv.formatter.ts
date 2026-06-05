export function formatCsv(
  registros: Record<string, unknown>[],
  mapeo: Record<string, string>,
  separador: string = ',',
  incluirCabecera: boolean = true,
): Buffer {
  const columnas = Object.keys(mapeo);
  const encabezados = Object.values(mapeo);
  const lines: string[] = [];

  if (incluirCabecera) {
    lines.push(encabezados.map((h) => escapeCsvValue(h)).join(separador));
  }

  for (const row of registros) {
    const values = columnas.map((col) => escapeCsvValue(String(row[col] ?? '')));
    lines.push(values.join(separador));
  }

  return Buffer.from(lines.join('\r\n'), 'utf-8');
}

function escapeCsvValue(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}
