const OpenAI = require('openai');
const readline = require('readline');
const { detectarYBuscarProducto } = require('./buscador');
const { buscarClienteOdoo, crearClienteOdoo } = require('./crearCliente');
const { crearPedidoOdoo } = require('./crearPedido');
require('dotenv').config();

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

let historial = [
    {
        role: 'system',
        content: `
        tus instrucciones para tu asistente ia.....
        
        - **Búsqueda de Producto y reglas de uso**: 
          Si el usuario menciona un producto específico, un código de producto, o está interesado en la disponibilidad o precios, responde con "[buscar_producto]" seguido del término de búsqueda.
        - **Creación de Pedido**:
          Si el usuario menciona que desea realizar un pedido, responde con "[crear_pedido]" y solicita la cédula o RIF (VAT) del cliente. Verifica si el cliente ya está registrado. Si no, solicita solo el nombre y el número de teléfono para crear el cliente antes de proceder con el pedido.
          Si después de realizar el pedido el cliente busca otra cosa, y te dice "realizar el pedido", usa la cédula que te dio o que ya registraste para crear el pedido con el nuevo producto.
        `
    }
];

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

rl.setPrompt('Tú: ');
rl.prompt();

let clienteData = {};
let procesoEnCurso = '';
let productosEncontrados = [];
let productoSeleccionado = [];
let pedidoConfirmado = false;

