# 🔌 MS Integraciones y Backups — CliniCore

Microservicio transversal del ecosistema **CliniCore** responsable de toda la comunicación externa: notificaciones por **Email** y **WhatsApp**, generación de enlaces de **videollamada** para telemedicina, **exportación contable** (CSV / XML / JSON) y **backups automáticos** de bases de datos con retención configurable y notificación por email.

## ✨ Características

- ✅ **Email** con proveedores intercambiables: SMTP (nodemailer) o Resend
- ✅ **WhatsApp** con proveedores intercambiables: Twilio o Meta Cloud API directa
- ✅ **Scheduler de WhatsApp** — mensajes programados en memoria con `Map<id, TimeoutRef>`
- ✅ **Videollamadas** — Google Meet (Calendar API) y Zoom (Server-to-Server OAuth)
- ✅ **Exportación contable** — CSV, XML y JSON; mapeo de campos por `PlantillaExportacion`
- ✅ **Backups automáticos** — `pg_dump`, cron evaluado cada hora, subida a S3 opcional, retención y limpieza automática
- ✅ **Idempotencia** — `idempotencyKey` en email y WhatsApp evita envíos duplicados
- ✅ **Reintentos con backoff exponencial** — 1 s → 5 s → 25 s (máx. 3 intentos)
- ✅ **Encriptación AES-256-CBC** de contraseñas en `ConfiguracionBackup`
- ✅ **Log maestro** `IntegracionLog` — registro de cada operación con estado, canal, intentos y duración

## 🛠️ Stack

| Tecnología | Versión | Uso |
| --- | --- | --- |
| NestJS | ^11 | Framework principal |
| Prisma ORM | ^6 | BD propia PostgreSQL |
| PostgreSQL | 16 | Base de datos |
| TypeScript | ^5.7 | Lenguaje |
| nodemailer | ^6.9 | Proveedor SMTP |
| Resend SDK | ^3.2 | Proveedor email en la nube |
| Twilio SDK | ^5.2 | Proveedor WhatsApp |
| Meta Graph API | — | Proveedor WhatsApp alternativo |
| googleapis | ^140 | Google Meet via Calendar API |
| @aws-sdk/client-s3 | ^3.600 | Subida de backups a S3 |
| Handlebars | ^4.7 | Motor de plantillas HTML |
| @nestjs/schedule | ^5 | Cron para backups y métricas |
| Node.js | >= 22 | Runtime |

## ⚙️ Variables de entorno

```bash
cp .env.example .env
```

```env
PORT=3009
DATABASE_URL=postgresql://integraciones_user:secret@localhost:5438/ms_integraciones?schema=public

# Email — proveedor activo: smtp | resend
EMAIL_PROVIDER=smtp
EMAIL_FROM=noreply@clinicore.com
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=correo@gmail.com
SMTP_PASS=app_password
RESEND_API_KEY=re_xxx

# WhatsApp — proveedor activo: twilio | meta
WHATSAPP_PROVIDER=twilio
TWILIO_ACCOUNT_SID=ACxxx
TWILIO_AUTH_TOKEN=xxx
TWILIO_WHATSAPP_FROM=whatsapp:+14155238886
META_PHONE_NUMBER_ID=123
META_ACCESS_TOKEN=EAAxx

# Videollamadas — proveedor activo: google_meet | zoom
VIDEOLLAMADA_PROVIDER=google_meet
MEET_DURACION_MINUTOS=60
GOOGLE_CLIENT_ID=xxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-xxx
GOOGLE_REFRESH_TOKEN=1//xxx
ZOOM_ACCOUNT_ID=xxx
ZOOM_CLIENT_ID=xxx
ZOOM_CLIENT_SECRET=xxx

# Backups
BACKUP_PATH=/backups
BACKUP_ENCRYPT_KEY=clave-de-exactamente-32-caracteres
BACKUP_NOTIFY_EMAILS=admin@clinicore.com
S3_ENABLED=false
S3_BUCKET=clinicore-backups
```

## 🐳 Ejecución con Docker

```bash
docker compose up --build   # construir y levantar
docker compose up -d        # solo levantar
docker compose stop         # parar
docker compose down -v      # detener y borrar volúmenes
```

