/////////////////////////////////////////////////////////////////
//    Verkefni 2 í Tölvugrafík
//
//    Helga Björg Helgadóttir, október 2024
/////////////////////////////////////////////////////////////////
var canvas;
var gl;

var NumVertices  = 36;

var points = [];
var colors = [];

var xAxis = 0;
var yAxis = 1;
var zAxis = 2;

var axis = 0;
var theta = [ 0, 0, 0 ];

var movement = false;
var spinX = -30;
var spinY = -30;
var origX;
var origY;

var matrixLoc;
var zoomFactor = 1.0;
let gridSize = 10;
let currentGrid = buaTilGrind(gridSize);
let nextGrid = buaTilGrind(gridSize);
let scales = stillaStaerd(gridSize);

let sidastaUppfaersla = Date.now();
var timabil = 1500;
let shrinkDuration = 150;

window.onload = function init()
{
    canvas = document.getElementById( "gl-canvas" );
    
    gl = WebGLUtils.setupWebGL( canvas );
    if ( !gl ) { alert( "WebGL isn't available" ); }

    colorCube();

    gl.viewport( 0, 0, canvas.width, canvas.height );
    gl.clearColor( 1.0, 1.0, 1.0, 1.0 );
    
    gl.enable(gl.DEPTH_TEST);

    var program = initShaders( gl, "vertex-shader", "fragment-shader" );
    gl.useProgram( program );
    
    var cBuffer = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, cBuffer );
    gl.bufferData( gl.ARRAY_BUFFER, flatten(colors), gl.STATIC_DRAW );

    var vColor = gl.getAttribLocation( program, "vColor" );
    gl.vertexAttribPointer( vColor, 4, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( vColor );

    var vBuffer = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, vBuffer );
    gl.bufferData( gl.ARRAY_BUFFER, flatten(points), gl.STATIC_DRAW );

    var vPosition = gl.getAttribLocation( program, "vPosition" );
    gl.vertexAttribPointer( vPosition, 3, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( vPosition );

    matrixLoc = gl.getUniformLocation( program, "transform" );

    canvas.addEventListener("mousedown", function(e){
        movement = true;
        origX = e.offsetX;
        origY = e.offsetY;
        e.preventDefault();
    });

    canvas.addEventListener("mouseup", function(e){
        movement = false;
    });

    canvas.addEventListener("mousemove", function(e){
        if(movement) {
    	    spinY = ( spinY + (origX - e.offsetX) ) % 360;
            spinX = ( spinX + (origY - e.offsetY) ) % 360;
            origX = e.offsetX;
            origY = e.offsetY;
        }
    });

    canvas.addEventListener("wheel", function(e){
        e.preventDefault();
        zoomFactor += e.deltaY * -0.001;
        zoomFactor = Math.min(Math.max(zoomFactor, 0.1), 5.0);
    });
    
    uppfaeraGrind();
    render();
}

function colorCube()
{
    quad( 1, 0, 3, 2 );
    quad( 2, 3, 7, 6 );
    quad( 3, 0, 4, 7 );
    quad( 6, 5, 1, 2 );
    quad( 4, 5, 6, 7 );
    quad( 5, 4, 0, 1 );
}

function quad(a, b, c, d) 
{
    var vertices = [
        vec3( -0.5, -0.5,  0.5 ),
        vec3( -0.5,  0.5,  0.5 ),
        vec3(  0.5,  0.5,  0.5 ),
        vec3(  0.5, -0.5,  0.5 ),
        vec3( -0.5, -0.5, -0.5 ),
        vec3( -0.5,  0.5, -0.5 ),
        vec3(  0.5,  0.5, -0.5 ),
        vec3(  0.5, -0.5, -0.5 )
    ];

    var vertexColors = [
        [ 0.0, 0.0, 0.0, 1.0 ],  // svartur
        [ 1.0, 0.0, 0.0, 1.0 ],  // rauður
        [ 1.0, 1.0, 0.0, 1.0 ],  // gulur
        [ 0.0, 1.0, 0.0, 1.0 ],  // grænn
        [ 0.0, 0.0, 1.0, 1.0 ],  // blár
        [ 1.0, 0.0, 1.0, 1.0 ],  // fjólubár
        [ 0.0, 1.0, 1.0, 1.0 ],  // ljósblár
        [ 1.0, 1.0, 1.0, 1.0 ]   // hvítur
    ];

    var indices = [ a, b, c, a, c, d ];

    for ( var i = 0; i < indices.length; ++i ) {
        points.push( vertices[indices[i]] );
        colors.push(vertexColors[a]);
        
    }
}

