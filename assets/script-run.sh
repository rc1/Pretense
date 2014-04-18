#!/usr/bin/env node

// # Include
var childProcess = require( 'child_process' );

// # Create the processes
var pretense = childProcess.spawn( 'bash' );
var servant = childProcess.spawn( 'bash' )

// # Configure the processes
configure( pretense, 'pretense' );
configure( servant, 'servant' );

// # Open apps with processes
run( pretense, 'pretense', 10 );
run( servant, 'servant', 300 );

// # Utils
function configure( process, name ) {
    process.stdout.on('data', function (data) {
        console.log( name + ': ' + data );
    });
}

function run( process, command, delay ) {
    setTimeout(function() {
        process.stdin.write( command+'\n' );
    }, delay);
}