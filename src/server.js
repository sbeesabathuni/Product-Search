'use strict';

const Hapi = require('hapi');

const server = Hapi.server({
    port: 8000,
    host: 'localhost'
});

const init = async () => {
    await server.start();
    console.log(`Server running at: ${server.info.uri}`);
};

server.route({
    method: 'GET',
    path: '/',
    handler: (request, h) => {

        return 'Hapi Test';
    }
});

process.on('unhandledRejection', (err) => {

    console.log(err);
    process.exit(1);
});

init();