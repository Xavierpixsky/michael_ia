const { consultarProductoOdooXMLRPC } = require('./odooFunctions');

async function detectarYBuscarProducto(terminoBusqueda) {
    if (!terminoBusqueda) {
        return { mensaje: "El término de búsqueda no puede estar vacío.", productos: [] };
    }

    try {
        const productos = await consultarProductoOdooXMLRPC(terminoBusqueda);

        if (productos.length > 0) {
            return { mensaje: `Sí, tenemos disponibilidad de ${productos.length} productos.`, productos };
        } else {
            return { mensaje: "No tenemos disponible.", productos: [] };
        }
    } catch (error) {
        return { mensaje: `Hubo un problema al consultar la API de Odoo: ${error.message}`, productos: [] };
    }
}

module.exports = { detectarYBuscarProducto };
