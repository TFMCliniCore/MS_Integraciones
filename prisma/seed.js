const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const plantillasEmail = [
  {
    tipo: 'BIENVENIDA',
    nombre: 'Bienvenida a CliniCore',
    asunto: 'Bienvenido/a a {{nombreClinica}}, {{nombreCliente}}',
    cuerpoHtml: `<h1>Bienvenido/a, {{nombreCliente}}</h1><p>Gracias por registrarte en <strong>{{nombreClinica}}</strong>. Tu cuenta ha sido creada exitosamente.</p><p>Si tienes alguna pregunta, no dudes en contactarnos.</p>`,
    cuerpoTexto: 'Bienvenido/a {{nombreCliente}} a {{nombreClinica}}. Tu cuenta ha sido creada exitosamente.',
    variables: ['nombreCliente', 'nombreClinica'],
  },
  {
    tipo: 'CONFIRMACION_CITA',
    nombre: 'Confirmación de cita',
    asunto: 'Confirmación de cita para {{nombreMascota}} — {{fechaCita}}',
    cuerpoHtml: `<h2>Cita confirmada</h2><p>Hola <strong>{{nombreCliente}}</strong>,</p><p>Su cita para <strong>{{nombreMascota}}</strong> ha sido confirmada para el <strong>{{fechaCita}}</strong> a las <strong>{{horaCita}}</strong>.</p><p>Veterinario: {{nombreVeterinario}}</p>`,
    cuerpoTexto: 'Cita confirmada para {{nombreMascota}} el {{fechaCita}} a las {{horaCita}}.',
    variables: ['nombreCliente', 'nombreMascota', 'fechaCita', 'horaCita', 'nombreVeterinario'],
  },
  {
    tipo: 'RECORDATORIO_CITA',
    nombre: 'Recordatorio de cita (24h antes)',
    asunto: 'Recordatorio: mañana tiene cita — {{nombreMascota}}',
    cuerpoHtml: `<h2>Recordatorio de cita</h2><p>Le recordamos que mañana <strong>{{fechaCita}}</strong> a las <strong>{{horaCita}}</strong> tiene cita para <strong>{{nombreMascota}}</strong>.</p>`,
    cuerpoTexto: 'Recordatorio: mañana {{fechaCita}} a las {{horaCita}} tiene cita para {{nombreMascota}}.',
    variables: ['nombreCliente', 'nombreMascota', 'fechaCita', 'horaCita'],
  },
  {
    tipo: 'ALERTA_VACUNA',
    nombre: 'Alerta de vacuna próxima a vencer',
    asunto: 'Vacuna de {{nombreMascota}} próxima a vencer',
    cuerpoHtml: `<h2>Alerta de vacuna</h2><p>La vacuna <strong>{{nombreVacuna}}</strong> de <strong>{{nombreMascota}}</strong> vence el <strong>{{fechaVencimiento}}</strong>. Por favor, agenda una cita pronto.</p>`,
    cuerpoTexto: 'La vacuna {{nombreVacuna}} de {{nombreMascota}} vence el {{fechaVencimiento}}.',
    variables: ['nombreCliente', 'nombreMascota', 'nombreVacuna', 'fechaVencimiento'],
  },
  {
    tipo: 'CANCELACION_CITA',
    nombre: 'Cancelación de cita',
    asunto: 'Cita cancelada: {{nombreMascota}} — {{fechaCita}}',
    cuerpoHtml: `<h2>Cita cancelada</h2><p>Hola <strong>{{nombreCliente}}</strong>,</p><p>Le informamos que la cita de <strong>{{nombreMascota}}</strong> programada para el <strong>{{fechaCita}}</strong> ha sido cancelada.</p><p>Motivo: {{motivo}}</p><p>Para reagendar, comuníquese con nosotros.</p>`,
    cuerpoTexto: 'Cita de {{nombreMascota}} del {{fechaCita}} cancelada. Motivo: {{motivo}}.',
    variables: ['nombreCliente', 'nombreMascota', 'fechaCita', 'motivo'],
  },
  {
    tipo: 'RECUPERACION_PASSWORD',
    nombre: 'Recuperación de contraseña',
    asunto: 'Restablecer tu contraseña — CliniCore',
    cuerpoHtml: `<h2>Recuperación de contraseña</h2><p>Hola <strong>{{nombreUsuario}}</strong>,</p><p>Recibimos una solicitud para restablecer tu contraseña. Usa el siguiente enlace (válido por {{expiracion}}):</p><p><a href="{{enlaceReset}}" style="background:#0070f3;color:#fff;padding:10px 20px;border-radius:5px;text-decoration:none;">Restablecer contraseña</a></p><p>Si no solicitaste esto, ignora este correo.</p>`,
    cuerpoTexto: 'Restablecer contraseña: {{enlaceReset}} (válido {{expiracion}})',
    variables: ['nombreUsuario', 'enlaceReset', 'expiracion'],
  },
  {
    tipo: 'ALERTA_STOCK',
    nombre: 'Alerta de stock bajo',
    asunto: 'Stock bajo: {{nombreProducto}} en {{sucursal}}',
    cuerpoHtml: `<h2>Alerta de inventario</h2><p>El producto <strong>{{nombreProducto}}</strong> en la sucursal <strong>{{sucursal}}</strong> tiene stock bajo.</p><ul><li>Stock actual: <strong>{{stockActual}}</strong></li><li>Stock mínimo: <strong>{{stockMinimo}}</strong></li></ul><p>Por favor, realice un pedido de reposición.</p>`,
    cuerpoTexto: 'Alerta: {{nombreProducto}} en {{sucursal}} tiene stock bajo ({{stockActual}} / mín. {{stockMinimo}}).',
    variables: ['nombreProducto', 'sucursal', 'stockActual', 'stockMinimo'],
  },
  {
    tipo: 'REPORTE_ADJUNTO',
    nombre: 'Reporte adjunto',
    asunto: 'Reporte {{tipoReporte}} — {{fecha}}',
    cuerpoHtml: `<h2>Reporte generado</h2><p>Se adjunta el reporte de <strong>{{tipoReporte}}</strong> generado el <strong>{{fecha}}</strong> para la sucursal <strong>{{sucursal}}</strong>.</p><p>Registros incluidos: <strong>{{totalRegistros}}</strong>.</p>`,
    cuerpoTexto: 'Reporte {{tipoReporte}} del {{fecha}} para {{sucursal}}. Total: {{totalRegistros}} registros.',
    variables: ['tipoReporte', 'fecha', 'sucursal', 'totalRegistros'],
  },
  {
    tipo: 'RESULTADO_CONSULTA',
    nombre: 'Resultado de consulta',
    asunto: 'Resultado de consulta de {{nombreMascota}}',
    cuerpoHtml: `<h2>Resultado de consulta</h2><p>Hola <strong>{{nombreCliente}}</strong>,</p><p>Le compartimos el resultado de la consulta de <strong>{{nombreMascota}}</strong> realizada el <strong>{{fechaConsulta}}</strong> por el Dr./Dra. <strong>{{nombreVeterinario}}</strong>.</p><p>Diagnóstico: {{diagnostico}}</p><p>Para más información, contáctenos.</p>`,
    cuerpoTexto: 'Resultado de consulta de {{nombreMascota}} del {{fechaConsulta}}. Diagnóstico: {{diagnostico}}.',
    variables: ['nombreCliente', 'nombreMascota', 'fechaConsulta', 'nombreVeterinario', 'diagnostico'],
  },
  {
    tipo: 'BACKUP_EXITOSO',
    nombre: 'Notificación de backup exitoso',
    asunto: 'Backup exitoso: {{baseDatos}} — {{fecha}}',
    cuerpoHtml: `<h2>Backup completado</h2><p>El backup de <strong>{{baseDatos}}</strong> se completó exitosamente el <strong>{{fecha}}</strong>.</p><ul><li>Tamaño: {{tamanio}}</li><li>Duración: {{duracion}}</li><li>Ruta: {{ruta}}</li></ul>`,
    cuerpoTexto: 'Backup exitoso de {{baseDatos}} el {{fecha}}. Tamaño: {{tamanio}}.',
    variables: ['baseDatos', 'fecha', 'tamanio', 'duracion', 'ruta'],
  },
  {
    tipo: 'BACKUP_FALLIDO',
    nombre: 'Notificación de backup fallido',
    asunto: '⚠️ Backup FALLIDO: {{baseDatos}} — {{fecha}}',
    cuerpoHtml: `<h2 style="color:red">Backup fallido</h2><p>El backup de <strong>{{baseDatos}}</strong> falló el <strong>{{fecha}}</strong>.</p><p>Error: <code>{{errorDetalle}}</code></p>`,
    cuerpoTexto: 'ALERTA: Backup de {{baseDatos}} falló el {{fecha}}. Error: {{errorDetalle}}.',
    variables: ['baseDatos', 'fecha', 'errorDetalle'],
  },
];

