# Sistema "VERONICA" (Frontend) - La Ruta del Sabor

**Versión:** 1.0 - Core System (POS, KDS & Backoffice)  
**Arquitectura:** Multi-Tenant (SaaS) / Sistema de Franquicias

Este repositorio contiene el código fuente del frontend para el sistema de gestión de restaurantes "VERONICA". Está construido con tecnologías modernas para ofrecer una experiencia de usuario fluida, en tiempo real y de alto rendimiento.

---

##  Módulos Principales

El frontend se divide en tres áreas operativas principales y un completo panel de administración:

1.  **Pantalla de Cocina (KDS - Kitchen Display System):**
    *   **Vistas Avanzadas:** Interfaz para `Tickets`, `Consolidado` de platillos y `Historial`.
    *   **Filtro por Estaciones:** Permite a la cocina filtrar por áreas de preparación (ej. "Bebidas", "Parrilla").
    *   **Visor de Recetas:** Acceso rápido a la ficha técnica de cada producto.
    *   **Pizarra 86:** Gestión en tiempo real de productos agotados.

2.  **Pantalla de Salón (Mozo):**
    *   **Toma de Pedidos:** Flujo optimizado para consumo en `Mesa`, `Para Llevar` y `Delivery`.
    *   **Gestión de Mesas:** Lógica de negocio para prevenir la anulación de pedidos ya entregados.

3.  **Pantalla de Caja (POS - Point of Sale):**
    *   **Gestión de Turnos:** Apertura con fondo base y arqueo de caja al cierre.
    *   **Cobro Avanzado:** Soporte para pagos mixtos y división de cuentas por ítems o monto.
    *   **Sincronización Automática:** Las mesas se liberan automáticamente al registrarse el pago.

4.  **Módulos Administrativos (Backoffice):**
    *   **Dashboard Gerencial:** KPIs, gráficos de tendencias y alertas de stock.
    *   **Gestión de Catálogo y Menú:** CRUD de productos, precios, recetas y fotos.
    *   **Inventario y Kardex:** Auditoría de insumos, costos y stock.
    *   **Finanzas y Rentabilidad:** Reportes de utilidad bruta.
    *   **Gestión de Personal:** Administración de usuarios y roles.

---

## Stack Tecnológico

*   **Framework Principal:** React 19 con Vite
*   **Lenguaje:** TypeScript
*   **Estilos:** Tailwind CSS v4
*   **Gestor de Paquetes:** `pnpm`
*   **Gestor de Estado:** Zustand (con persistencia en `localStorage`)
*   **Comunicaciones:**
    *   **HTTP:** Axios para peticiones a la API REST.
    *   **Tiempo Real:** Server-Sent Events (SSE) para sincronización KDS y notificaciones.
*   **UI/UX:**
    *   **Iconografía:** Lucide React
    *   **Notificaciones:** Sileo

---

##  Cómo Empezar

1.  **Clonar el repositorio:**
    ```bash
    git clone <URL_DEL_REPOSITORIO>
    cd LRDS_Front
    ```

2.  **Instalar dependencias:**
    ```bash
    pnpm install
    ```

3.  **Configurar variables de entorno:**
    Crea un archivo `.env` en la raíz del proyecto y añade las variables necesarias. Por ejemplo:
    ```env
    VITE_API_BASE_URL=http://localhost:8080/api/v1
    VITE_CONSULTAS_PERU_TOKEN=tu_token_aqui
    ```

4.  **Ejecutar el servidor de desarrollo:**
    ```bash
    pnpm dev
    ```

---

##  Filosofía y Guías de Diseño Frontend

Nuestra meta es crear interfaces de usuario que no solo sean funcionales, sino también estéticamente impecables y agradables de usar. Nos inspiramos en los principios de diseño de Emil Kowalski, priorizando la claridad, el espacio y las interacciones de alta gama.

### Tipografía Limpia y Jerarquía Visual
*   **Paleta de Colores:** **Evitar grises planos.** Usamos la paleta `zinc` de Tailwind para añadir profundidad.
    *   **Texto Primario:** `text-zinc-900`
    *   **Texto Secundario:** `text-zinc-600`
    *   **Bordes:** `border-zinc-200`
*   **Jerarquía de Texto:** Usamos la escala de Tailwind para definir claramente títulos, subtítulos y párrafos.

### Espaciado Generoso y Estructurado
*   **Principio de Proximidad:** Elementos relacionados juntos, grupos no relacionados separados.
*   **Evitar Sobrecarga:** No anidar tarjetas innecesariamente. Las interfaces deben respirar.
*   **Consistencia:** `p-6` o `p-8` para contenedores, `space-y-6` para elementos verticales, `gap-6` para rejillas.

### Animaciones y Microinteracciones
*   **Duración y Easing:** Transiciones rápidas (**< 300ms**, típicamente `duration-200`) con `ease-in-out`.
*   **Feedback Inmediato:** Todos los elementos interactivos deben responder visualmente al instante (`hover`, `active`, `focus`). Usamos `hover:scale-105` y `active:scale-95` en botones.

---

##  Estructura de Carpetas

*   `src/`: Código fuente.
    *   `api/`: Módulos de comunicación con el backend.
    *   `components/`: Componentes reutilizables y agnósticos.
    *   `lib/`: Utilidades y helpers.
    *   `pages/`: Vistas principales de cada ruta.
    *   `store/`: Gestión de estado global con Zustand.
    *   `types/`: Definiciones de tipos e interfaces.

---

##  Seguridad y Gestión de Roles (RBAC)

El acceso a las rutas se protege mediante `PrivateRoute.tsx` basado en roles JWT:

*   **`ROLE_SUPER_ADMIN` / `ROLE_ADMIN_EMPRESA` / `ROLE_GERENTE_SEDE`**: Acceso total al Backoffice y permisos de supervisión.
*   **`ROLE_CAJERO`**: Restringido a `/cajero`.
*   **`ROLE_MOZO`**: Restringido a `/mozo`.
*   **`ROLE_COCINA`**: Restringido a `/cocina` (KDS).

---

##  Historial de Actualizaciones Clave

Esta sección resume las optimizaciones y correcciones más importantes que se han implementado.

### Optimizaciones Frontend
*   **Impresión Térmica Premium:** Se mejoró el diseño de los tickets de caja con CSS específico para impresoras de 80mm y tipografías profesionales.
*   **Rendimiento del KDS:** Se optimizó el renderizado de los tickets en la pantalla de cocina usando `React.memo` y `useCallback` para reducir drásticamente el consumo de CPU en tablets.
*   **Accesibilidad (100/100 Lighthouse):** Se añadieron `aria-label` y `title` a todos los elementos interactivos.
*   **Reconexión SSE Silenciosa:** Se implementó un manejador de errores para que la reconexión a los eventos del servidor sea automática y no genere errores en consola.

### Correcciones Críticas (Backend-Related)
*   **Bug de Zona Horaria:** Se corrigió un error que causaba que los pedidos se registraran con 5 horas de adelanto.
*   **Error 403 en Eventos SSE:** Se ajustó la autenticación del endpoint de eventos para permitir la reconexión automática desde el navegador pasando el token por URL.
