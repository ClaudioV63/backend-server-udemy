var express = require('express');
var bcrypt = require('bcryptjs');
var jwt = require('jsonwebtoken');

var SEED = require('../config/config').SEED;

var app = express();
var Usuario = require('../models/usuario');

// Google
var CLIENT_ID = require('../config/config').CLIENT_ID;
const { OAuth2Client } = require('google-auth-library');
const client = new OAuth2Client(CLIENT_ID);

// Rutas


//*********************************************************************
// Autenticación de Google
//*********************************************************************
async function verify(token) {
    const ticket = await client.verifyIdToken({
        idToken: token,
        audience: CLIENT_ID, // Specify the CLIENT_ID of the app that accesses the backend
        // Or, if multiple clients access the backend:
        //[CLIENT_ID_1, CLIENT_ID_2, CLIENT_ID_3]
    });

    const payload = ticket.getPayload();
    // const userid = payload['sub'];
    // If request specified a G Suite domain:
    //const domain = payload['hd'];
    return {
        nombre: payload.name,
        email: payload.email,
        img: payload.picture,
        google: true
    }
}

app.post('/google', async(req, res) => {


    var token = req.body.token;

    var googleUser = await verify(token).catch(e => {
        return res.status(403).json({
            ok: false,
            mensaje: 'Token no válido'
        });
    });

    Usuario.findOne({ email: googleUser.email }, (err, usuarioDB) => {

        if (err) {
            return res.status(500).json({
                ok: false,
                mensaje: 'Error al buscar Usuarios',
                errors: err
            });
        }

        if (usuarioDB) {

            // Si el usuario existe, pero no se creó por google 
            // (en su primer logeo), es porque se creó desde nuestro sistema
            // manualmente y ya tendrá una autenticación del sistema
            if (usuarioDB.google === false) {

                return res.status(400).json({
                    ok: false,
                    mensaje: 'Debe Usar su autenticación normal',
                    errors: err
                });
            } else {

                //genero un nuevo token de usuario del sistema
                var token = jwt.sign({ usuario: usuarioDB }, SEED, { expiresIn: 14400 }); // 4 horas de vigencia

                res.status(200).json({
                    ok: true,
                    usuario: usuarioDB,
                    token: token,
                    id: usuarioDB.id
                });

            }

        } else {

            // El usuario logueado por google no existe. Pues debo crearlo para almacenar en nuestra BD

            var usuario = new Usuario();

            usuario.nombre = googleUser.nombre;
            usuario.email = googleUser.email;
            usuario.img = googleUser.img;
            usuario.google = true;
            usuario.password = ':)';

            usuario.save((err, usuarioDB) => {

                var token = jwt.sign({ usuario: usuarioDB }, SEED, { expiresIn: 14400 }); // 4 horas de vigencia

                res.status(200).json({
                    ok: true,
                    usuario: usuarioDB,
                    token: token,
                    id: usuarioDB.id
                });

            });

        }
    });

    //   return res.status(200).json({
    //        ok: true,
    //        mensaje: 'OK',
    //        googleUser: googleUser
    //    });

})

//*********************************************************************
// Autenticación normal
//*********************************************************************
app.post('/', (req, res) => {

    var body = req.body; // Solo funcionará si tengo instalado el body-parser

    Usuario.findOne({ email: body.email }, (err, usuarioDB) => {

        if (err) {
            return res.status(500).json({
                ok: false,
                mensaje: 'Error al buscar Usuarios',
                errors: err
            });
        }

        if (!usuarioDB) {
            return res.status(400).json({
                ok: false,
                mensaje: 'Credenciales incorrectas - (email)',
                errors: err
            });
        }

        // Si llego aquí es porque existe un usuario con el correo pasado como parámetro del body
        // por lo tanto verifico la contraseña

        if (!bcrypt.compareSync(body.password, usuarioDB.password)) {
            return res.status(400).json({
                ok: false,
                mensaje: 'Credenciales incorrectas - (password)',
                errors: err
            });
        }

        // Creamos un TOKEN para regresar en esta petición POST

        usuarioDB.password = ':)';

        var token = jwt.sign({ usuario: usuarioDB }, SEED, { expiresIn: 14400 }); // 4 horas de vigencia

        res.status(200).json({
            ok: true,
            usuario: usuarioDB,
            token: token,
            id: usuarioDB.id
        });

    });

});


module.exports = app;