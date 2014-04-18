module.exports = function ( argv ) {

    // #Modules
    // ##Core
    var http = require( "http" );
    var fs = require( "fs" );
    var path = require( "path" );

    // ##NPM
    var chokidar = require( 'chokidar' );
    var WebSocketServer = require( 'ws' ).Server;
    var express = require( 'express' );
    var W = require( 'w-js' );
    var cors = require( 'cors' );

    // #Config
    var directory = path.resolve( argv.d || argv.dirname || path.join(__dirname, "assets/") );
    var port = process.env.PORT || argv.p || 4000;
    var assetsDirectory = path.join( __dirname, '../assets' );

    // #ImageSizes
    var imagesize = require( 'imagesize' );
    var imageSizeHash = {};

    // #Express
    var app = express()
                .use(cors())
                .use( W.jadeMiddleware()( {
                    src : assetsDirectory,
                    jadeOptions : {
                        pretty: true
                    }
                }))
                .use( express.static( assetsDirectory ) )
                .get( '/W.min.js', W.jsMinMiddleware() );

    var server = http.createServer( app )
            .listen( port, function() {
                console.log( lcyan( "Pretense", "loading images from" )+ ":"  );
                console.log( bold( "\n   " + directory ) );
                console.log( "\non port:",  green( port ) );
            });

    app.get( '/directory-listing/', function ( req, res, next ) {
        fs.readdir( directory, function ( err, files ) {
            if ( err ) {
                return next( err );
            }
            W.loop( files.length, function ( i, next, end ) {
                if ( typeof imageSizeHash[ files[i] ] === "undefined"
                     && [ '.png', '.gif', 'jpeg', 'jpg', 'svg' ].indexOf( path.extname( files[i] ) ) > -1  ) {
                    var stream = fs.createReadStream( path.join( directory, files[i] ) );
                    imagesize( stream, function ( err, result ) {
                        if ( ! err ) {
                            imageSizeHash[ files[i] ] = result;
                        }
                        stream.unpipe();
                        next();
                    });
                } else {
                    next();
                }
            }, function () {
                res.json(200, files.reduce(function (acc, file) {
                    var data = imageSizeHash[file];
                    if ( data ) {
                        data.filename = file;
                        acc.push( data );
                    }
                    return acc;
                }, [])); 
            });
        });
    });

    app.get( '/image/:filename', function ( req, res, next ) {
        fs.createReadStream( path.join( directory, req.params.filename ) )
            .on('error', next)
            .pipe( res );
    });

    // #Socket Server
    var wss = new WebSocketServer( { server: server } );

    // Send the arguments of this function to all clients
    function sendBroadcastWith( resource ) {
        return function () {
            var args = Array.prototype.slice.call(arguments, 0);
            var data = {
                resource : resource,
                body : args
            };
            var json;
            try {
                json  = JSON.stringify( data );
            } catch ( exception ) {
                console.error( "failed to parse json for", data, exception );
            }
            wss.clients.forEach( function ( client ) {
                client.send( json );
            });
        };
    }

    // #File watching
    chokidar
        .watch( directory, { 
            ignored: /^\.|^_/, // hidden and illustator temporary files
            persistent: true 
        })
        .on( 'add', sendBroadcastWith( 'add' ) ) // [ path ]
        .on( 'change', sendBroadcastWith( 'change' ) )
        .on( 'unlink', sendBroadcastWith( 'unlink' ) );

// ##Console color
function green () { return "\033[1;32m" +  [].slice.apply(arguments).join(' ') + "\033[0m"; }
function lcyan () { return "\033[1;36m" + [].slice.apply(arguments).join(' ') + "\033[0m"; }
function bold () { return "\033[1m" + [].slice.apply(arguments).join(' ') + "\033[0m"; }
function red () { return "\033[0;31m" + [].slice.apply(arguments).join(' ') + "\033[0m"; }
};
