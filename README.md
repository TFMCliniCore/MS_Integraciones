# MS Integraciones y Backups

Microservicio transversal del ecosistema CliniCore responsable de toda la comunicacion externa del sistema:

- Envio de emails con plantillas Handlebars (SMTP o Resend)
- Mensajeria WhatsApp con mensajes programados (Twilio o Meta Cloud API)
- Generacion de enlaces de videollamada para citas de telemedicina (Google Meet o Zoom)
- Exportacion contable a CSV, XML y JSON con mapeo de campos por plantilla
- Backups automaticos de bases de datos con pg_dump, subida opcional a S3, retencion configurable y notificacion por email
- Log maestro de todas las operaciones con estado, canal, intentos y duracion


## Stack

- NestJS
- Prisma ORM
- PostgreSQL 16
- Docker / Docker Compose
- TypeScript
- nodemailer + Resend SDK
- Twilio SDK + Meta Graph API
- googleapis (Calendar API)
- @aws-sdk/client-s3
- Handlebars
- @nestjs/schedule


## Dependencias externas

| Servicio | Rol |
| --- | --- |
| `ms-entidades-core` | Validacion de numeros de cliente antes de enviar WhatsApp |

La URL del microservicio externo se configura con la variable de entorno `MS_ENTIDADES_URL`.


## Variables de entorno

```env
PORT=3009
POSTGRES_USER=postgres
POSTGRES_PASSWORD=
POSTGRES_DB=ms_integraciones
POSTGRES_PORT=5438
DATABASE_URL=postgresql://integraciones_user:MS_1nt3gr4c10nes@localhost:5438/ms_integraciones?schema=public

EMAIL_PROVIDER=smtp
EMAIL_FROM=noreply@clinicore.com
EMAIL_FROM_NAME=CliniCore
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=
SMTP_PASS=
RESEND_API_KEY=

WHATSAPP_PROVIDER=twilio
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_WHATSAPP_FROM=whatsapp:+14155238886
META_PHONE_NUMBER_ID=
META_ACCESS_TOKEN=

VIDEOLLAMADA_PROVIDER=google_meet
MEET_DURACION_MINUTOS=60
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_REFRESH_TOKEN=
GOOGLE_CALENDAR_ID=primary
ZOOM_ACCOUNT_ID=
ZOOM_CLIENT_ID=
ZOOM_CLIENT_SECRET=

BACKUP_PATH=/backups
BACKUP_ENCRYPT_KEY=CliniCore-AES256-Key-32chars!!!!
BACKUP_NOTIFY_EMAILS=admin@clinicore.com
S3_ENABLED=false
S3_BUCKET=clinicore-backups
S3_REGION=us-east-1
S3_ENDPOINT=
S3_ACCESS_KEY=
S3_SECRET_KEY=

MS_ENTIDADES_URL=http://host.docker.internal:3001/api/v1
```

Variables principales:

- `EMAIL_PROVIDER`: proveedor de email activo, `smtp` o `resend`.
- `WHATSAPP_PROVIDER`: proveedor de WhatsApp activo, `twilio` o `meta`.
- `VIDEOLLAMADA_PROVIDER`: proveedor de videollamadas, `google_meet` o `zoom`.
- `BACKUP_ENCRYPT_KEY`: clave AES-256 para encriptar passwords de BD en `ConfiguracionBackup`.
- `BACKUP_NOTIFY_EMAILS`: lista de emails separados por coma que reciben notificaciones de backup.
- `S3_ENABLED`: si es `true`, los backups se suben al bucket S3 configurado ademas de guardarse localmente.
- `DATABASE_URL`: cadena de conexion usada por Prisma.


## Ejecucion con Docker

```bash
docker compose up --build
```

Servicios disponibles:

- API: `http://<URL_SERVIDOR>:<PUERTO>`
- PostgreSQL: `<URL_SERVIDOR>:<PUERTO_POSTGRES>`