| Servicio | URL |
| --- | --- |
| API | `http://localhost:3009` |
| PostgreSQL | `localhost:5438` |

## 💻 Ejecución local

```bash
npm install
npx prisma generate
npx prisma db push
npm run prisma:seed
npm run start:dev
```

## 🏗️ Estructura del proyecto

```
ms-integraciones/
├── prisma/
│   ├── schema.prisma               # 6 modelos + BackupLog
│   └── seed.js                     # Plantillas email, WhatsApp y exportación
│
├── src/
│   ├── main.ts                     # Bootstrap puerto 3009, prefijo api/v1
│   ├── app.module.ts               # Módulo raíz
│   │
│   ├── prisma/                     # PrismaService + ExceptionFilter (patrón MS Inventario)
│   │
│   ├── common/
│   │   ├── crypto.util.ts          # AES-256-CBC encrypt/decrypt (contraseñas backup)
│   │   └── retry.util.ts           # retryWithBackoff(fn, 3) — 1s, 5s, 25s
│   │
│   ├── health/
│   │   └── health.controller.ts    # GET /health
│   │
│   ├── email/
│   │   ├── providers/
│   │   │   ├── email-provider.interface.ts
│   │   │   ├── smtp.provider.ts    # nodemailer
│   │   │   └── resend.provider.ts  # Resend SDK
│   │   ├── dto/enviar-email.dto.ts
│   │   ├── email.service.ts        # Handlebars + idempotencia + reintentos
│   │   ├── email.controller.ts     # POST /email/enviar
│   │   └── email.module.ts
│   │
│   ├── whatsapp/
│   │   ├── providers/
│   │   │   ├── whatsapp-provider.interface.ts
│   │   │   ├── twilio.provider.ts
│   │   │   └── meta.provider.ts    # Graph API directa
│   │   ├── dto/enviar-whatsapp.dto.ts
│   │   ├── whatsapp.service.ts     # Idempotencia + reintentos
│   │   ├── whatsapp-scheduler.service.ts  # Map<id,TimeoutRef>
│   │   ├── whatsapp.controller.ts  # POST /enviar | /programar | DELETE /programar/:id
│   │   └── whatsapp.module.ts
│   │
│   ├── videollamada/
│   │   ├── providers/
│   │   │   ├── google-meet.provider.ts   # Calendar API + conferenceData
│   │   │   └── zoom.provider.ts          # Server-to-Server OAuth
│   │   ├── dto/crear-videollamada.dto.ts
│   │   ├── videollamada.service.ts  # Valida tipo=TELEMEDICINA
│   │   ├── videollamada.controller.ts    # POST /videollamada/crear
│   │   └── videollamada.module.ts
│   │
│   ├── exportacion/
│   │   ├── formatters/
│   │   │   ├── csv.formatter.ts
│   │   │   ├── xml.formatter.ts
│   │   │   └── json.formatter.ts
│   │   ├── dto/exportar.dto.ts
│   │   ├── exportacion.service.ts  # Aplica mapeoColumnas, detecta campos faltantes
│   │   ├── exportacion.controller.ts    # POST /exportacion/generar | GET /plantillas
│   │   └── exportacion.module.ts
│   │
│   ├── backups/
│   │   ├── dto/configuracion-backup.dto.ts
│   │   ├── backup.service.ts       # pg_dump + S3 + limpieza + email notificación
│   │   ├── backup-cron.service.ts  # @Cron cada hora — evalúa DIARIO/SEMANAL/MENSUAL
│   │   ├── backups.controller.ts   # GET/POST /configuraciones | POST /forzar | GET /logs
│   │   └── backups.module.ts
│   │
│   ├── logs/
│   │   ├── logs.controller.ts      # GET /logs (paginado) | GET /logs/:id
│   │   └── logs.module.ts
│   │
│   ├── plantillas/
│   │   ├── plantillas.controller.ts # CRUD /plantillas/email | /whatsapp
│   │   └── plantillas.module.ts
│   │
│   └── configuracion-sucursal/
│       ├── configuracion-sucursal.controller.ts  # CRUD por sucursalId
│       └── configuracion-sucursal.module.ts
│
├── postman/
│   ├── MS_Integraciones.postman_collection.json
│   └── MS_Integraciones.postman_environment.json
│
├── docker-compose.yml
├── Dockerfile
├── .env.example
├── package.json
├── tsconfig.json
└── nest-cli.json
```

