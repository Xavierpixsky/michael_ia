const xmlrpc = require('xmlrpc');

// Configuración de la conexión
const url = 'https://tu_insitancia_odoo.com';
const db = 'tu-base-odoo';
const username = 'tu-user-gmail-de-odoo';
const password = 'tu-clave-de-odoo-o-tu-apikey-personalizada';

async function buscarClienteOdoo(vat) {
    return new Promise((resolve, reject) => {
        const common = xmlrpc.createSecureClient({ url: `${url}/xmlrpc/2/common` });

        common.methodCall('authenticate', [db, username, password, {}], (err, uid) => {
            if (err) {
                console.error("Error en la autenticación:", err);
                return reject(err);
            }

            if (uid) {
                const models = xmlrpc.createSecureClient({ url: `${url}/xmlrpc/2/object` });

                models.methodCall('execute_kw', [db, uid, password, 'res.partner', 'search_read', [[['vat', '=', vat]]], { fields: ['id', 'name'] }], (err, clientes) => {
                    if (err) {
                        console.error("Error al buscar el cliente:", err);
                        return reject(err);
                    }

                    if (clientes.length > 0) {
                        resolve(clientes[0]);
                    } else {
                        resolve(null);
                    }
                });
            } else {
                reject("Autenticación fallida.");
            }
        });
    });
}

async function crearClienteOdoo(datosCliente) {
    return new Promise((resolve, reject) => {
        const common = xmlrpc.createSecureClient({ url: `${url}/xmlrpc/2/common` });

        common.methodCall('authenticate', [db, username, password, {}], (err, uid) => {
            if (err) {
                console.error("Error en la autenticación:", err);
                return reject(err);
            }

            if (uid) {
                const models = xmlrpc.createSecureClient({ url: `${url}/xmlrpc/2/object` });

                // Asignar los datos a los campos correctos en Odoo
                const nuevoCliente = {
                    name: datosCliente.name,                  // Nombre completo del cliente
                    vat: datosCliente.vat,                   // Cédula o RIF
                    phone: datosCliente.phone,               // Teléfono
                    email: datosCliente.email || '',         // Correo electrónico (opcional)
                    street: datosCliente.street || '',       // Dirección (opcional)
                };

                models.methodCall('execute_kw', [db, uid, password, 'res.partner', 'create', [nuevoCliente]], (err, clienteId) => {
                    if (err) {
                        console.error("Error al crear el cliente:", err);
                        return reject(err);
                    }

                    resolve(clienteId);
                });
            } else {
                reject("Autenticación fallida.");
            }
        });
    });
}

module.exports = { buscarClienteOdoo, crearClienteOdoo };
