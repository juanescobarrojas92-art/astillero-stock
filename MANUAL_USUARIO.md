# Manual de Usuario - AstilleroStock

Bienvenido al sistema de gestión de inventario y proyectos **AstilleroStock**, diseñado específicamente para el control de insumos, herramientas y reparaciones navales en el Astillero de Calbuco.

---

## 1. Acceso al Sistema
Para ingresar al sistema, asegúrese de que el servidor esté encendido (ejecutando `npm start` en su terminal) y abra su navegador web:
- **Dirección de acceso:** `http://localhost:3000`
- **Usuario administrador:** `admin`
- **Contraseña:** `astillero2026`

---

## 2. Panel Principal (Inventario)
Esta es la vista principal donde puede visualizar todo el catálogo de herramientas y materiales en bodega.

- **Agregar un nuevo insumo:** Presione el botón flotante azul "Agregar insumo". Complete los datos como Nombre, Categoría, Stock Actual, Mínimo de alerta y el Valor Unitario.
- **Importar desde Excel:** Si desea cargar muchos insumos a la vez, use el botón **"Importar Excel"**.
  - *Tip:* Haga clic en **"Plantilla"** para descargar un archivo con el formato exacto requerido por el sistema. Llene esa plantilla y luego súbala al sistema.
- **Buscar y Filtrar:** Utilice la barra de texto superior para buscar herramientas específicas por nombre, o el menú desplegable para filtrar por categorías (ej. *Repuestos*, *EPP*).
- **Acciones:** En la tabla de inventario, cada elemento tiene botones para **Editar** su información, **Mover** (hacer entradas o salidas rápidas) y **Borrar**.

---

## 3. Gestión de Proyectos (Barcos y Pontones)
Aquí es donde se registran las embarcaciones, pontones o artefactos navales que están siendo intervenidos en el astillero.

- **Crear un Proyecto:** Haga clic en "Nuevo Proyecto". Seleccione el **Tipo** (Barco, Pontón, Artefacto Naval u Otro) e ingrese un nombre descriptivo (por ejemplo, "Reparación Arcone").
- **Cambio de Estado:** Todos los proyectos inician en estado "Activo". Una vez entregada la embarcación, haga clic en el botón de estado para cambiarlo a "Finalizado". Esto ayuda a no mezclar barcos antiguos con los actuales.

---

## 4. Registro de Movimientos
Los movimientos son vitales para llevar el control de qué entra y qué sale de la bodega.

Existen tres tipos de movimientos:
1. **Entrada (Compra/Devolución):** Suma inventario. Úselo cuando llegue material nuevo de proveedores o cuando se devuelva una herramienta prestada.
2. **Salida (Consumo/Asignación):** Resta inventario. Al seleccionar este tipo, se desplegará la opción **"Asignar a Proyecto"**. Aquí debe seleccionar el barco o pontón en el que se usará el material. De esta manera sabrá exactamente cuánto material se gastó por embarcación.
3. **Ajuste de Inventario:** Modifica el stock a un valor exacto en caso de discrepancias detectadas en inventarios físicos.

*Recuerde siempre ingresar un responsable y una nota opcional.*

---

## 5. Alertas de Stock y Reportes
- **Alertas:** El sistema avisará de manera proactiva qué elementos están **Agotados** (en rojo) o con **Bajo Stock** (en amarillo) según el mínimo que usted haya configurado.
- **Reportes:** Muestra el capital total inmovilizado en bodega y lo desglosa por categorías para entender dónde está el mayor valor de los insumos.

---

## 6. Auditoría de Seguridad
El sistema posee un registro automático de actividad. Cada vez que alguien entra al sistema, crea un producto, hace un movimiento o edita un proyecto, queda registrado en la sección de Auditoría junto con la fecha exacta y el usuario. Esto garantiza el control y evita manipulaciones no autorizadas.
