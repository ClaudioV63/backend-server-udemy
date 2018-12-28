var express = require('express');
var bcrypt = require('bcryptjs');
var jwt = require('jsonwebtoken');

var SEED = require('../config/config').SEED;

var app = express();
var Usuario = require('../models/usuario');

// Rutas

//*********************************************************************
// 
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