export function formatJson(
  registros: Record<string, unknown>[],
  mapeo: Record<string, string>,
): Buffer {
  const mapped = registros.map((row) => {
    const obj: Record<string, unknown> = {};
    for (const [campo, etiqueta] of Object.entries(mapeo)) {
      obj[etiqueta] = row[campo] ?? null;
    }
    return obj;
  });

  return Buffer.from(JSON.stringify(mapped, null, 2), 'utf-8');
}
