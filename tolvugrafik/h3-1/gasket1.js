"use strict";

var gl;
var points;
var program;
var canvas;
var stopper = false;
var mouseX = 0;
var mouseY = 0;
var movement = false;
var vertices;
var NumPoints = 5000;
var tColor = vec4(1.0, 0.0, 0.0, 1.0);
var uColorLocation;

window.onload = function init()
{
    canvas = document.getElementById( "gl-canvas" );

    gl = WebGLUtils.setupWebGL( canvas );
    if ( !gl ) { alert( "WebGL isn't available" ); }

    //
    //  Initialize our data for the Sierpinski Gasket
    //

    // First, initialize the corners of our gasket with three points.
    vertices = [
        vec2( -1, -1 ),
        vec2(  0,  1 ),
        vec2(  1, -1 )
    ];

    // Specify a starting point p for our iterations
    // p must lie inside any set of three vertices
    var u = add( vertices[0], vertices[1] );
    var v = add( vertices[0], vertices[2] );
    var p = scale( 0.25, add( u, v ) );

    // And, add our initial point into our array of points
    points = [ p ];

    // Compute new points
    // Each new point is located midway between
    // last point and a randomly chosen vertex
    for ( var i = 0; points.length < NumPoints; ++i ) {
        var j = Math.floor(Math.random() * 3);
        p = add( points[i], vertices[j] );
        p = scale( 0.5, p );
        points.push( p );
    }

    //
    //  Configure WebGL
    //
    gl.viewport( 0, 0, canvas.width, canvas.height );
    gl.clearColor( 1.0, 1.0, 1.0, 1.0 );

    //  Load shaders and initialize attribute buffers
    program = initShaders( gl, "vertex-shader", "fragment-shader" );
    gl.useProgram( program );

    // Load the data into the GPU
    var bufferId = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, bufferId );
    gl.bufferData( gl.ARRAY_BUFFER, flatten(points), gl.STATIC_DRAW );

    // Associate out shader variables with our data buffer
    var vPosition = gl.getAttribLocation( program, "vPosition" );
    gl.vertexAttribPointer( vPosition, 2, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( vPosition );

    // Set default color to red
    uColorLocation = gl.getUniformLocation(program, "uColor");
    gl.uniform4fv(uColorLocation, flatten(tColor));

    moveTriangle();
    render();
};

function moveTriangle() {
    canvas.addEventListener("mousedown", function(e) {
        mouseX = e.clientX;
        mouseY = e.clientY;
        movement = true;
    });

    canvas.addEventListener("mouseup", function(e) {
        movement = false;
    });

    canvas.addEventListener("mousemove", function(e) {
        if(movement) {
            var xmove = 2 * (e.clientX - mouseX) / canvas.width;
            var ymove = 2 * (e.clientY - mouseY) / canvas.height;
            mouseX = e.clientX;
            mouseY = e.clientY;

            for(var i = 0; i < points.length; i++) {
                points[i][0] += xmove;
                points[i][1] -= ymove;
            }

            gl.bufferSubData(gl.ARRAY_BUFFER, 0, flatten(points));
        }
    });

    let scale = 1.0;

    canvas.addEventListener("wheel", function(e) {
        e.preventDefault();

        scale += e.deltaY * -0.001;
        for (var i = 0; i < points.length; i++) {
            points[i][0] *= scale;
            points[i][1] *= scale;
        }

        gl.bufferSubData(gl.ARRAY_BUFFER, 0, flatten(points));
    });
}

function changeColor() {
    window.addEventListener("keydown", (event ) => {
        if (event.code === 'Space' && !stopper) {
            stopper = true;
            var red = Math.random();
            var green = Math.random();
            var blue = Math.random();
            tColor = vec4(red, green, blue, 1.0);

            uColorLocation = gl.getUniformLocation( program, "uColor");
            gl.uniform4fv(uColorLocation, flatten(tColor));
            render();
        }
    });

    window.addEventListener("keyup", (event) => {
        if (event.code === 'Space') {
            stopper = false;
        }
    });
}


function render() {
    gl.clear( gl.COLOR_BUFFER_BIT );
    changeColor();
    gl.drawArrays( gl.POINTS, 0, points.length );
    requestAnimationFrame(render);
}
