var express = require('express');
var fileUpload = require('express-fileupload');
var fs = require('fs');

var app = express();

var Usuario = require('../models/usuario');
var Medico = require('../models/medico');
var Hospital = require('../models/hospital');

// default options
app.use(fileUpload());


// Rutas
app.put('/:tipo/:idDestino', (req, res, next) => {

    const tipo = req.params.tipo;
    const id = req.params.idDestino;

    // Tipos de colecciones de imagenes

    // valido los tipos (pasados como parámetros)
    var tiposValidos = ['hospitales', 'medicos', 'usuarios']

    if (tiposValidos.indexOf(tipo) < 0) {
        return res.status(400).json({
            ok: false,
            mensaje: 'Tipo de colección no es válida',
            errors: { message: 'Los tipos permitidos son ' + tiposValidos.join(', ') }
        });
    }

    if (!req.files) {
        return res.status(400).json({
            ok: false,
            mensaje: 'No se seleccionó archivo',
            errors: { message: 'Debe seleccionar una imagen' }
        });
    };

    //Obtener nombre del archivo
    const archivo = req.files.imagen;

    // tendré un arreglo por cada palabra separada por punto. Necesito la última palabla que será la extensión
    const nombreCortado = archivo.name.split('.');
    const extensionArchivo = nombreCortado[nombreCortado.length - 1];

    //validamos las extensiones aceptadas
    const extensionesValidas = ['png', 'jpg', 'gif', 'jpeg']

    if (extensionesValidas.indexOf(extensionArchivo) < 0) {

        return res.status(400).json({
            ok: false,
            mensaje: 'Extensión no válida',
            errors: { message: 'Las extensiones permitidas son ' + extensionesValidas.join(', ') }
        });
    };

    // Si llega aquí es que es una imagen. Generamos un nombre de archivo personalizado para que 
    // no se supermponga a otro existente: por ej: ID de usuario + un numero random para prevenir 
    // el cache del navegador (siempre será una imagen nueva) 1234214214214234-123,png

    const nombreArchivo = `${ id }-${ new Date().getMilliseconds()}.${ extensionArchivo}`;

    // Mover el archivo del temporal a un path enb particular

    const path = `./uploads/${ tipo }/${nombreArchivo}`

    archivo.mv(path, err => {

        if (err) {
            return res.status(500).json({
                ok: false,
                mensaje: 'Error al mover archivo',
                errors: err
            });
        };

        // Asignamos la imagen a usuario/hospital o médico

        subirPorTipo(tipo, id, nombreArchivo, res);

        //   res.status(200).json({
        //      ok: true,
        //        mensaje: 'Archivo movido correctamente!!'
        //    });

    });

});

// Envío la respuesta res como parámetro, porque quiero enviarla desde esta función 
// y no por el res.status(200) anterior

function subirPorTipo(tipo, id, nombreArchivo, res) {

    if (tipo === 'usuarios') {

        Usuario.findById(id, (err, usuario) => {

            if (!usuario) {
                return res.status(400).json({
                    ok: false,
                    mensaje: 'Usuario no existe',
                    errors: { message: 'El usuario no existe' }
                });
            };

            if (usuario.img) {

                // path de la imagen anterior que tuviere el usuario 
                // (tomo imagen  desde propiedad img del usuario)

                var pathViejo = './uploads/usuarios/' + usuario.img;

                // Si existe imagen en ese path, debo antes eliminarla para reemplazarla

                if (fs.existsSync(pathViejo)) {
                    fs.unlinkSync(pathViejo);
                };
            };

            // Subo ahora (referencio) la imagen nueva a la base

            usuario.img = nombreArchivo;

            // importante poner un return para que no siga con las siguientes evaluaciones
            // aunque en realidad no debiera entrar

            usuario.save((err, usuarioActualizado) => {

                usuarioActualizado.password = ':)';

                return res.status(200).json({
                    ok: true,
                    mensaje: 'Usuario Actualizado!!',
                    usuario: usuarioActualizado
                });
            });

        });
    };

    if (tipo === 'medicos') {

        Medico.findById(id, (err, medico) => {

            if (!medico) {
                return res.status(400).json({
                    ok: false,
                    mensaje: 'Médico no existe',
                    errors: { message: 'El médico no existe' }
                });
            };

            if (medico.img) {

                var pathViejo = './uploads/medicos/' + medico.img;

                if (fs.existsSync(pathViejo)) {
                    fs.unlinkSync(pathViejo);
                };
            };

            medico.img = nombreArchivo;

            medico.save((err, medicoActualizado) => {
                return res.status(200).json({
                    ok: true,
                    mensaje: 'Medico Actualizado!!',
                    medico: medicoActualizado
                });
            });

        });

    };

    if (tipo === 'hospitales') {

        Hospital.findById(id, (err, hospital) => {

            if (!hospital) {
                return res.status(400).json({
                    ok: false,
                    mensaje: 'Hospital no existe',
                    errors: { message: 'El hospital no existe' }
                });
            };

            if (hospital.img) {

                var pathViejo = './uploads/hospitales/' + hospital.img;

                if (fs.existsSync(pathViejo)) {
                    fs.unlinkSync(pathViejo);
                };
            };


            hospital.img = nombreArchivo;

            hospital.save((err, hospitalActualizado) => {
                return res.status(200).json({
                    ok: true,
                    mensaje: 'Hospital Actualizado!!',
                    hospital: hospitalActualizado
                });
            });

        });

    };


};


module.exports = app;