Ejemplo para desarrollo:

- API: `http://localhost:3009`
- PostgreSQL: `localhost:5438`

Al iniciar el contenedor de la API se ejecutan:

1. `prisma db push` — sincroniza el schema con la base de datos
2. Seed con plantillas de email, WhatsApp y exportacion
3. Arranque del servidor NestJS en el puerto configurado

Parar contenedor:

```bash
docker compose stop
```

Detener contenedor y borrar volumenes:

```bash
docker compose down -v
```

Reconstruir contenedor:

```bash
docker compose up --build
```


## Ejecucion local

```bash
npm install
npx prisma generate
npx prisma db push
npm run prisma:seed
npm run start:dev
```

Comandos utiles:

```bash
npm run build
npm run start
npm run start:dev
npm run start:prod
npm run prisma:generate
npm run prisma:migrate:dev
npm run prisma:migrate:deploy
npm run prisma:seed
```


## Estructura principal

```text
src/
  app.module.ts
  main.ts
  common/
    crypto.util.ts          (AES-256-CBC encrypt/decrypt para passwords de backup)
    retry.util.ts           (retryWithBackoff — delays 1s, 5s, 25s)
  prisma/
    prisma.module.ts
    prisma.service.ts
    prisma-client-exception.filter.ts
  health/
    health.controller.ts
  email/
    dto/
      enviar-email.dto.ts
    providers/
      email-provider.interface.ts
      smtp.provider.ts
      resend.provider.ts
    email.controller.ts
    email.module.ts
    email.service.ts
  whatsapp/
    dto/
      enviar-whatsapp.dto.ts
    providers/
      whatsapp-provider.interface.ts
      twilio.provider.ts
      meta.provider.ts
    whatsapp.controller.ts
    whatsapp.module.ts
    whatsapp.service.ts
    whatsapp-scheduler.service.ts
  videollamada/
    dto/
      crear-videollamada.dto.ts
    providers/
      google-meet.provider.ts
      zoom.provider.ts
    videollamada.controller.ts
    videollamada.module.ts
    videollamada.service.ts
  exportacion/
    dto/
      exportar.dto.ts
    formatters/
      csv.formatter.ts
      xml.formatter.ts
      json.formatter.ts
    exportacion.controller.ts
    exportacion.module.ts
    exportacion.service.ts
  backups/
    dto/
      configuracion-backup.dto.ts
    backup.service.ts
    backup-cron.service.ts
    backups.controller.ts
    backups.module.ts
  logs/
    logs.controller.ts
    logs.module.ts
  plantillas/
    plantillas.controller.ts
    plantillas.module.ts
  configuracion-sucursal/
    configuracion-sucursal.controller.ts
    configuracion-sucursal.module.ts
prisma/
  schema.prisma
  seed.js
postman/
  MS_Integraciones.postman_collection.json
```


## Datos iniciales precargados

El seed crea registros iniciales para:

- 11 plantillas de email:
  - BIENVENIDA
  - CONFIRMACION_CITA
  - RECORDATORIO_CITA
  - ALERTA_VACUNA
  - CANCELACION_CITA
  - RECUPERACION_PASSWORD
  - ALERTA_STOCK
  - REPORTE_ADJUNTO
  - RESULTADO_CONSULTA
  - BACKUP_EXITOSO
  - BACKUP_FALLIDO

- 5 plantillas de WhatsApp:
  - RECORDATORIO_CITA
  - CONFIRMACION_CITA
  - ALERTA_VACUNA
  - RESULTADO_CONSULTA
  - MENSAJE_PERSONALIZADO

- 3 plantillas de exportacion:
  - Siigo Colombia (CSV, separador coma)
  - World Office (XML)
  - CSV Generico (CSV, separador punto y coma)

El seed usa `upsert` por `tipo` o `nombre`, por lo que es idempotente y puede ejecutarse multiples veces sin duplicar registros.