const plantillasWhatsApp = [
  {
    tipo: 'RECORDATORIO_CITA',
    nombre: 'Recordatorio de cita',
    nombreMeta: 'recordatorio_cita_clinicore',
    idioma: 'es',
    parametros: ['nombreCliente', 'nombreMascota', 'fechaCita', 'horaCita'],
  },
  {
    tipo: 'CONFIRMACION_CITA',
    nombre: 'Confirmación de cita',
    nombreMeta: 'confirmacion_cita_clinicore',
    idioma: 'es',
    parametros: ['nombreCliente', 'nombreMascota', 'fechaCita', 'horaCita'],
  },
  {
    tipo: 'ALERTA_VACUNA',
    nombre: 'Alerta de vacuna próxima a vencer',
    nombreMeta: 'alerta_vacuna_clinicore',
    idioma: 'es',
    parametros: ['nombreCliente', 'nombreMascota', 'nombreVacuna', 'fechaVencimiento'],
  },
  {
    tipo: 'RESULTADO_CONSULTA',
    nombre: 'Resultado de consulta',
    nombreMeta: 'resultado_consulta_clinicore',
    idioma: 'es',
    parametros: ['nombreCliente', 'nombreMascota', 'nombreVeterinario'],
  },
  {
    tipo: 'MENSAJE_PERSONALIZADO',
    nombre: 'Mensaje personalizado',
    nombreMeta: 'mensaje_personalizado_clinicore',
    idioma: 'es',
    parametros: ['mensaje'],
  },
];

