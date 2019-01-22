var express = require('express');
var Medico = require('../models/medico');

var mdAutenticacion = require('../middlewares/autenticacion');

var app = express();

// Rutas

//*********************************************************************
// Obtener Todos los Medicos
//*********************************************************************

app.get('/', (req, res, next) => {

    var desde = req.query.desde || 0;
    desde = Number(desde);

    Medico.find({})
        .skip(desde)
        .limit(5)
        .populate('usuario', 'nombre email')
        .populate('hospital')
        .exec((err, medicos) => {

            if (err) {
                return res.status(500).json({
                    ok: false,
                    mensaje: 'Error en base de datos cargando Médicos',
                    errors: err
                });
            }

            Medico.count({}, (err, conteo) => {

                res.status(201).json({
                    ok: true,
                    total: conteo,
                    mensaje: "Todo está ok",
                    medicos: medicos
                });
            });
        });

});

//*********************************************************************
// Crear un nuevo Medico
//*********************************************************************

app.post('/', mdAutenticacion.verificaToken, (req, res) => {

    var body = req.body;

    var medico = new Medico({
        nombre: body.nombre,
        usuario: req.usuario._id,
        hospital: body.hospital //podría ser un selector en formulario, por lo que pasaría en el body que nos envíe solo el _id del hospital
    });

    medico.save((err, medicoGuardado) => {

        if (err) {
            return res.status(400).json({
                ok: false,
                mensaje: 'Error al crear Médico',
                errors: err
            })
        };

        res.status(201).json({
            ok: true,
            medico: medico,
            usuariodecoded: req.usuario
        });

    });
});

//*********************************************************************
// Actualizar un Medico
//*********************************************************************

app.put('/:idMed', mdAutenticacion.verificaToken, (req, res, next) => {

    var idMed = req.params.idMed;
    var body = req.body;

    Medico.findById(idMed, (err, medicoDB) => {

        if (err) {
            return res.status(500).json({
                ok: false,
                mensaje: 'Error al buscar Médico',
                errors: err
            });
        };

        if (!medicoDB) {
            return res.status(400).json({
                ok: false,
                mensaje: 'No se encuentra Médico con dicho ID',
                errors: { message: 'No se encuentra Médico con dicho ID' }
            });
        };

        medicoDB.nombre = body.nombre;
        medicoDB.usuario = req.usuario._id;
        medicoDB.hospital = body.hospital; //podría ser un selector en formulario, por lo que pasaría en el body que nos envíe solo el _id del hospital

        medicoDB.save((err, medicoGuardado) => {

            if (err) {
                return res.status(400).json({
                    ok: false,
                    mensaje: 'Error al actualizar Médico',
                    errors: err
                });
            };

            res.status(200).json({
                ok: true,
                medico: medicoGuardado
            });

        });

    })
});

//*********************************************************************
// Borrar un Medico
//*********************************************************************

app.delete('/:idMed', mdAutenticacion.verificaToken, (req, res, next) => {

    var idMed = req.params.idMed;

    Medico.findByIdAndRemove(idMed, (err, medicoBorrado) => {

        if (err) {
            return res.status(500).json({
                ok: false,
                mensaje: 'Error al borrar Médico',
                errors: err
            });
        };

        if (!medicoBorrado) {
            return res.status(400).json({
                ok: false,
                mensaje: 'No existe Médico con el ID',
                errors: { message: 'No existe un Médico con el id especificado' }
            });
        }

        res.status(200).json({
            ok: true,
            medico: medicoBorrado
        });

    });
});

module.exports = app;