function buaTilGrind(staerd) {
    let grind = [];

    for (let x = 0; x < staerd; x++) {
        let slice = [];
        for (let y = 0; y < staerd; y++) {
            let row = [];
            for (let z = 0; z < staerd; z++) {
                row.push(Math.random() < 0.2); // 20% líkur á að kubbur sé lifandi
            }
            slice.push(row);
        }
        grind.push(slice);
    }
    return grind;
}

function buaTilKubba(mv) {
    let cubeSpacing = 0.11;

    for (let x = 0; x < gridSize; x++) {
        for (let y = 0; y < gridSize; y++) {
            for (let z = 0; z < gridSize; z++) {
                if (!currentGrid[x][y][z]) continue;

                let tx = (x - gridSize / 2) * cubeSpacing;
                let ty = (y - gridSize / 2) * cubeSpacing;
                let tz = (z - gridSize / 2) * cubeSpacing;
                
                let mvCube = mult(mv, translate(tx, ty, tz));
                mvCube = mult(mvCube, scalem(scales[x][y][z], scales[x][y][z], scales[x][y][z]));

                gl.uniformMatrix4fv(matrixLoc, false, flatten(mvCube));

                gl.drawArrays(gl.TRIANGLES, 0, NumVertices);
            }
        }
    }
}

function stillaStaerd(staerd) {
    let kubbastaerd = [];
    for (let x = 0; x < staerd; x++) {
        let slice = [];
        for (let y = 0; y < staerd; y++) {
            let row = [];
            for (let z = 0; z < staerd; z++) {
                row.push(0.1);
            }
            slice.push(row);
        }
        kubbastaerd.push(slice);
    }
    console.log(kubbastaerd);
    return kubbastaerd;
}

function teljaNagranna(grid, x, y, z) {
    let nagrannar = 0;
    for (let i = -1; i <= 1; i++) {
        for (let j = -1; j <= 1; j++) {
            for (let k = -1; k <= 1; k++) {
                if (i === 0 && j === 0 && k === 0) continue;
                let nx = x + i;
                let ny = y + j;
                let nz = z + k;

                if (nx >= 0 && ny >= 0 && nz >= 0 && nx < gridSize && ny < gridSize && nz < gridSize) {
                    if (grid[nx][ny][nz]) nagrannar++;
                }
            }
        }
    }
    return nagrannar;
}

function uppfaeraGrind() {
    for (let x = 0; x < gridSize; x++) {
        for (let y = 0; y < gridSize; y++) {
            for (let z = 0; z < gridSize; z++) {
                let nagrannar = teljaNagranna(currentGrid, x, y, z);

                if (currentGrid[x][y][z]) {
                    if (nagrannar < 5 || nagrannar > 7) {
                        let startShrinkTime = Date.now();

                        let shrinkInterval = setInterval(function() {
                            let elapsedTime = Date.now() - startShrinkTime;
                            let shrinkFactor = Math.max(0, 1 - elapsedTime / shrinkDuration);
                            scales[x][y][z] = shrinkFactor * 0.1;

                            if (shrinkFactor <= 0) {
                                clearInterval(shrinkInterval);
                                nextGrid[x][y][z] = false;
                            }
                        }, 16);
                    } else {
                        nextGrid[x][y][z] = true;
                    }
                } 
                else {
                    if (nagrannar === 6) {
                        nextGrid[x][y][z] = true;
                        let startGrowTime = Date.now();

                        let growInterval = setInterval(function() {
                            let elapsedTime = Date.now() - startGrowTime;
                            let growFactor = Math.min(1, elapsedTime / shrinkDuration);
                            scales[x][y][z] = growFactor * 0.1;

                            if (growFactor >= 1) {
                                clearInterval(growInterval);
                            }
                        }, 16);
                    }
                }
            }
        }
    }

    let temp = currentGrid;
    currentGrid = nextGrid;
    nextGrid = temp;
}

function render() {
    gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT );

    var mv = mat4();
    mv = mult(mv, rotateX(spinX));
    mv = mult(mv, rotateY(spinY));
    mv = mult(mv, scalem(zoomFactor, zoomFactor, zoomFactor));

    buaTilKubba(mv);

    let nuna = Date.now();
    if (nuna - sidastaUppfaersla > timabil) {
        uppfaeraGrind();
        sidastaUppfaersla = nuna;
    }

    window.requestAnimationFrame(render);
}