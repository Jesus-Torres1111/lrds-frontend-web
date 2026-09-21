# ARCHITECTURE & BACKEND MASTER REFERENCE | LA RUTA DEL SABOR (LRDScore)

**Proposito:** Proveer el contexto tecnico absoluto del backend, incluyendo diagramas conceptuales de la base de datos, flujos de negocio, seguridad, tiempo real y un diccionario exhaustivo de endpoints[cite: 3].
**Version del Sistema:** MVP Core System v1.0 (Multi-Tenant SaaS)[cite: 3].

---

## 1. STACK TECNOLOGICO Y NUCLEO
El proyecto esta construido bajo una arquitectura monolitica modular en capas (`Controllers`, `Services`, `Repositories`, `Models`, `Security`)[cite: 3].

*   **Lenguaje & Framework:** Java 21 con Spring Boot 4.0.6 (`webmvc`, `data-jpa`, `security`, `validation`)[cite: 3].
*   **Base de Datos (DB):** PostgreSQL utilizando el driver oficial (`org.postgresql.Driver`) y Hibernate ORM 7.2[cite: 3].
*   **Gestion de Esquemas:** `spring.jpa.hibernate.ddl-auto=none`. La BD se construye estrictamente mediante scripts SQL manuales y versionados (ej. `V10__Implementaciones Prueba.sql`), lo que otorga control total sobre indices y constraints[cite: 3].
*   **Seguridad:** Spring Security 7 + JWT (`io.jsonwebtoken` v0.12.5) usando HMAC-SHA256[cite: 3].
*   **Tiempo Real (Sockets):** Server-Sent Events (SSE) implementado nativamente con `SseEmitter` de Spring[cite: 3].
*   **Reportes:** JasperReports (6.21.2) para tickets termicos `.txt` y Apache POI (5.2.5) para reportes contables `.xlsx`[cite: 3].
*   **Configuracion Global:** La zona horaria se fuerza a `America/Lima` (GMT-5) desde el metodo `main()` (`CoreApplication.java`) y en las configuraciones de Jackson para evitar saltos horarios en la serializacion JSON[cite: 3].

---

## 2. ARQUITECTURA MULTI-TENANT Y MULTI-SEDE
El sistema aloja a multiples empresas (cadenas de restaurantes) y sus respectivas sucursales en una sola base de datos, garantizando aislamiento estricto[cite: 3].

*   **Aislamiento a Nivel de Base de Datos:** Las entidades operativas extienden de la superclase `@MappedSuperclass` llamada `BaseTenantEntity`, la cual inyecta la columna `empresa_id` anotada con `@TenantId`[cite: 3]. Las entidades de sucursal extienden de `BaseSedeEntity`, anadiendo la columna `sede_id`[cite: 3].
*   **Aislamiento en Memoria (`TenantContext`):** Un interceptor (`TenantInterceptor`) lee el JWT en cada peticion HTTP, extrae el `empresaId` y `sedeId`, y los guarda en variables de hilo (`ThreadLocal`)[cite: 3]. Hibernate inyecta automaticamente estos IDs en las clausulas `WHERE` de las consultas SQL (`TenantIdentifierResolver`)[cite: 3].
*   **Modulo 0 (Entitlements):** Las suscripciones limitan el uso de la API. El `ModuloInterceptor` lee anotaciones `@RequiereModulo(Modulo.X)` en los controladores y, si la suscripcion esta vencida o suspendida, rechaza la operacion con `403 Forbidden` (`ModuloNoHabilitadoException`)[cite: 3].

---

## 3. MODELO RELACIONAL Y ENTIDADES (DB)
Las tablas y relaciones se dividen en los siguientes dominios[cite: 3]:

### A. SaaS, Empresas y Usuarios
*   `empresas`: Datos tributarios de la cadena y FK a `suscripcion_vigente_id`[cite: 3].
*   `sedes`: Sucursales fisicas (`sede_id`) pertenecientes a una empresa[cite: 3].
*   `planes` / `suscripciones` / `plan_modulos`: Gestion de licencias y modulos habilitados (`PEDIDOS`, `CAJA`, `KDS`, `FACTURACION`, etc.)[cite: 3].
*   `usuarios`: Credenciales de acceso (`password_hash` con BCrypt) y roles (`RolUsuario`)[cite: 3].
*   `usuario_sedes`: Tabla N:M para asignar a que sedes operativas tiene acceso un Mozo o Cajero. Super admins y Gerentes acceden a nivel cadena[cite: 3].