## URL Base

```text
http://<URL_SERVIDOR>:<puerto>/api/v1
```

La variable `baseUrl` ya viene configurada como (para pruebas en desarrollo):

```text
http://localhost:3009/api/v1
```

Todas las rutas usan el prefijo base `/api/v1`.


## Tabla de endpoints

### Health

| Metodo | Ruta | Descripcion |
| --- | --- | --- |
| GET | `/api/v1/health` | Estado del MS y conexion a la base de datos |

---

### Email

| Metodo | Ruta | Descripcion |
| --- | --- | --- |
| POST | `/api/v1/integraciones/email/enviar` | Envia email usando plantilla Handlebars con idempotencia y reintentos |
| POST | `/api/v1/integraciones/email/masivo` | Envio masivo a multiples destinatarios (maximo 100 por llamada) |
| GET | `/api/v1/integraciones/email/plantillas` | Lista plantillas de email activas |
| GET | `/api/v1/integraciones/email/plantillas/:tipo` | Detalle de una plantilla por tipo |
| PUT | `/api/v1/integraciones/email/plantillas/:tipo` | Actualiza el asunto o cuerpo de una plantilla |

---

### WhatsApp

| Metodo | Ruta | Descripcion |
| --- | --- | --- |
| POST | `/api/v1/integraciones/whatsapp/enviar` | Envia mensaje WhatsApp inmediato con plantilla Meta aprobada |
| POST | `/api/v1/integraciones/whatsapp/programar` | Programa un mensaje para enviarse en fecha y hora futura |
| DELETE | `/api/v1/integraciones/whatsapp/programar/:id` | Cancela un mensaje programado pendiente |
| GET | `/api/v1/integraciones/whatsapp/programados` | Lista los IDs de mensajes programados en memoria |
| GET | `/api/v1/integraciones/whatsapp/plantillas` | Lista plantillas de WhatsApp activas |

---

### Videollamadas

| Metodo | Ruta | Descripcion |
| --- | --- | --- |
| POST | `/api/v1/integraciones/videollamada/crear` | Genera enlace de videollamada para una cita de tipo TELEMEDICINA |
| DELETE | `/api/v1/integraciones/videollamada/:citaId` | Cancela la sala de videollamada asociada a una cita |

---

### Exportacion Contable

| Metodo | Ruta | Descripcion |
| --- | --- | --- |
| GET | `/api/v1/integraciones/exportacion/plantillas` | Lista plantillas de exportacion disponibles |
| POST | `/api/v1/integraciones/exportacion/generar` | Genera archivo CSV, XML o JSON como buffer descargable |

---

### Backups

| Metodo | Ruta | Descripcion |
| --- | --- | --- |
| GET | `/api/v1/integraciones/backups/configuraciones` | Lista configuraciones de backup (sin contraseñas) |
| POST | `/api/v1/integraciones/backups/configuraciones` | Crea una configuracion de backup (password se encripta AES-256) |
| PUT | `/api/v1/integraciones/backups/configuraciones/:id` | Actualiza una configuracion de backup |
| POST | `/api/v1/integraciones/backups/ejecutar/:id` | Fuerza un backup manual (solo SUPERADMIN) |
| POST | `/api/v1/integraciones/backups/forzar` | Fuerza un backup manual por body `{ configuracionId }` |
| GET | `/api/v1/integraciones/backups/logs` | Historial de backups paginado |
| GET | `/api/v1/integraciones/backups/logs/:id` | Detalle de un backup especifico |

---

### Logs de Integracion

| Metodo | Ruta | Descripcion |
| --- | --- | --- |
| GET | `/api/v1/integraciones/logs` | Historial paginado de todas las operaciones |
| GET | `/api/v1/integraciones/logs/:id` | Detalle de una operacion especifica |

#### Filtros disponibles en GET `/api/v1/integraciones/logs`

