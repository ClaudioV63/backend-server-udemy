var express = require('express');
var Hospital = require('../models/hospital');

var mdAutenticacion = require('../middlewares/autenticacion');

var app = express();

// Rutas

//*********************************************************************
// Obtener Todos los Hospitales
//*********************************************************************

app.get('/', (req, res, next) => {

    var desde = req.query.desde || 0;
    desde = Number(desde);

    Hospital.find({})
        .skip(desde)
        .limit(5)
        .populate('usuario', 'nombre email')
        .exec((err, hospitales) => {

            if (err) {
                return res.status(500).json({
                    ok: false,
                    mensaje: 'Error en base de datos cargando Hospitales',
                    errors: err
                });
            }

            Hospital.count({}, (err, conteo) => {

                res.status(200).json({
                    ok: true,
                    total: conteo,
                    hospitales: hospitales
                });
            });

        });
});


//*********************************************************************
// Crear un nuevo Hospital
//*********************************************************************

app.post('/', mdAutenticacion.verificaToken, (req, res) => {

    var body = req.body // Solo funcionará si tengo instalado el body-parser

    var hospital = new Hospital({
        nombre: body.nombre,
        usuario: req.usuario._id,
    });

    hospital.save((err, hospitalGuardado) => {

        if (err) {
            return res.status(400).json({
                ok: false,
                mensaje: 'Error al crear Hospital',
                errors: err
            });
        }

        res.status(201).json({
            ok: true,
            hospital: hospitalGuardado,
            usuariodecoded: req.usuario
        });
    });
});

//*********************************************************************
// Actualizar un Hospital
//*********************************************************************

app.put('/:id', mdAutenticacion.verificaToken, (req, res) => {

    var id = req.params.id;
    var body = req.body;

    Hospital.findById(id, (err, hospital) => {

        if (err) {
            return res.status(500).json({
                ok: false,
                mensaje: 'Error al buscar Hospital',
                errors: err
            });
        }

        if (!hospital) {
            return res.status(400).json({
                ok: false,
                mensaje: 'No existe el Hospital con el ID',
                errors: { message: 'No existe un Hospital con el id especificado' }
            });
        }

        hospital.nombre = body.nombre;
        hospital.usuario = req.usuario._id;

        hospital.save((err, hospitalGuardado) => {
            if (err) {
                return res.status(400).json({
                    ok: false,
                    mensaje: 'Error al actualizar Hospital',
                    errors: err
                });
            }

            res.status(200).json({
                ok: true,
                hospital: hospitalGuardado
            });
        })
    });
});

//*********************************************************************
// Borrar un Usuario
//*********************************************************************

app.delete('/:id', mdAutenticacion.verificaToken, (req, res) => {

    var id = req.params.id;

    Hospital.findByIdAndRemove(id, (err, hospitalBorrado) => {

        if (err) {
            return res.status(500).json({
                ok: false,
                mensaje: 'Error al borrar Hospital',
                errors: err
            });
        }

        if (!hospitalBorrado) {
            return res.status(400).json({
                ok: false,
                mensaje: 'No existe Hospital con el ID',
                errors: { message: 'No existe un Hospital con el id especificado' }
            });
        }

        res.status(200).json({
            ok: true,
            hospital: hospitalBorrado
        });

    });

});



module.exports = app;