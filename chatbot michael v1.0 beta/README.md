# Michael Bot v3

Michael Bot es un chatbot avanzado diseñado por **Xavier Orlov** para gestionar procesos en odoo desde open ai

## Estado del Proyecto

- **Versión**: 3.0
- **Progreso**: 75% completado
- **Archivo Principal**: `index.js`
- **Dependencias**:
  - `OpenAI API`
  - `Odoo XML-RPC`
  - `Node.js`
  - `dotenv`

## Funcionalidades Clave

### 1. Búsqueda de Productos
Michael permite a los usuarios buscar productos disponibles en la base de datos de Odoo utilizando términos específicos o códigos de producto. El bot procesa la consulta del usuario, realiza la búsqueda en Odoo y presenta una lista numerada de productos encontrados para que el usuario seleccione.

### 2. Gestión de Clientes
Michael verifica si un cliente ya está registrado en Odoo utilizando su cédula o RIF (VAT). Si el cliente no existe en el sistema, Michael solicitará la información necesaria (nombre y número de teléfono) para crear un nuevo cliente antes de proceder con el pedido.

### 3. Creación y Confirmación de Pedidos
Michael guía al usuario a través de la selección de productos, confirmación de cantidades y creación de pedidos. Una vez confirmados los detalles, Michael crea y confirma el pedido automáticamente en Odoo, y proporciona un enlace de WhatsApp para que el cliente pueda contactar a la empresa para confirmar detalles adicionales.

## Estructura del Proyecto

El proyecto está dividido en varios módulos para mantener una estructura clara y organizada:

- **`index.js`**: 
  - Archivo principal que gestiona la interacción con el usuario, la lógica de conversación, y la integración con OpenAI para el procesamiento de lenguaje natural. 
  - Configura la interacción a través de la terminal y maneja las diferentes etapas del proceso de compra, desde la búsqueda hasta la creación del pedido.

- **`buscador.js`**:
  - Contiene la función `detectarYBuscarProducto`, que realiza la búsqueda de productos en Odoo según los términos de búsqueda proporcionados por el usuario.

- **`crearCliente.js`**:
  - Maneja la búsqueda y creación de clientes en Odoo. Si el cliente no se encuentra en la base de datos, el bot solicitará la información necesaria para crear un nuevo registro.

- **`crearPedido.js`**:
  - Gestiona la creación y confirmación de pedidos en Odoo. Se encarga de asociar los productos seleccionados al cliente correspondiente y de confirmar el pedido en el sistema.

- **`odooFunctions.js`**:
  - Proporciona funciones auxiliares para realizar consultas en la base de datos de Odoo mediante XML-RPC. Estas funciones son utilizadas por los otros módulos para interactuar con Odoo de manera eficiente.

## Instalación

Para instalar y ejecutar Michael Bot, sigue estos pasos:

1. Clonar el repositorio:
    ```bash
    git clone https://github.com/Xavierpixsky/michael_ia.git
    ```

2. Navegar al directorio del proyecto:
    ```bash
    cd michael-bot
    ```

3. Instalar las dependencias necesarias:
    ```bash
    npm install
    ```

4. Configurar las variables de entorno en un archivo `.env`:
    ```plaintext
    OPENAI_API_KEY=tu_clave_api_openai
    ```

5. Ejecutar el bot:
    ```bash
    node index.js
    ```

## Uso

- Inicia el bot con `node index.js` y sigue las instrucciones en la terminal.
- Puedes buscar productos, crear clientes y realizar pedidos siguiendo las indicaciones que Michael te proporcionará.

## Ejemplo de Uso

1. **Búsqueda de Productos**:
   - Usuario: "Estoy buscando aceite de motor."
   - Michael: "[buscar_producto] aceite de motor"
   - Resultado: Se presenta una lista numerada de productos disponibles.

2. **Creación de Pedido**:
   - Usuario: "Quiero realizar un pedido del producto 1."
   - Michael: "[crear_pedido]" y guía al usuario a través de los pasos para confirmar el pedido.

## Contribuciones

Las contribuciones son bienvenidas. Por favor, abre un issue o envía un pull request para discutir cualquier cambio que te gustaría hacer.

## Autor

Este proyecto ha sido desarrollado por **Xavier Orlov** con el objetivo de mejorar la eficiencia y la experiencia del cliente.

## Licencia

Este proyecto está bajo la Licencia MIT.

