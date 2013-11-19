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
var imageS = require( "image-size" );

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

// ##Routes
app.get( "/", function ( req, res ) {
    getImageFiles( function ( err, files ) {
        // If there was an error loading the files report it
        if ( err ) {
            res.json( 500, err );
            return;
        }
        res.render( "view", {
            title: title,
            files: files,
            backgroundColor: backgroundColor,
            shouldCenter: !!shouldCenter
        });

    });
});

app.get( "/i/:file", function ( req, res ) {
    // Stop the file from caching
    res.header( 'Cache-Control', 'no-cache, private, no-store, must-revalidate, max-stale=0, post-check=0, pre-check=0' );
    res.set( 'Content-Type', 'image/png' ); // set the header here
    // Stream out the file
    fs.createReadStream( path.join( imageFilesDirectory, req.params.file ) ).pipe( res );
});


// #Server
var server = http.createServer( app );

// Start
server.listen( app.get( "port" ), function() {
    console.log( lcyan( "Pretense", "loading images from" )+ ":"  );
    console.log( bold( "\n   " + imageFilesDirectory ) );
    console.log( "\non port:",  green( app.get( "port" ) ) );
});

// #Utils

// ##Files
function getImageFiles( callback ) {
    // could be faster by not stating images ever request

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

            var stream = fs.createReadStream( path.join( imageFilesDirectory, file ) );
            imagesize(stream, function ( err, result ) {
                if ( err ) {
                    // do nothing, presume the file was not an image
                } else if ( validImageFormats.indexOf( result.format ) > -1 ) {
                    imageFiles.push( {
                        f: file,
                        w: result.width,
                        h: result.height
                    });
                }
                stream.unpipe();
                next();
            });

        }, finishedReadingAndStatingFile );

        function finishedReadingAndStatingFile () {
            callback( null, imageFiles );
        }

    });
}

// ##Loop
function loop (iterations, fn, callback) {
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
function green() { return "\033[1;32m" +  [].slice.apply(arguments).join(' ') + "\033[0m"; }
function lcyan() { return "\033[1;36m" + [].slice.apply(arguments).join(' ') + "\033[0m"; }
function bold() { return "\033[1m" + [].slice.apply(arguments).join(' ') + "\033[0m"; }

};