| Query param | Tipo | Descripcion |
| --- | --- | --- |
| `page` | number | Numero de pagina (por defecto 1) |
| `limit` | number | Registros por pagina (por defecto 20) |
| `tipo` | string | `EMAIL`, `WHATSAPP`, `VIDEOLLAMADA`, `EXPORTACION_CONTABLE`, `BACKUP` |
| `canal` | string | `smtp`, `resend`, `twilio`, `meta`, `google_meet`, `zoom`, `s3`, `local` |
| `estado` | string | `ENVIADO`, `FALLIDO`, `REINTENTANDO`, `REBOTADO`, `PARCIAL`, `EXITOSO` |
| `sucursalId` | number | Filtra por sucursal |

---

### Plantillas

| Metodo | Ruta | Descripcion |
| --- | --- | --- |
| GET | `/api/v1/integraciones/plantillas/email` | Lista todas las plantillas de email |
| GET | `/api/v1/integraciones/plantillas/email/:id` | Detalle de plantilla email por id |
| POST | `/api/v1/integraciones/plantillas/email` | Crea una nueva plantilla de email |
| PATCH | `/api/v1/integraciones/plantillas/email/:id` | Actualiza campos de una plantilla email |
| PATCH | `/api/v1/integraciones/plantillas/email/:id/toggle` | Activa o desactiva una plantilla |
| GET | `/api/v1/integraciones/plantillas/whatsapp` | Lista todas las plantillas de WhatsApp |
| GET | `/api/v1/integraciones/plantillas/whatsapp/:id` | Detalle de plantilla WhatsApp por id |
| POST | `/api/v1/integraciones/plantillas/whatsapp` | Crea una nueva plantilla de WhatsApp |
| PATCH | `/api/v1/integraciones/plantillas/whatsapp/:id` | Actualiza campos de una plantilla WhatsApp |

---

### Configuracion por Sucursal

| Metodo | Ruta | Descripcion |
| --- | --- | --- |
| GET | `/api/v1/integraciones/configuracion-sucursal` | Lista configuraciones de todas las sucursales |
| GET | `/api/v1/integraciones/configuracion-sucursal/:sucursalId` | Configuracion de una sucursal especifica |
| POST | `/api/v1/integraciones/configuracion-sucursal` | Crea o actualiza configuracion de sucursal (upsert) |
| PUT | `/api/v1/integraciones/configuracion-sucursal/:sucursalId` | Actualiza configuracion de una sucursal |


## Reglas de negocio

### Email

- El proveedor activo se elige con `EMAIL_PROVIDER=smtp|resend`. Ambos providers se registran al arrancar pero el cliente Resend se inicializa de forma lazy para no fallar al arrancar sin API key.
- Si se envía `idempotencyKey` y existe un log con ese key en estado `ENVIADO`, retorna `200` sin reenviar.
- Si el estado del log existente es `FALLIDO`, reintenta.
- Reintentos con backoff exponencial: 1 s, 5 s, 25 s. Maximo 3 intentos.

### WhatsApp

- El proveedor activo se elige con `WHATSAPP_PROVIDER=twilio|meta`.
- Los mensajes programados se guardan en memoria con `Map<id, TimeoutRef>`. Se pierden si el proceso reinicia.
- Solo se pueden enviar mensajes con plantillas aprobadas registradas en `PlantillaWhatsApp`.
- Misma logica de idempotencia y reintentos que email.

### Videollamadas

- Solo se puede generar enlace para citas con `tipoCita = TELEMEDICINA`. Si el tipo es diferente, el servicio responde con `422 Unprocessable Entity`.
- El enlace tiene una duracion maxima configurable con `MEET_DURACION_MINUTOS` (por defecto 60).
- Este MS genera y retorna la URL pero no la persiste. El llamador (MS Agenda) es responsable de guardarla en la cita.

### Exportacion contable