## 🌐 URL Base

```
http://localhost:3009/api/v1
```

## 📡 Endpoints

### 🔍 Health

| Método | Ruta | Descripción |
| --- | --- | --- |
| GET | `/api/v1/health` | Estado del MS y BD |

### 📧 Email

| Método | Ruta | Body | Descripción |
| --- | --- | --- | --- |
| POST | `/api/v1/email/enviar` | `EnviarEmailDto` | Envía email con plantilla Handlebars + idempotencia |

**`EnviarEmailDto`:**
```json
{
  "to": "cliente@example.com",
  "tipoPlantilla": "CONFIRMACION_CITA",
  "variables": { "nombreCliente": "Ana", "nombreMascota": "Max", "fechaCita": "2026-06-15", "horaCita": "10:00", "nombreVeterinario": "Dr. Pérez" },
  "idempotencyKey": "cita-42-confirm",
  "referenciaId": 42,
  "referenciaTipo": "CITA"
}
```

**Tipos de plantilla de email disponibles:**
`BIENVENIDA` · `CONFIRMACION_CITA` · `RECORDATORIO_CITA` · `ALERTA_VACUNA` · `BACKUP_EXITOSO` · `BACKUP_FALLIDO`

### 💬 WhatsApp

| Método | Ruta | Descripción |
| --- | --- | --- |
| POST | `/api/v1/whatsapp/enviar` | Envía mensaje WhatsApp inmediato |
| POST | `/api/v1/whatsapp/programar` | Programa mensaje para fecha/hora futura |
| DELETE | `/api/v1/whatsapp/programar/:id` | Cancela mensaje programado |
| GET | `/api/v1/whatsapp/programados` | Lista mensajes en espera |

**Tipos de plantilla WA:** `RECORDATORIO_CITA` · `CONFIRMACION_CITA` · `ALERTA_VACUNA` · `RESULTADO_CONSULTA` · `MENSAJE_PERSONALIZADO`

### 📹 Videollamada

| Método | Ruta | Body | Descripción |
| --- | --- | --- | --- |
| POST | `/api/v1/videollamada/crear` | `CrearVideollamadaDto` | Crea sala — solo si `tipoCita = TELEMEDICINA` |

**Respuesta:**
```json
{ "meetUrl": "https://meet.google.com/xxx", "eventId": "...", "expiresAt": "ISO", "proveedor": "google_meet" }
```

### 📊 Exportación contable

| Método | Ruta | Descripción |
| --- | --- | --- |
| GET | `/api/v1/exportacion/plantillas` | Lista plantillas de exportación activas |
| POST | `/api/v1/exportacion/generar` | Genera archivo (CSV/XML/JSON) como descarga |

### 💾 Backups

| Método | Ruta | Descripción |
| --- | --- | --- |
| GET | `/api/v1/backups/configuraciones` | Lista configuraciones de backup (sin contraseñas) |
| POST | `/api/v1/backups/configuraciones` | Crea nueva configuración (contraseña se encripta AES-256) |
| POST | `/api/v1/backups/forzar` | Fuerza backup manual inmediato |
| GET | `/api/v1/backups/logs` | Historial de backups paginado |
| GET | `/api/v1/backups/logs/:id` | Detalle de un backup |

**Frecuencias:** `DIARIO` · `SEMANAL` · `MENSUAL`

### 🗒️ Logs de integración

| Método | Ruta | Query params | Descripción |
| --- | --- | --- | --- |
| GET | `/api/v1/logs` | `page`, `limit`, `tipo`, `canal`, `estado`, `sucursalId` | Historial paginado |
| GET | `/api/v1/logs/:id` | — | Detalle de un log |

**Tipos:** `EMAIL` · `WHATSAPP` · `VIDEOLLAMADA` · `EXPORTACION_CONTABLE` · `BACKUP`

**Estados:** `ENVIADO` · `FALLIDO` · `REINTENTANDO` · `REBOTADO` · `PARCIAL` · `EXITOSO`

