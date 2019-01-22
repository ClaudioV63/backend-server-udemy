var express = require('express');
var Usuario = require('../models/usuario');
var bcrypt = require('bcryptjs');

var mdAutenticacion = require('../middlewares/autenticacion');

var app = express();




// Rutas

//*********************************************************************
// Obtener Todos los Usuarios
//*********************************************************************

app.get('/', (req, res, next) => {

    var desde = req.query.desde || 0;
    desde = Number(desde);

    Usuario.find({}, 'nombre email img role')
        .skip(desde)
        .limit(5)
        .exec((err, usuarios) => {

            if (err) {
                return res.status(500).json({
                    ok: false,
                    mensaje: 'Error en base de datos cargando Usuarios',
                    errors: err
                });
            }

            Usuario.count({}, (err, conteo) => {

                res.status(200).json({
                    ok: true,
                    total: conteo,
                    usuarios: usuarios

                });
            });
        });
});


//*********************************************************************
// Actualizar un Usuario
//*********************************************************************

app.put('/:id', mdAutenticacion.verificaToken, (req, res) => {

    var id = req.params.id;
    var body = req.body;

    Usuario.findById(id, (err, usuario) => {

        if (err) {
            return res.status(500).json({
                ok: false,
                mensaje: 'Error al buscar Usuarios',
                errors: err
            });
        }

        if (!usuario) {
            return res.status(400).json({
                ok: false,
                mensaje: 'No existe usuario con el ID',
                errors: { message: 'No existe un usuario con el id especificado' }
            });
        }

        usuario.nombre = body.nombre;
        usuario.email = body.email;
        usuario.role = body.role;

        usuario.save((err, usuarioGuardado) => {
            if (err) {
                return res.status(400).json({
                    ok: false,
                    mensaje: 'Error al actualizar Usuario',
                    errors: err
                });
            }

            usuarioGuardado.password = ':)';

            res.status(200).json({
                ok: true,
                usuario: usuarioGuardado
            });
        })
    });



});

//*********************************************************************
// Crear un nuevo Usuario
//*********************************************************************

app.post('/', mdAutenticacion.verificaToken, (req, res) => {

    var body = req.body // Solo funcionará si tengo instalado el body-parser

    var usuario = new Usuario({
        nombre: body.nombre,
        email: body.email,
        password: bcrypt.hashSync(body.password, 10),
        img: body.img,
        role: body.role,
    });

    usuario.save((err, usuarioGuardado) => {

        if (err) {
            return res.status(400).json({
                ok: false,
                mensaje: 'Error al crear Usuarios',
                errors: err
            });
        }

        res.status(201).json({
            ok: true,
            usuario: usuarioGuardado,
            usuariodecoded: req.usuario
        });
    });
});



//*********************************************************************
// Borrar un Usuario
//*********************************************************************

app.delete('/:id', mdAutenticacion.verificaToken, (req, res) => {


    var id = req.params.id;

    Usuario.findByIdAndRemove(id, (err, usuarioBorrado) => {

        if (err) {
            return res.status(500).json({
                ok: false,
                mensaje: 'Error al borrar Usuario',
                errors: err
            });
        }

        if (!usuarioBorrado) {
            return res.status(400).json({
                ok: false,
                mensaje: 'No existe usuario con el ID',
                errors: { message: 'No existe un usuario con el id especificado' }
            });
        }

        res.status(200).json({
            ok: true,
            usuario: usuarioBorrado
        });

    });

});


module.exports = app;