- Los formatos soportados son `CSV`, `XML` y `JSON`. El formato se determina por la `PlantillaExportacion`.
- Si algun campo requerido por la plantilla no esta en los datos fuente, la exportacion se marca como `PARCIAL` y los campos faltantes se retornan en el header `X-Campos-Faltantes`.
- El archivo se retorna como buffer descargable con el `Content-Type` correcto.

### Backups

- El cron evalua cada hora que `ConfiguracionBackup` debe ejecutarse segun su `frecuencia` y `ultimoBackup`.
- `DIARIO`: se ejecuta a las 2:00 AM si no se ha ejecutado en las ultimas 24h.
- `SEMANAL`: se ejecuta los domingos a las 3:00 AM si no se ha ejecutado en los ultimos 7 dias.
- `MENSUAL`: se ejecuta el dia 1 de cada mes a las 4:00 AM si no se ha ejecutado en los ultimos 28 dias.
- Las contraseñas de las bases de datos se almacenan encriptadas con AES-256-CBC.
- Al finalizar cada backup se envia notificacion por email a `BACKUP_NOTIFY_EMAILS`.
- Los backups cuya fecha de creacion supera `retencionDias` se eliminan automaticamente.


## Ejemplos de payload

### Enviar email con plantilla

```json
{
  "to": "cliente@example.com",
  "tipoPlantilla": "CONFIRMACION_CITA",
  "variables": {
    "nombreCliente": "Ana Gomez",
    "nombreMascota": "Max",
    "fechaCita": "2026-06-15",
    "horaCita": "10:30",
    "nombreVeterinario": "Dr. Perez"
  },
  "idempotencyKey": "cita-42-confirmacion",
  "referenciaId": 42,
  "referenciaTipo": "CITA"
}
```

### Enviar email masivo

```json
{
  "tipoPlantilla": "ALERTA_VACUNA",
  "destinatarios": [
    {
      "to": "cliente1@example.com",
      "variables": { "nombreCliente": "Ana", "nombreMascota": "Max", "nombreVacuna": "Rabia", "fechaVencimiento": "2026-07-01" }
    },
    {
      "to": "cliente2@example.com",
      "variables": { "nombreCliente": "Luis", "nombreMascota": "Luna", "nombreVacuna": "Parvovirus", "fechaVencimiento": "2026-07-10" }
    }
  ]
}
```

### Enviar WhatsApp inmediato

```json
{
  "to": "+573001234567",
  "tipoPlantilla": "RECORDATORIO_CITA",
  "parametros": {
    "nombreCliente": "Ana",
    "nombreMascota": "Max",
    "fechaCita": "15 de junio",
    "horaCita": "10:30"
  },
  "idempotencyKey": "cita-42-wa-recordatorio",
  "referenciaId": 42,
  "referenciaTipo": "CITA"
}
```

### Programar mensaje WhatsApp

```json
{
  "to": "+573001234567",
  "tipoPlantilla": "RECORDATORIO_CITA",
  "parametros": {
    "nombreCliente": "Ana",
    "nombreMascota": "Max",
    "fechaCita": "16 de junio",
    "horaCita": "10:30"
  },
  "programadoPara": "2026-06-15T10:30:00.000Z"
}
```

### Crear sala de videollamada

```json
{
  "citaId": 42,
  "tipoCita": "TELEMEDICINA",
  "titulo": "Consulta telemedicina — Max",
  "sucursalId": 1,
  "duracionMinutos": 30
}
```

### Generar exportacion contable

```json
{
  "nombrePlantilla": "Siigo Colombia",
  "datos": [
    {
      "numeroDocumento": "FV-001",
      "fecha": "2026-06-01",
      "cliente": "Ana Gomez",
      "nitCedula": "1234567890",
      "concepto": "Consulta veterinaria",
      "valor": 80000,
      "iva": 0,
      "total": 80000,
      "metodoPago": "efectivo"
    }
  ],
  "desde": "2026-06-01",
  "hasta": "2026-06-30",
  "sucursalId": 1
}
```