### 📋 Plantillas

| Método | Ruta | Descripción |
| --- | --- | --- |
| GET | `/api/v1/plantillas/email` | Lista plantillas de email |
| GET | `/api/v1/plantillas/email/:id` | Detalle de plantilla email |
| POST | `/api/v1/plantillas/email` | Crea plantilla email |
| PATCH | `/api/v1/plantillas/email/:id` | Actualiza plantilla email |
| PATCH | `/api/v1/plantillas/email/:id/toggle` | Activa/desactiva plantilla email |
| GET | `/api/v1/plantillas/whatsapp` | Lista plantillas WhatsApp |
| POST | `/api/v1/plantillas/whatsapp` | Crea plantilla WhatsApp |
| PATCH | `/api/v1/plantillas/whatsapp/:id` | Actualiza plantilla WhatsApp |

### 🏢 Configuración por sucursal

| Método | Ruta | Descripción |
| --- | --- | --- |
| GET | `/api/v1/configuracion-sucursal` | Lista configuraciones de todas las sucursales |
| GET | `/api/v1/configuracion-sucursal/:sucursalId` | Configuración de una sucursal |
| POST | `/api/v1/configuracion-sucursal` | Crea o actualiza (upsert por sucursalId) |
| PUT | `/api/v1/configuracion-sucursal/:sucursalId` | Actualiza configuración |

## 🗄️ Modelos de datos

### IntegracionLog
Log maestro de todas las operaciones: email, WhatsApp, videollamadas, exportaciones.
```
tipo · canal · estado · destinatario · asunto · plantillaId · payload
respuestaProveedor · intentos · idempotencyKey · usuarioId · sucursalId
referenciaId · referenciaTipo · errorDetalle · duracionMs · createdAt
```

### PlantillaEmail
```
tipo (UNIQUE) · nombre · asunto (Handlebars) · cuerpoHtml · cuerpoTexto · variables[] · activa · version
```

### PlantillaWhatsApp
```
tipo (UNIQUE) · nombre · nombreMeta · idioma · parametros[] · activa
```

### ConfiguracionSucursal
```
sucursalId (UNIQUE) · emailRemitente · nombreRemitente · whatsappNumero · videoProveedor · activa
```

### PlantillaExportacion
```
nombre (UNIQUE) · sistema · formato (CSV/XML/JSON) · mapeoColumnas (JSON) · separador · encoding · incluirCabecera · activa
```

### ConfiguracionBackup
```
nombre · host · puerto · nombreBd · usuario · password (AES-256) · frecuencia · retencionDias · backupPath · activo · ultimoBackup
```

### BackupLog
```
configuracionBackupId · baseDatos · tamanioBytes · duracionMs · rutaArchivo · estado · errorDetalle · createdAt
```

## 🌱 Datos iniciales precargados

**Plantillas Email (6):** `BIENVENIDA`, `CONFIRMACION_CITA`, `RECORDATORIO_CITA`, `ALERTA_VACUNA`, `BACKUP_EXITOSO`, `BACKUP_FALLIDO`

**Plantillas WhatsApp (5):** `RECORDATORIO_CITA`, `CONFIRMACION_CITA`, `ALERTA_VACUNA`, `RESULTADO_CONSULTA`, `MENSAJE_PERSONALIZADO`

**Plantillas Exportación (3):** Siigo Colombia (CSV), World Office (XML), CSV Genérico

## 🔒 Seguridad

- Las contraseñas de bases de datos en `ConfiguracionBackup` se almacenan encriptadas con **AES-256-CBC**
- La clave de encriptación se configura con `BACKUP_ENCRYPT_KEY` (debe tener exactamente 32 caracteres efectivos)
- Sin autenticación propia — el JWT se valida en el API Gateway

## ⚡ Idempotencia y reintentos

**Idempotencia:** Si se envía `idempotencyKey` y ya existe un log con ese key en estado `ENVIADO`, el servicio retorna `200` sin reenviar. Si el estado es `FALLIDO`, reintenta.

**Reintentos:** `retryWithBackoff` usa delays de `1s → 5s → 25s`. Máximo 3 intentos para email y WhatsApp.

## 📄 Licencia

MIT License
