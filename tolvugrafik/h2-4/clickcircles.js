/////////////////////////////////////////////////////////////////
//    Sýnidæmi í Tölvugrafík
//     Teiknar punkt á strigann þar sem notandinn smellir
//     með músinni
//
//    Hjálmtýr Hafsteinsson, ágúst 2024
/////////////////////////////////////////////////////////////////
var canvas;
var gl;

// Þarf hámarksfjölda punkta til að taka frá pláss í grafíkminni
var maxNumPoints = 200;  
var index = 0;
var numCirclePoints = 20;
var center = vec2(0,0);
var points = [];
var circles = [];

window.onload = function init() {

    canvas = document.getElementById( "gl-canvas" );
    
    gl = WebGLUtils.setupWebGL( canvas );
    if ( !gl ) { alert( "WebGL isn't available" ); }
    
    gl.viewport( 0, 0, canvas.width, canvas.height );
    gl.clearColor( 0.95, 1.0, 1.0, 1.0 );

    //
    //  Load shaders and initialize attribute buffers
    //
    var program = initShaders( gl, "vertex-shader", "fragment-shader" );
    gl.useProgram( program );
    
    var vBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, 8 * maxNumPoints * numCirclePoints, gl.DYNAMIC_DRAW);
    
    var vPosition = gl.getAttribLocation(program, "vPosition");
    gl.vertexAttribPointer(vPosition, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vPosition);
    
    canvas.addEventListener("mousedown", function(e){

        gl.bindBuffer( gl.ARRAY_BUFFER, vBuffer);
        
        // Calculate coordinates of new point
        var t = vec2(2*e.offsetX/canvas.width-1, 2*(canvas.height-e.offsetY)/canvas.height-1);
        var radius = Math.random() / 10;
        var newCircle = createCircle(t, radius, numCirclePoints);
        
        // Add new point behind the others
        for (var i = 0; i < newCircle.length; i++) {
            gl.bufferSubData(gl.ARRAY_BUFFER, 8*index, flatten(newCircle[i]));
            index++;
        }
        circles.push(newCircle.length);
    } );

    render();
}

function createCircle(cent, radius, n) {

    var circlePoints = [];
    circlePoints.push(cent);

    var dAngle = 2 * Math.PI / n;
    for (var i = 0; i <= n; i++) {
        var a = i * dAngle;
        var p = vec2(radius * Math.sin(a) + cent[0], radius * Math.cos(a) + cent[1]);
        circlePoints.push(p);
    }
    //var circle = gl.drawArrays( gl.TRIANGLE_FAN, 0, circlePoints.length );
    return circlePoints;
}

function render() {
    
    gl.clear( gl.COLOR_BUFFER_BIT );
    var start = 0;
    for (var i = 0; i < circles.length; i++) {
        gl.drawArrays( gl.TRIANGLE_FAN, start, circles[i] );
        start += circles[i];
    }

    window.requestAnimFrame(render);
}
