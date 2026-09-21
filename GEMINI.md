# Guía de Arquitectura y Diseño del Proyecto LRDS_Front

Este documento es la referencia central para la arquitectura técnica, la filosofía de diseño y las convenciones de codificación del proyecto.

---

## 1. Stack Tecnológico

*   **Framework Principal:** React con Vite
*   **Lenguaje:** TypeScript
*   **Estilos:** Tailwind CSS
*   **Gestor de Paquetes:** pnpm

---

## 2. Filosofía y Reglas de Diseño Frontend

Nuestra meta es crear interfaces de usuario que no solo sean funcionales, sino también estéticamente impecables y agradables de usar. Nos inspiramos en los principios de diseño de Emil Kowalski, priorizando la claridad, el espacio y las interacciones de alta gama.

### 2.1. Tipografía Limpia y Jerarquía Visual

La tipografía es la base de un buen diseño. Debe ser legible, nítida y establecer una jerarquía clara.

*   **Paleta de Colores:** **Evitar grises planos.** Usaremos una paleta de grises con matices sutiles (ej. `slate`, `zinc`, `neutral` de Tailwind) para añadir profundidad.
    *   **Texto Primario:** `text-zinc-900` (o `slate-900`) para el modo claro.
    *   **Texto Secundario/Subtítulos:** `text-zinc-600` (o `slate-600`).
    *   **Bordes y Divisores:** `border-zinc-200` (o `slate-200`).
*   **Jerarquía de Texto:** Define claramente los roles del texto usando la escala de Tailwind.
    *   **Títulos de Página (H1):** `text-3xl` o `text-4xl`, `font-bold`.
    *   **Subtítulos (H2):** `text-2xl`, `font-semibold`.
    *   **Texto de Párrafo:** `text-base`, `font-normal`.
    *   **Etiquetas/Pequeño:** `text-sm`, `font-medium`.

### 2.2. Espaciado Generoso y Estructurado (Whitespace)

El espacio no es vacío, es un elemento de diseño activo. Lo usaremos para reducir la carga cognitiva y guiar la atención del usuario.

*   **Principio de Proximidad:** Elementos relacionados deben estar cerca, y grupos no relacionados deben tener una separación notable.
*   **Evitar Sobrecarga:** **No anidar tarjetas innecesariamente.** Una interfaz limpia respira. Usa divisores sutiles (`<hr />` estilizado) o simplemente el espacio para separar secciones.
*   **Sistema de Espaciado Consistente:** Utilizar la escala de espaciado de Tailwind (`4` = 1rem) de manera consistente.
    *   **Padding en Contenedores/Tarjetas:** `p-6` o `p-8`.
    *   **Espacio entre Elementos (Stacking):** `space-y-4` o `space-y-6` para elementos verticales.
    *   **Espacio en Rejillas (Grid):** `gap-6` o `gap-8`.

### 2.3. Animaciones y Microinteracciones de Alta Gama

Las animaciones deben ser fluidas, rápidas y con propósito. Aportan feedback, guían al usuario y añaden un toque de elegancia.

*   **Duración y Easing:**
    *   **Regla General:** Las transiciones deben ser rápidas, **menores a 300ms**.
    *   **Duración Común:** `duration-200`.
    *   **Curva de Easing:** `ease-in-out` para una sensación suave y profesional. Evitar transiciones lineales.
*   **Feedback Inmediato en Elementos Interactivos:** El usuario debe sentir que la interfaz responde al instante.
    *   **Botones:** Deben tener transiciones para `background-color`, `transform` y `box-shadow`.
        *   **Ejemplo de Botón Primario:**
          ```html
          <button class="bg-zinc-900 text-white px-4 py-2 rounded-lg 
                         transition-transform duration-200 ease-in-out 
                         hover:scale-105 hover:bg-zinc-700 
                         active:scale-95">
            Click me
          </button>
          ```
    *   **Elementos de Lista (Hover):** Aplicar un cambio sutil de fondo o una ligera elevación al pasar el ratón. `hover:bg-zinc-50`.
*   **Transiciones de Página/Componentes:** Las apariciones de nuevos elementos en la vista (ej. modales, nuevas páginas) deben usar una transición suave de opacidad y/o escala.

---

## 3. Organización de Carpetas

La estructura del proyecto es modular para facilitar la escalabilidad y el mantenimiento.

*   `src/`: Código fuente de la aplicación.
    *   `api/`: Módulos de comunicación con el backend.
    *   `assets/`: Imágenes, iconos y otros activos estáticos.
    *   `components/`: **Componentes Reutilizables.** Deben ser agnósticos a la lógica de negocio específica de una página.
    *   `lib/`: Utilidades y helpers de propósito general (ej. `datetimePeru.ts`).
    *   `pages/`: Componentes que representan las vistas de cada ruta de la aplicación.
    *   `store/`: Módulos para la gestión de estado global.
    *   `types/`: Definiciones de tipos e interfaces de TypeScript.

---

## 4. Convenciones de Código Generales

*   **Componentes Funcionales:** Usar siempre componentes funcionales con React Hooks.
*   **Tipado Estricto:** TypeScript es mandatorio. Definir interfaces claras para props (`Props`) y datos de API.
*   **Nomenclatura:**
    *   Componentes: `PascalCase` (ej. `PrimaryButton.tsx`).
    *   Archivos y Carpetas: `kebab-case` (ej. `user-profile/`).
*   **Comentarios:** Comentar el *porqué* de una decisión compleja, no el *qué* hace el código.
