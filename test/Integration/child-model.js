'use strict';
const Code = require('code');
const Joi = require('joi');
const Lab = require('lab');
const Helper = require('../helper.js');

const expect = Code.expect;
const lab = exports.lab = Lab.script();



lab.experiment('child-models', () => {

    const requestOptions = {
        method: 'GET',
        url: '/swagger.json',
        headers: {
            host: 'localhost'
        }
    };

    const routes = [{
        method: 'POST',
        path: '/foo/v1/bar',
        config: {
            description: '...',
            tags: ['api'],
            validate: {
                payload: Joi.object({
                    outer1: Joi.object({
                        inner1: Joi.string()
                    }),
                    outer2: Joi.object({
                        inner2: Joi.string()
                    })
                })
            },
            handler: function () { }
        }
    }, {
        path: '/bar/objects',
        method: 'POST',
        config: {
            handler: function () { },
            tags: ['api'],
            response: {
                schema: Joi.object()
                    .keys({
                        foos: Joi.object()
                            .keys({ foo: Joi.string().description('some foo') })
                            .label('FooObj')
                    })
                    .label('FooObjParent')
            },
            validate: {
                payload: Joi.object()
                    .keys({
                        foos: Joi.object()
                            .keys({ foo: Joi.string().description('some foo') })
                            .label('FooObj')
                    })
                    .label('FooObjParent')
            }
        }
    }, {
        path: '/bar/arrays',
        method: 'POST',
        config: {
            handler: function () { },
            tags: ['api'],
            response: {
                schema: Joi.array()
                    .items(
                    Joi.array()
                        .items(
                        Joi.object({ bar: Joi.string() })
                            .label('FooArrObj')
                        )
                        .label('FooArr')
                    )
                    .label('FooArrParent')
            },
            validate: {
                payload: Joi.array()
                    .items(
                    Joi.array()
                        .items(
                        Joi.object({ bar: Joi.string() })
                            .label('FooArrObj')
                        )
                        .label('FooArr')
                    )
                    .label('FooArrParent')

            }
        }
    }];



    lab.test('child definitions models', (done) => {

        Helper.createServer({}, routes, (err, server) => {

            server.inject(requestOptions, function (response) {

                expect(err).to.equal(null);
                //console.log(JSON.stringify(response.result));
                expect(response.statusCode).to.equal(200);

                expect(response.result.paths['/foo/v1/bar'].post.parameters[0].schema).to.equal({
                    '$ref': '#/definitions/Model 1'
                });

                expect(response.result.definitions['Model 1']).to.equal({
                    'properties': {
                        'outer1': {
                            '$ref': '#/definitions/outer1'
                        },
                        'outer2': {
                            '$ref': '#/definitions/outer2'
                        }
                    },
                    'type': 'object'
                });

                expect(response.result.definitions.outer1).to.equal({
                    'properties': {
                        'inner1': {
                            'type': 'string'
                        }
                    },
                    'type': 'object'
                });
                done();
            });
        });
    });


    lab.test('object within an object - array within an array', (done) => {

        Helper.createServer({}, routes, (err, server) => {

            server.inject(requestOptions, function (response) {

                expect(err).to.equal(null);
                //console.log(JSON.stringify(response.result));
                expect(response.statusCode).to.equal(200);

                expect(response.result.paths['/bar/objects'].post.parameters[0].schema).to.equal({
                    '$ref': '#/definitions/FooObjParent'
                });
                expect(response.result.paths['/bar/objects'].post.responses[200].schema).to.equal({
                    '$ref': '#/definitions/FooObjParent'
                });
                expect(response.result.definitions.FooObjParent).to.exist();
                expect(response.result.definitions.FooObj).to.exist();


                expect(response.result.paths['/bar/arrays'].post.parameters[0].schema).to.equal({
                    '$ref': '#/definitions/FooArrParent'
                });
                expect(response.result.paths['/bar/arrays'].post.responses[200].schema).to.equal({
                    '$ref': '#/definitions/FooArrParent'
                });
                expect(response.result.definitions.FooArrParent).to.exist();
                expect(response.result.definitions.FooArr).to.exist();
                expect(response.result.definitions.FooArrObj).to.exist();

                done();
            });
        });
    });

});
