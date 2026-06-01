export function formatXml(
  registros: Record<string, unknown>[],
  mapeo: Record<string, string>,
  rootTag = 'exportacion',
  itemTag = 'registro',
): Buffer {
  const lines: string[] = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    `<${rootTag}>`,
  ];

  for (const row of registros) {
    lines.push(`  <${itemTag}>`);
    for (const [campo, etiqueta] of Object.entries(mapeo)) {
      const value = escapeXml(String(row[campo] ?? ''));
      lines.push(`    <${etiqueta}>${value}</${etiqueta}>`);
    }
    lines.push(`  </${itemTag}>`);
  }

  lines.push(`</${rootTag}>`);
  return Buffer.from(lines.join('\n'), 'utf-8');
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}