### B. Catalogo y Control de Inventario
*   `categorias` / `productos`: El menu. El `Producto` tiene un booleano vital: **`es_preparado`**. Determina si va a cocina o se descuenta directamente[cite: 3].
*   `insumos`: Catalogo de materia prima[cite: 3].
*   `insumo_sede`: Inventario Fisico real por sucursal. Maneja `stock_actual`, `stock_minimo`, `stock_reservado` y `costo_unitario` (costo promedio ponderado)[cite: 3].
*   `receta_detalles`: Explosion de insumos para preparar un plato[cite: 3].
*   `kardex_movimientos`: Registro inmutable y de auditoria para cada entrada, salida, merma, ajuste o consumo[cite: 3].

### C. Operativa de Ventas (Salon, Caja y KDS)
*   `pedidos`: Cabecera. Estados: `BORRADOR`, `RECIBIDO`, `EN_PREPARACION`, `LISTO`, `ENTREGADO`, `PAGADO`, `CANCELADO`[cite: 3].
*   `pedidos_detalle`: Items del pedido. Tienen estado propio (`EstadoItem`) y gestionan `numero_comanda` para adiciones tardias. Congela el costo ponderado en `costo_unitario_consumido` al cocinarse[cite: 3].
*   `sesiones_caja`: Turnos de cajeros. Calcula descuadres automaticamente mediante columnas `GENERATED` en PostgreSQL (`diferencia` = `monto_final_declarado` - `monto_final_calculado`)[cite: 3].
*   `transacciones_pago`: Registro de abonos fraccionados (`EFECTIVO`, `YAPE`, `TARJETA`, etc.)[cite: 3].
*   `documentos_cobro` / `documentos_cobro_detalle`: Utilizados para la division de cuentas (Split)[cite: 3].
*   `documentos_venta` / `series_correlativo`: Emision de Boletas/Facturas/Notas de venta con generacion de correlativo atomico SQL[cite: 3].

---

## 4. FLUJOS DE NEGOCIO CORE (COMO FUNCIONA EL BACKEND)

### 4.1. El Ciclo de Vida del Pedido y el Inventario Dual (`PedidoServiceImpl`)
El corazon del sistema es como procesa los inventarios segun el campo `es_preparado`[cite: 3]:
1.  **Creacion:** Se lanza el pedido en `BORRADOR`. No afecta inventarios[cite: 3].
2.  **Confirmacion (`/confirmar`):** El pedido pasa a `RECIBIDO`. 
    *   Si hay platos "preparados", efectua una **Reserva Logica** en la BD (`stock_reservado`) y notifica al KDS[cite: 3].
    *   Si hay platos "directos" (ej. Gaseosas), **consume el stock fisico al instante**, registra la salida en el Kardex y pasan a estado `LISTO`[cite: 3].
3.  **KDS (`/preparando`):** Cuando la cocina acepta el plato, la reserva logica se vuelve **Consumo Real**. Descuenta de `stock_actual`, graba en Kardex y congela el `costo_unitario_consumido` en el detalle del pedido para inmutabilidad de reportes[cite: 3].
4.  **Adicion de items:** Agrega productos a una mesa en curso sumando `+1` a la columna `numero_comanda` para que cocina los identifique como un nuevo envio[cite: 3].

### 4.2. Flujo Financiero, Split y Comprobantes
1.  **Pagos y Split (Modulo 4):** Una mesa se puede pagar entera o generar `documentos_cobro` separados. El backend suma los abonos; cuando el total de abonos iguala al total de la orden, la orden se cierra a `PAGADO`[cite: 3].
2.  **Generacion de Comprobantes:** Usa un `INSERT ... ON CONFLICT DO UPDATE` nativo de PostgreSQL (`DocumentoVentaServiceImpl`) para incrementar atomicamente el correlativo de boletas/facturas, evitando errores en alta concurrencia[cite: 3].