const plantillasExportacion = [
  {
    nombre: 'Siigo Colombia',
    sistema: 'siigo',
    formato: 'CSV',
    mapeoColumnas: {
      numeroDocumento: 'Número',
      fecha: 'Fecha',
      cliente: 'Tercero',
      nitCedula: 'NIT/Cédula',
      concepto: 'Concepto',
      valor: 'Valor',
      iva: 'IVA',
      total: 'Total',
      metodoPago: 'Forma de pago',
    },
    separador: ',',
    encoding: 'UTF-8',
    incluirCabecera: true,
  },
  {
    nombre: 'World Office',
    sistema: 'world_office',
    formato: 'XML',
    mapeoColumnas: {
      numeroDocumento: 'numero',
      fecha: 'fecha',
      cliente: 'cliente',
      nitCedula: 'nit',
      concepto: 'descripcion',
      valor: 'subtotal',
      iva: 'iva',
      total: 'total',
      metodoPago: 'pago',
    },
    separador: null,
    encoding: 'UTF-8',
    incluirCabecera: true,
  },
  {
    nombre: 'CSV Genérico',
    sistema: 'csv_generico',
    formato: 'CSV',
    mapeoColumnas: {
      numeroDocumento: 'numero_documento',
      fecha: 'fecha',
      cliente: 'cliente',
      nitCedula: 'identificacion',
      concepto: 'concepto',
      valor: 'valor',
      iva: 'iva',
      total: 'total',
      metodoPago: 'metodo_pago',
    },
    separador: ';',
    encoding: 'UTF-8',
    incluirCabecera: true,
  },
];

async function main() {
  for (const p of plantillasEmail) {
    await prisma.plantillaEmail.upsert({
      where: { tipo: p.tipo },
      update: { ...p },
      create: { ...p },
    });
    console.log('PlantillaEmail:', p.tipo);
  }

  for (const p of plantillasWhatsApp) {
    await prisma.plantillaWhatsApp.upsert({
      where: { tipo: p.tipo },
      update: { ...p },
      create: { ...p },
    });
    console.log('PlantillaWhatsApp:', p.tipo);
  }

  for (const p of plantillasExportacion) {
    await prisma.plantillaExportacion.upsert({
      where: { nombre: p.nombre },
      update: { ...p },
      create: { ...p },
    });
    console.log('PlantillaExportacion:', p.nombre);
  }
}

main()
  .then(async () => { await prisma.$disconnect(); })
  .catch(async (error) => {
    console.error('Error ejecutando el seed:', error);
    await prisma.$disconnect();
    process.exit(1);
  });
