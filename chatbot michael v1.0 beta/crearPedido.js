const xmlrpc = require('xmlrpc');

const url = 'https://tu_insitancia_odoo.com';
const db = 'tu-base-odoo';
const username = 'tu-user-gmail-de-odoo';
const password = 'tu-clave-de-odoo-o-tu-apikey-personalizada';

async function crearPedidoOdoo(clienteId, productos) {
    return new Promise((resolve, reject) => {
        const common = xmlrpc.createSecureClient({ url: `${url}/xmlrpc/2/common` });

        common.methodCall('authenticate', [db, username, password, {}], (err, uid) => {
            if (err) {
                console.error("Error en la autenticación:", err);
                return reject(err);
            }

            if (uid) {
                const models = xmlrpc.createSecureClient({ url: `${url}/xmlrpc/2/object` });

                models.methodCall('execute_kw', [db, uid, password, 'sale.order', 'create', [{
                    partner_id: clienteId,
                    order_line: productos.map(producto => [0, 0, {
                        product_id: producto.id,
                        product_uom_qty: producto.cantidad,
                        price_unit: producto.precio
                    }])
                }]], (err, orderId) => {
                    if (err) {
                        console.error("Error al crear el pedido:", err);
                        return reject(err);
                    }

                    models.methodCall('execute_kw', [db, uid, password, 'sale.order', 'action_confirm', [orderId]], (err) => {
                        if (err) {
                            console.error("Error al confirmar el pedido:", err);
                            return reject(err);
                        }

                        resolve(orderId);
                    });
                });
            } else {
                reject("Autenticación fallida.");
            }
        });
    });
}

module.exports = { crearPedidoOdoo };
