"use strict";

var canvas;
var gl;

var points = [];

var NumTimesToSubdivide = 5;

window.onload = function init()
{
    canvas = document.getElementById( "gl-canvas" );

    gl = WebGLUtils.setupWebGL( canvas );
    if ( !gl ) { alert( "WebGL isn't available" ); }

    //
    //  Initialize our data for the Sierpinski Gasket
    //

    // First, initialize the corners of our gasket with three points.

    var vertices = [
        vec2( -1, 1 ),
        vec2(  1,  1 ),
        vec2(  1, -1 ),
        vec2( -1, -1 )
    ];

    divideSquare( vertices[0], vertices[1], vertices[2], vertices[3],
                    NumTimesToSubdivide);

    //
    //  Configure WebGL
    //
    gl.viewport( 0, 0, canvas.width, canvas.height );
    gl.clearColor( 1.0, 1.0, 1.0, 1.0 );

    //  Load shaders and initialize attribute buffers

    var program = initShaders( gl, "vertex-shader", "fragment-shader" );
    gl.useProgram( program );

    // Load the data into the GPU

    var bufferId = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, bufferId );
    gl.bufferData( gl.ARRAY_BUFFER, flatten(points), gl.STATIC_DRAW );

    // Associate out shader variables with our data buffer

    var vPosition = gl.getAttribLocation( program, "vPosition" );
    gl.vertexAttribPointer( vPosition, 2, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( vPosition );

    render();
};

function makeSquare( a, b, c, d )
{
    points.push( a, b, c, d, a, c);
}

function divideSquare( a, b, c, d, count )
{

    // check for end of recursion

    if ( count === 0 ) {
        makeSquare( a, b, c, d);
    }
    else {

        //bisect the sides

        var t1 = mix( a, b, 1/3 );
        var t2 = mix( a, b, 2/3 );
        var r1 = mix( b, c, 1/3 );
        var r2 = mix( b, c, 2/3 );
        var l1 = mix( a, d, 1/3 );
        var l2 = mix( a, d, 2/3 );
        var b1 = mix( d, c, 1/3 );
        var b2 = mix( d, c, 2/3 );
        var mt1 = mix( l1, r1, 1/3 );
        var mt2 = mix( l1, r1, 2/3 );
        var mb1 = mix( l2, r2, 1/3 );
        var mb2 = mix( l2, r2, 2/3 );

        --count;

        // three new triangles

        divideSquare( a, t1, mt1, l1, count );
        divideSquare( t1, t2, mt2, mt1, count );
        divideSquare( t2, b, r1, mt2, count );
        divideSquare( l1, mt1, mb1, l2, count );
        divideSquare( mt2, r1, r2, mb2, count );
        divideSquare( l2, mb1, b1, d, count );
        divideSquare( mb1, mb2, b2, b1, count );
        divideSquare( mb2, r2, c, b2, count );
    }
}

function render()
{
    gl.clear( gl.COLOR_BUFFER_BIT );
    gl.drawArrays( gl.TRIANGLES, 0, points.length );
}
