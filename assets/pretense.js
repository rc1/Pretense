// Client side pretense implementation.
// Requires (all provided by pretense server):
// * W.js
// * jQuery
// * underscore

// # Pretense & pretense
// Options:
// * $el<jQuery> - element to change background image on
// * bindToClicks<Bool> _optionaL_ `true` - calls next when window clicked
// * bindToKeypress<Bool> _optionaL_ `true` - calls next when document keypress
// * host<String> _optional_ `"localhost"`
// * port<Number> _optional_ `4000`
// * updateHash<Bool> _optional_ true - add the current file name in the window.location.hash
function pretense( options ) {
    return new Pretense( options );
}

function Pretense ( options ) {
    var self = this;

    this.options = options || {};
    this.$el = options.$el;

    this.files = [];
    this.currentFilename = null;

    // Add the socket connection
    var socket = new W.JSONSocketConnection({
        socketUrl : 'ws://'+(options.host||'localhost')+':'+(options.port||4000)+'/'
    });
    // Add sockets events
    socket
        .on( 'message', W.bind( this.updateFiles, this ) )
        .on( 'open', function () {
            console.log( 'Connected to Pretense server' );
        })
        .on( 'closed', function () {
            console.log( 'Connection to Pretense server failed. Will re-attempt connection.' );
        })
        .openSocketConnection();
    // Add window events
    if ( (typeof options.bindToClicks === 'undefined') ? true : options.bindToClicks ) {
        $( window ).on( 'click touch', W.bind( this.next, this ) );
    }
    if ( (typeof options.bindToKeypress === 'undefined') ? true : options.bindToKeypress ) {
        $( window )
            .on( 'keydown', whenLeft( this.previous ) )
            .on( 'keydown', whenRight( this.next ) );
    }

    // Utils
    function whenLeft( fn ) {
        return function ( e ) {
            if ( e.keyCode == 37 ) { fn.apply( self ); }
        };
    }

    function whenRight( fn ) {
        return function ( e ) {
            if ( e.keyCode == 39 ) { fn.apply( self ); }
        };
    }
    
    var fileToLoad = null;
    if ( (typeof this.options.updateHash === 'undefined') ? true : this.options.updateHash ) {
        var hashComponents = window.location.hash.split( "/" );
        if ( hashComponents.length === 2 ) {
            fileToLoad = hashComponents[1];
        }
    }
    this.updateFiles( fileToLoad );
}

Pretense.prototype.updateFiles = function ( fileToGoTo ) {
    var self = this;
    superagent( 'http://'+(W.isOk(self.options.host)||'localhost')+':'+(W.isOk(self.options.port)||4000)+'/directory-listing/' )
        .end( function ( res ) {
            if ( res.ok ) {
                var incoming = res.body;
                // See what the difference is
                var differenceInIncoming = incoming.filter( function( file ) { 
                        var index = findLastIndex( self.files, function ( existingFile ) {
                        return existingFile.filename === file.filename;
                    });
                    return index === -1;
                });
                // Set the next data
                self.files = incoming;
                // Go to the different file if there is one
                if ( W.isOk(fileToGoTo) ) { 
                    var index = findLastIndex( self.files, function (file) {
                        return file.filename === fileToGoTo; 
                    });
                    if ( index > -1 ) {
                        return self.setFile( self.files[ index ] );
                    }
                }
                if ( differenceInIncoming.length > 0 ) {
                    setTimeout( function () {
                        self.setFile( differenceInIncoming[ differenceInIncoming.length-1 ] );
                    }, 100);
                }
            } else {
                console.log( 'failed to get directory-listing' );
            }
        });
};

Pretense.prototype.previous = function () {
    var self = this;
    if ( this.currentFilename === null ) {
        this.setFile( this.getLastFile() );
    } else {
        // try to find the current file index
        var index = findLastIndex( this.files, function (file) {
            return file.filename === self.currentFilename; 
        });
        if ( index === -1 ) {
            // not found, load the last
            this.setFile( this.getLastFile() );
        } else if ( index === 0 ) {
            // there are no previous files, do nothing
        } else {
            // set the file to the previous
            this.setFile( this.files[ index-1 ] );
        }
    }
    return this;
};

Pretense.prototype.next = function () {
    var self = this;
    if ( this.currentFilename === null ) {
        // no file, so load the last
        this.setFile( this.getLastFile() );
    } else {
        // try to find the current file index
        var index = findLastIndex( this.files, function (file) {
            return file.filename === self.currentFilename; 
        });
        if ( index === -1 ) {
            // not found, load the last
            this.setFile( this.getLastFile() );
        } else if ( index === this.files.length-1 ) {
            // we are at the last, do nothing
        } else {
            // set it to the next one
            this.setFile( this.files[ index+1 ] );
        }
    }
    return this;
};

Pretense.prototype.getLastFile = function () {
    return ( this.files.length === 0 ) ? false : this.files[ this.files.length-1 ];
};

// this updates the image, and could be overridded
// maybe passed false instead pf a file
Pretense.prototype.setFile = function ( file ) {
    if ( !file || file.filename === this.currentFilename ) {
        return this;
    }
    this.currentFilename = file.filename;
    this.$el.css( {
        'background-image' : 'url(http://'+(W.isOk(this.options.host)||'localhost')+':'+(W.isOk(this.options.port)||4000)+'/image/'+encodeURI(this.currentFilename)+')',
        'width' : file.width,
        'height' : file.height });

    if ( (typeof this.options.updateHash === 'undefined') ? true : this.options.updateHash ) {
        window.location.hash = '/' + this.currentFilename;
    }
    return this;
};

// comparitor should return true if found
function findLastIndex( arr, comparitor ) {
    var index = -1;
    arr.forEach( function ( item, i, arr ) {
        if ( comparitor( item, i, arr ) ) {
            index = i;
        }
    });
    return index;
}