### 4.3. Tiempo Real y Eventos (SSE)
*   `SseEmitterManager`: El backend guarda un mapa concurrente de usuarios conectados (`ConcurrentHashMap`).
*   Los eventos (`NUEVO_PEDIDO`, `PEDIDO_LISTO`) son despachados en milisegundos sin latencia HTTP[cite: 3].
*   `EscalacionScheduler`: Un cron job (`@Scheduled`) de Spring escanea cada 30 segundos si hay platos `EN_PREPARACION` estancados y dispara un `ALERTA_DEMORA` via socket a los administradores[cite: 3].

---

## 5. MAPA ABSOLUTO DE RUTAS (ENDPOINTS API REST)
Todas las peticiones llevan el prefijo global de servidor (ej. `/api/v1` o `/api` segun configuracion)[cite: 3]. El token debe ir en el Header: `Authorization: Bearer <TOKEN>` (salvo excepciones para SSE)[cite: 3].

### 5.1. Autenticacion y Cuentas (`AuthController`, `UsuarioController`)
*   `POST /api/auth/login` -> Validado por BCrypt. Retorna DTO con token, `empresaId`, `sedeId` y un listado de `modulosHabilitados`. *Nota: El token dura 24h, pero para el rol `COCINA` dura 30 dias (`jwt.expiration-cocina`)*[cite: 3].
*   `GET /api/usuarios` -> Lista personal (ADMIN, GERENTE)[cite: 3].
*   `GET /api/usuarios/{id}` -> Detalle[cite: 3].
*   `POST /api/usuarios` -> Crea nuevo staff[cite: 3].
*   `PUT /api/usuarios/{id}` -> Actualiza staff[cite: 3].
*   `PUT /api/usuarios/{id}/password` -> Auto-servicio de cambio[cite: 3].
*   `PUT /api/usuarios/{id}/resetear-password` -> Reseteo forzado[cite: 3].

### 5.2. Catalogo, Inventario y Kardex (`InventarioController`)
*   `GET | POST /api/inventario/categorias` -> Familias[cite: 3].
*   `GET | POST /api/inventario/productos` -> Menu (El `GET` es publico para roles operativos)[cite: 3].
*   `PUT | DELETE /api/inventario/productos/{id}` -> Actualizar / Soft Delete[cite: 3].
*   `GET | POST /api/inventario/insumos` -> Materia Prima[cite: 3].
*   `GET /api/inventario/alertas` -> Insumos en stock critico (< stock minimo)[cite: 3].
*   `GET /api/inventario/recetas/{productoId}` -> Ingredientes por plato (Accesible por COCINA)[cite: 3].
*   `POST /api/inventario/recetas/{productoId}` -> Guardar explosion de materiales[cite: 3].
*   `GET /api/inventario/kardex/{insumoId}` -> Historial de auditoria por insumo[cite: 3].
*   `POST /api/inventario/entradas` -> Registra ingreso y recalcula costo[cite: 3].
*   `POST /api/inventario/mermas` -> Registra merma fisica[cite: 3].
*   `POST /api/inventario/ajustes` -> Regula desvios fisicos de inventario[cite: 3].

### 5.3. Sistema de Pedidos y POS (`PedidoController`)
*   `GET /api/pedidos/activos` -> Lista ordenes que NO estan canceladas o pagadas (Para salon)[cite: 3].
*   `GET /api/pedidos/historial` -> Ordenes finalizadas (Parametros: `?inicio=` & `fin=`)[cite: 3].
*   `GET /api/pedidos/{id}` -> Desglose de factura[cite: 3].
*   `POST /api/pedidos` -> Inicia en BORRADOR (Payload: arreglo de productos y mesa)[cite: 3].
*   `PUT /api/pedidos/{id}/confirmar` -> Traba stock, lanza a cocina (`RECIBIDO`)[cite: 3].
*   `PUT /api/pedidos/{id}/entregar` -> El mozo lo sirve en mesa (`ENTREGADO`)[cite: 3].
*   `POST /api/pedidos/{id}/items` -> Nueva comanda (Anade a cuenta existente)[cite: 3].
*   `PUT /api/pedidos/{id}/items/{detId}/cancelar` -> Anula un item particular. Exige motivo si ya fue procesado[cite: 3].
*   `PUT /api/pedidos/{id}/cancelar` -> Anula pedido total[cite: 3].
*   `PUT /api/pedidos/{id}/descuento` -> Inserta descuento financiero global (`?monto=`)[cite: 3].
*   `POST /api/pedidos/{id}/pagar` -> Payload mixto, cierra mesa y vincula con caja[cite: 3].
*   `GET /api/pedidos/{id}/ticket` -> Retorna `text/plain` mono-espaciado listo para ticketera[cite: 3].