### Crear configuracion de backup

```json
{
  "nombre": "MS Entidades Core",
  "host": "host.docker.internal",
  "puerto": 5432,
  "nombreBd": "ms_entidades_core",
  "usuario": "entidades_user",
  "password": "contrasena_segura",
  "frecuencia": "DIARIO",
  "retencionDias": 7
}
```

### Forzar backup manual

```json
{
  "configuracionId": 1
}
```


## Modelo de datos principal

### IntegracionLog

```text
id
tipo               (EMAIL / WHATSAPP / VIDEOLLAMADA / EXPORTACION_CONTABLE / BACKUP)
canal              (smtp / resend / twilio / meta / google_meet / zoom / s3 / local)
estado             (ENVIADO / FALLIDO / REINTENTANDO / REBOTADO / PARCIAL / EXITOSO)
destinatario
asunto
plantillaId
payload            (Json)
respuestaProveedor
intentos
idempotencyKey     (UNIQUE)
usuarioId
sucursalId
referenciaId
referenciaTipo
errorDetalle
duracionMs
createdAt
```

### PlantillaEmail

```text
id
tipo               (UNIQUE)
nombre
asunto             (Handlebars)
cuerpoHtml
cuerpoTexto
variables[]
activa
version
createdAt
updatedAt
```

### PlantillaWhatsApp

```text
id
tipo               (UNIQUE)
nombre
nombreMeta         (nombre del template aprobado en Meta, snake_case)
idioma
parametros[]
activa
createdAt
```

### ConfiguracionSucursal

```text
id
sucursalId         (UNIQUE)
emailRemitente
nombreRemitente
whatsappNumero
videoProveedor
activa
createdAt
updatedAt
```

### PlantillaExportacion

```text
id
nombre             (UNIQUE)
sistema
formato            (CSV / XML / JSON)
mapeoColumnas      (Json)
separador
encoding
incluirCabecera
activa
createdAt
updatedAt
```

### ConfiguracionBackup

```text
id
nombre
host
puerto
nombreBd
usuario
password           (almacenada encriptada con AES-256-CBC)
frecuencia         (DIARIO / SEMANAL / MENSUAL)
retencionDias
backupPath
s3Bucket
s3Prefijo
activo
ultimoBackup
createdAt
updatedAt
logs[]
```

### BackupLog

```text
id
configuracionBackupId
baseDatos
tamanioBytes
duracionMs
rutaArchivo
s3Url
estado             (EXITOSO / FALLIDO / EN_PROCESO)
errorDetalle
disparadoPor       (CRON / MANUAL)
usuarioId
createdAt
```


## Validaciones y errores

La API usa `ValidationPipe` global con:

- `whitelist: true`
- `transform: true`
- `forbidNonWhitelisted: true`

Errores de Prisma manejados globalmente:

| Codigo Prisma | Respuesta HTTP | Descripcion |
| --- | --- | --- |
| `P2002` | 409 Conflict | Ya existe un registro con un valor unico repetido |
| `P2025` | 404 Not Found | El registro solicitado no existe |
| `P2003` | 400 Bad Request | La operacion viola una relacion requerida |


## Notas

- No se implemento autenticacion en este microservicio. El JWT se valida en el API Gateway.
- Los mensajes WhatsApp programados se guardan en memoria. Si el contenedor reinicia, los mensajes pendientes se pierden.
- Para entornos de produccion se recomienda persistir los mensajes programados en base de datos antes de usar la funcion de programacion.
- El proveedor de email Resend se inicializa de forma lazy para permitir arrancar el MS sin la API key configurada cuando el proveedor activo es SMTP.
- Las contraseñas de `ConfiguracionBackup` se encriptan al guardar y se desencriptan solo al ejecutar el backup. Nunca se exponen en los endpoints de listado.
