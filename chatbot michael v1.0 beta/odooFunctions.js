const xmlrpc = require('xmlrpc');

const url = 'https://tu_insitancia_odoo.com';
const db = 'tu-base-odoo';
const username = 'tu-user-gmail-de-odoo';
const password = 'tu-clave-de-odoo-o-tu-apikey-personalizada';

async function consultarProductoOdooXMLRPC(keywords) {
    return new Promise((resolve, reject) => {
        const common = xmlrpc.createSecureClient({ url: `${url}/xmlrpc/2/common` });

        common.methodCall('authenticate', [db, username, password, {}], (err, uid) => {
            if (err) {
                console.error("Error en la autenticación:", err);
                return reject(err);
            }

            if (uid) {
                const models = xmlrpc.createSecureClient({ url: `${url}/xmlrpc/2/object` });

                const searchTerms = keywords.split(' ').map(term => ['name', 'ilike', `%${term}%`]);
                const stockCondition = ['qty_available', '>', 0];
                const finalConditions = ['&'].concat(searchTerms).concat([stockCondition]);

                models.methodCall('execute_kw', [db, uid, password, 'product.product', 'search_read',
                    [finalConditions],
                    { fields: ['name', 'list_price', 'id'] }
                ], (err, products) => {
                    if (err) {
                        console.error("Error al consultar productos:", err);
                        return reject(err);
                    }

                    resolve(products);
                });
            } else {
                reject("Autenticación fallida.");
            }
        });
    });
}

module.exports = { consultarProductoOdooXMLRPC };