rl.on('line', async (entrada) => {
    const mensajes = entrada.trim();
    historial.push({ role: 'user', content: mensajes });

    try {
        const respuesta = await openai.chat.completions.create({
            model: 'gpt-4-0613', // usa este modelo para poder ejecutar las funciones que manejan odoo
            messages: historial,
            max_tokens: 150, //puedes usar mas si deseas, pero depende de lo que desees para tu asistente
            temperature: 0.7, // recomiendo usar una temperatura moderada
        });

        const respuestaDeMichael = respuesta.choices[0].message.content.trim();

        if (respuestaDeMichael.includes('[buscar_producto]')) {
            const terminoBusqueda = respuestaDeMichael.replace('[buscar_producto]', '').trim();
            const resultadoBusqueda = await detectarYBuscarProducto(terminoBusqueda);

            if (resultadoBusqueda.productos.length > 0) {
                productosEncontrados = resultadoBusqueda.productos;
                const opciones = productosEncontrados.map((producto, index) =>
                    `${index + 1}. Producto: ${producto.name}, Precio: ${producto.list_price} USD`
                ).join('\n');

                historial.push({ role: 'assistant', content: `Se encontraron los siguientes productos:\n${opciones}\nPor favor, selecciona el número del producto que deseas o indícanos si deseas más de uno. Si deseas cancelar, escribe "cancelar".` });
                console.log(`Se encontraron los siguientes productos:\n${opciones}\nPor favor, selecciona el número del producto que deseas o indícanos si deseas más de uno. Si deseas cancelar, escribe "cancelar".`);
                
                procesoEnCurso = 'seleccion_producto';
            } else {
                const mensajeNoEncontrado = "No se encontró el producto.";
                historial.push({ role: 'assistant', content: mensajeNoEncontrado });
                console.log(`${mensajeNoEncontrado}`);
            }
        } else if (procesoEnCurso === 'seleccion_producto') {
            if (mensajes.toLowerCase() === 'cancelar') {
                historial.push({ role: 'assistant', content: "La selección de productos ha sido cancelada." });
                console.log("La selección de productos ha sido cancelada.");
                procesoEnCurso = '';
                return;
            }

            const seleccion = mensajes.split(',').map(num => parseInt(num.trim()) - 1);

            if (seleccion.every(num => num >= 0 && num < productosEncontrados.length)) {
                productoSeleccionado = seleccion.map(num => productosEncontrados[num]);

                historial.push({ role: 'assistant', content: `Seleccionaste los siguientes productos:\n${productoSeleccionado.map(prod => `${prod.name}, Precio: ${prod.list_price} USD`).join('\n')}\n¿Cuántas unidades deseas de cada producto? (Ejemplo: 1, 2, 3). Si deseas cancelar, escribe "cancelar".` });
                console.log(`Seleccionaste los siguientes productos:\n${productoSeleccionado.map(prod => `${prod.name}, Precio: ${prod.list_price} USD`).join('\n')}\n¿Cuántas unidades deseas de cada producto? (Ejemplo: 1, 2, 3). Si deseas cancelar, escribe "cancelar".`);
                
                procesoEnCurso = 'seleccion_cantidad';
            } else {
                historial.push({ role: 'assistant', content: "Selección no válida. Por favor, elige un número de la lista o escribe 'cancelar'." });
                console.log("Selección no válida. Por favor, elige un número de la lista o escribe 'cancelar'.");
            }
        } else if (procesoEnCurso === 'seleccion_cantidad') {
            if (mensajes.toLowerCase() === 'cancelar') {
                historial.push({ role: 'assistant', content: "La selección de cantidad ha sido cancelada." });
                console.log("La selección de cantidad ha sido cancelada.");
                procesoEnCurso = '';
                return;
            }

            const cantidades = mensajes.split(',').map(num => parseInt(num.trim()));
            
            if (cantidades.length === productoSeleccionado.length && cantidades.every(cant => cant > 0)) {
                productoSeleccionado = productoSeleccionado.map((prod, index) => ({
                    id: prod.id,
                    cantidad: cantidades[index],
                    precio: prod.list_price
                }));

                historial.push({ role: 'assistant', content: `Estás a punto de crear el siguiente pedido:\n${productoSeleccionado.map(prod => `${prod.cantidad}x ${prod.name}, Precio: ${prod.precio} USD`).join('\n')}\nPor favor, proporciona tu cédula o Rif para proceder. Si deseas cancelar, escribe "cancelar".` });
                console.log(`Estás a punto de crear el siguiente pedido:\n${productoSeleccionado.map(prod => `${prod.cantidad}x ${prod.name}, Precio: ${prod.precio} USD`).join('\n')}\nPor favor, proporciona tu cédula o Rif para proceder. Si deseas cancelar, escribe "cancelar".`);
                
                procesoEnCurso = 'confirmar_pedido';
            } else {
                historial.push({ role: 'assistant', content: "Formato no válido. Por favor, proporciona la cantidad correcta para cada producto o escribe 'cancelar'." });
                console.log("Formato no válido. Por favor, proporciona la cantidad correcta para cada producto o escribe 'cancelar'.");
            }
        } else if (procesoEnCurso === 'confirmar_pedido') {
            if (mensajes.toLowerCase() === 'cancelar') {
                historial.push({ role: 'assistant', content: "La creación del pedido ha sido cancelada." });
                console.log("La creación del pedido ha sido cancelada.");
                procesoEnCurso = '';
                return;
            }

            clienteData.vat = mensajes;
            const cliente = await buscarClienteOdoo(clienteData.vat);

            if (cliente) {
                clienteData.id = cliente.id;
                historial.push({ role: 'assistant', content: `Cliente encontrado: ${cliente.name}. ¿Deseas confirmar este pedido? (Sí/No)` });
                console.log(`Cliente encontrado: ${cliente.name}. ¿Deseas confirmar este pedido? (Sí/No)`);
                
                procesoEnCurso = 'crear_pedido';
            } else {
                historial.push({ role: 'assistant', content: "No se encontró un registro con esa cédula/RIF. Vamos a registrarte. Por favor, proporciona tu nombre y número de teléfono. Si deseas cancelar, escribe 'cancelar'." });
                console.log("No se encontró un registro con esa cédula/RIF. Vamos a registrarte. Por favor, proporciona tu nombre y número de teléfono. Si deseas cancelar, escribe 'cancelar'.");
                procesoEnCurso = 'registrar_datos_cliente';
            }
        } else if (procesoEnCurso === 'registrar_datos_cliente') {
            if (mensajes.toLowerCase() === 'cancelar') {
                historial.push({ role: 'assistant', content: "El registro de cliente ha sido cancelado." });
                console.log("El registro de cliente ha sido cancelado.");
                procesoEnCurso = '';
                return;
            }

            const regex = /(\d+)/;
            const [nombre, telefono] = mensajes.split(regex).filter(Boolean).map(part => part.trim());

            if (nombre && telefono) {
                clienteData.datos = {
                    name: nombre,
                    vat: clienteData.vat,
                    phone: telefono,
                    email: '',
                    street: ''
                };

                try {
                    const clienteId = await crearClienteOdoo(clienteData.datos);
                    historial.push({ role: 'assistant', content: `Cliente creado con ID: ${clienteId}. ¿Deseas confirmar este pedido? (Sí/No)` });
                    console.log(`Cliente creado con ID: ${clienteId}. ¿Deseas confirmar este pedido? (Sí/No)`);

                    clienteData.id = clienteId;
                    procesoEnCurso = 'crear_pedido';
                } catch (error) {
                    historial.push({ role: 'assistant', content: `Error al crear el cliente: ${error.message}.` });
                    console.log(`Error al crear el cliente: ${error.message}.`);
                }
            } else {
                historial.push({ role: 'assistant', content: "Formato incorrecto. Por favor, proporciona tu nombre completo y número de teléfono o escribe 'cancelar'." });
                console.log("Formato incorrecto. Por favor, proporciona tu nombre completo y número de teléfono o escribe 'cancelar'.");
            }
        } else if (procesoEnCurso === 'crear_pedido') {
            if (mensajes.toLowerCase() === 'sí' || mensajes.toLowerCase() === 'si') {
                try {
                    const resultadoPedido = await crearPedidoOdoo(clienteData.id, productoSeleccionado);
                    historial.push({ role: 'assistant', content: `Pedido creado y confirmado exitosamente con ID: ${resultadoPedido}.` });
                    console.log(`Pedido creado y confirmado exitosamente con ID: ${resultadoPedido}.`);

                    const enlaceWhatsApp = `https://wa.me/0004288000?text=Hola,%20realicé%20un%20pedido%20con%20ID:%20${resultadoPedido}%20y%20me%20gustaría%20confirmar%20detalles.`;
                    historial.push({ role: 'assistant', content: `Puedes contactar con nosotros a través de este enlace de WhatsApp: ${enlaceWhatsApp}` });
                    console.log(`Puedes contactar con nosotros a través de este enlace de WhatsApp: ${enlaceWhatsApp}`);

                    clienteData = {};
                    productoSeleccionado = [];
                    productosEncontrados = [];
                    procesoEnCurso = '';
                } catch (error) {
                    historial.push({ role: 'assistant', content: `Error al crear el pedido: ${error.message}.` });
                    console.log(`Error al crear el pedido: ${error.message}.`);
                }
            } else if (mensajes.toLowerCase() === 'no') {
                historial.push({ role: 'assistant', content: "La creación del pedido ha sido cancelada." });
                console.log("La creación del pedido ha sido cancelada.");
                procesoEnCurso = '';
            } else {
                historial.push({ role: 'assistant', content: "Por favor, responde con 'Sí' o 'No'." });
                console.log("Por favor, responde con 'Sí' o 'No'.");
            }
        } else {
            historial.push({ role: 'assistant', content: respuestaDeMichael });
            console.log(`${respuestaDeMichael}`);
        }
    } catch (error) {
        console.error("Error al procesar la solicitud:", error.message);
        console.log(`Lo siento, hubo un problema al procesar tu solicitud: ${error.message}`);
    }

    rl.prompt();
});
