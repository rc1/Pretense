// Creates the whole system. Argv should come likely comfrom npm `optomist`. 
// Wrapped this way to app preseting some args from the binary
module.exports = function ( argv ) {

// #Dependencies
var http = require( "http" );
var fs = require( "fs" );
var path = require( "path" );
var util = require( "util" );

// ##NPM
var express = require( "express" );
var imagesize = require( "imagesize" );
var chokidar = require( "chokidar" );
var _ = require( "lodash" );

// #Config
var validImageFormats = [ "png" ];
var shouldCenter = process.env.SHOULD_CENTER || argv.c;
var title = process.env.TITLE || argv.t || "pretense";
var backgroundColor = process.env.BACKGROUND_COLOR || argv.b || "#FFFFFF";
var port = process.env.PORT || argv.p || 4000;
var imageFilesDirectory = path.resolve( argv.d || argv.dirname || path.join(__dirname, "assets/") );

// #Express
var app = express();
app.use( express.static( path.join( __dirname, "../assets" ) ) );
app.use( app.router );

// ##Settings
app.set( "port", port );
app.set( "views", path.join( __dirname, "../assets" ) );
app.set( "view engine", "jade" );

// #Images

var imageFiles = [];

// ## Image loading

// Now handled by the file watcher

// ##Routes
// Serves the main app view
app.get( "/", function ( req, res ) {
    res.render( "view", {
        title: title,
        files: imageFiles,
        backgroundColor: backgroundColor,
        shouldCenter: !!shouldCenter
    });
});

// Serves the files, requests the browser not to cache the image
app.get( "/i/:file", function ( req, res ) {
    // Stop the file from caching
    res.header( 'Cache-Control', 'no-cache, private, no-store, must-revalidate, max-stale=0, post-check=0, pre-check=0' );
    res.set( 'Content-Type', 'image/png' ); // set the header here
    // Stream out the file
    fs.createReadStream( path.join( imageFilesDirectory, req.params.file ) ).pipe( res );
});

function processFile ( filepath, callback ) {
    var imageFile = null;
    var stream = fs.createReadStream( filepath );
    imagesize(stream, function ( err, result ) {
        if ( err ) {
            // ignoring, as it probably means this is not an image
            //console.log( "imagesize error on ", filepath );
        }
        if ( !err && validImageFormats.indexOf( result.format ) > -1 ) {
           imageFile = {
                f: path.basename( filepath ),
                w: result.width,
                h: result.height
            };
        }
        stream.unpipe();
        callback( err, imageFile );
    });
}

// #Server
var server = http.createServer( app );

// Start
server.listen( app.get( "port" ), function() {
    console.log( lcyan( "Pretense", "loading images from" )+ ":"  );
    console.log( bold( "\n   " + imageFilesDirectory ) );
    console.log( "\non port:",  green( app.get( "port" ) ) );
});

// #Utils

// ##Image loading

function getImageFiles( callback ) {

    var imageFiles = [];

    fs.readdir( imageFilesDirectory , function ( err, files ) {

        // Ensure alphabetcical sorting
        files = files.sort();

        if ( err ) {
            callback( err );
            return;
        }   

        // Loop through each file sync
        loop( files.length, function ( index, next, end ) {

            var file = files[ index ];

            processFile( file, function ( err, imageFile ) {
                if ( !err && imageFile ) {
                    // ignoring the error as it is probably just not an image fiels
                    imageFiles.push( imageFile );
                }
                next();
            });

        }, finishedReadingAndStatingFile );

        function finishedReadingAndStatingFile () {
            callback( null, imageFiles );
        }

    });
}

// ## File watcher
// This keeps the `imageFiles` array up to date with latest changes
// It will also update the any clients of changes via the websocket connection

var fileWatcher = new chokidar.watch( imageFilesDirectory );

fileWatcher.on( "add", function ( file ) {
    addImageFile( file, function ( err ) {
        if ( err ) { console.log( "Error adding file on file system add", err ); return; } 
    });
});

fileWatcher.on( "unlink", function ( file ) {
    removeImageFile( file, function ( err ) {
        if ( err ) { console.log( "Error deleting file on file system remove", err ); return; } 
    });
});

fileWatcher.on( "change", function( file ) {
    removeImageFile( file, function ( err ) {
        if ( err ) { console.log( "Error deleting file on file system change", err ); return; } 
        addImageFile( file, function ( err ) {
            if ( err ) { console.log( "Error adding file on file system change", err ); return; } 
        });
    });
});

// ### File watcher utils

// callbacks ( null, null ) if file is invalud
function addImageFile( file, callback ) {
    processFile( file, function ( err, imageFile ) {
        if ( err ) {  
            if ( err === "invalid" ) {
                callback( null, null );
            } else {
                callback( err ); 
            }
            return;
        }
        imageFiles.push( imageFile );
        imageFiles = _.sortBy( imageFiles, "f" );
    });
}

function removeImageFile( filepath, callback ) {
    console.log( "Should be removing", file );
    var file = path.basename( filepath );
    imageFiles = _.remove( imageFiles, function ( imageFile ) {
        return imageFile.f !== file;
    });
    callback();
}

// ##Loop
function loop ( iterations, fn, callback ) {
    var index = 0;
    var done = false;
    var end =  function() {
        done = true;
        callback();
    };
    var next = function() {
        if (done) { return; }
        if (index < iterations) {
            index++;
            fn(index-1, next, end);
        } else {
            done = true;
            if (callback) { callback(); }
        }
    };
    next();
    return next;
}

// ##Console color
function green () { return "\033[1;32m" +  [].slice.apply(arguments).join(' ') + "\033[0m"; }
function lcyan () { return "\033[1;36m" + [].slice.apply(arguments).join(' ') + "\033[0m"; }
function bold () { return "\033[1m" + [].slice.apply(arguments).join(' ') + "\033[0m"; }
function red () { return "\033[0;31m" + [].slice.apply(arguments).join(' ') + "\033[0m"; }

};