### 5.4. Documentos de Cobro / Split (`PedidoController`)
*   `POST /api/pedidos/{id}/documentos-cobro` -> Crea el Split (`tipo: "ITEMS"` o `tipo: "MONTO"`)[cite: 3].
*   `GET /api/pedidos/{id}/documentos-cobro` -> Lista fracciones[cite: 3].
*   `POST /api/pedidos/documentos-cobro/{docId}/pagar` -> Cancela la fraccion[cite: 3].

### 5.5. Sistema de Monitores de Cocina - KDS (`KdsController`)
*   `GET /api/kds/pendientes` -> Lee la vista `vw_kds_cocina`[cite: 3].
*   `PUT /api/kds/{id}/preparando` -> Inicia receta (`EN_PREPARACION`)[cite: 3].
*   `PUT /api/kds/{id}/listo` -> Finaliza (`LISTO`) y emite socket[cite: 3].
*   `GET /api/kds/eventos` -> Socket SSE (Requiere enviar JWT como param: `?token=XXX`)[cite: 3].
*   `PUT /api/kds/productos/{id}/agotado-temporal` -> Pizarra 86 manual[cite: 3].
*   `PUT /api/kds/productos/{id}/agotado-servicio` -> Pizarra 86 permanente del turno[cite: 3].
*   `GET /api/kds/productos/porciones` -> Proyeccion de platos restantes[cite: 3].

### 5.6. Operaciones de Caja (`CajaController`)
*   `POST /api/caja/abrir` -> Abre el dia (`monto_inicial`)[cite: 3].
*   `GET /api/caja/activa` -> Verifica si hay sesion actual del cajero[cite: 3].
*   `PUT /api/caja/cerrar/{id}` -> Finaliza el turno, inyecta `monto_final_declarado` y dispara un evento interno que resetea todos los "Agotado por Servicio" a "Disponibles"[cite: 3].

### 5.7. Documentos Tributarios (`DocumentoVentaController`)
*   `POST /api/documentos-venta` -> Emite Comprobante[cite: 3].
*   `PUT /api/documentos-venta/{id}/anular` -> Requiere motivo de baja de SUNAT[cite: 3].

### 5.8. Analitica y KPI (`ReporteController`)
*   `GET /api/reportes/dashboard` -> Resumen macroeconomico y metricas Top Ventas[cite: 3].
*   `GET /api/reportes/margen` -> Utilidad cruzando precios de venta contra el snapshot de costo de Kardex[cite: 3].
*   `GET /api/reportes/excel` -> Responde un `byte[]` tipo XLS con volcado total[cite: 3].

### 5.9. API Inteligencia Artificial (`AiIntegrationController`)
*   `/api/ai/*` -> Controladores preparados/vacios. Integracion futura deshabilitada por default via `ai.module.enabled=false`[cite: 3].

---

## 6. NOTAS PARA EL AGENTE DE IA (DEV RULES)
1.  **Deteccion DTO/Entity:** El backend esta altamente mapeado con Request/Response DTOs (`com.rutadelsabor.core.dto.*`). Al comunicarte desde React, respeta la carga util (ej. arreglos anidados para comandas e IDs explicitos)[cite: 3].
2.  **Manejo de Errores Global:** La clase `GlobalExceptionHandler` convierte errores nativos (`StockInsuficienteException`, `ReglaNegocioException`) en un JSON estructurado (`ErrorResponseDTO`) con formato `{ timestamp, status, error, message, codigo, path }`[cite: 3]. Capturalo siempre con `.catch(err => err.response?.data?.message)`.
3.  **Seguridad y CORS:** El backend en Spring Boot permite acceso CORS de `localhost` en desarrollo. Si hay problemas de CORS con una API externa (ej. DNI/RUC), la regla arquitectonica de este proyecto es que **debes pasar dicha consulta a traves del Proxy Server de Vite (`vite.config.ts`)** en el Frontend, en lugar de ensuciar el Backend de Java con controladores innecesarios[cite: 3].