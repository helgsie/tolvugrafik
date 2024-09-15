/////////////////////////////////////////////////////////////////
//    Sýnidæmi í Tölvugrafík
//     Sýnir notkun á "mousedown" og "mousemove" atburðum
//
//    Hjálmtýr Hafsteinsson, september 2024
/////////////////////////////////////////////////////////////////
var canvas;
var gl;
//var vPosition;

var mouseX;             // Old value of x-coordinate  
var movement = false;   // Do we move the paddle?
var birds = [];
var birdVertices;
var birdBufferId;
var gunVertices;
var bulletVertices;
var bullets = [];
var bulletFired = false;
var maxBullets = 3;
var maxBirds = 3;
var stopper = false;
var stig = "";

// Byssa
var gunPosition = vec2(0.0, 0.4);

// Litir
const gunColor = vec4(0.0, 0.0, 1.0, 1.0);
const bulletColor = vec4(1.0, 0.2, 0.0, 1.0);
const birdColor = vec4(0.0, 5.0, 8.0, 1.0);

window.onload = function init() {

    canvas = document.getElementById( "gl-canvas" );
    
    gl = WebGLUtils.setupWebGL( canvas );
    if ( !gl ) { alert( "WebGL isn't available" ); }
    
    gl.viewport( 0, 0, canvas.width, canvas.height );
    gl.clearColor( 0.8, 0.8, 0.8, 1.0 );

    //
    //  Load shaders and initialize attribute buffers
    //
    var program = initShaders( gl, "vertex-shader", "fragment-shader" );
    gl.useProgram( program );

    gunVertices = [
        vec2( -0.1, -0.9 ),
        vec2( 0, -0.8 ),
        vec2(  0.1, -0.9 )
    ];
    
    // Load the data into the GPU
    var bufferId = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, bufferId );

    // Associate out shader variables with our data buffer
    var vPosition = gl.getAttribLocation( program, "vPosition" );
    gl.vertexAttribPointer( vPosition, 2, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( vPosition );

    // Event listeners for mouse
    canvas.addEventListener("mousedown", function(e){
        mouseX = e.clientX;
        console.log(e.clientX);
        movement = true;
    } );

    canvas.addEventListener("mouseup", function(e){
        movement = false;
    } );

    canvas.addEventListener("mousemove", function(e){
        if(movement) {
            var xmove = 2 * (e.clientX - mouseX) / canvas.width;
            console.log(e.clientX);
            mouseX = e.clientX;
            for(var i = 0; i < 3; i++) {
                gunVertices[i][0] += xmove;
            }

            gl.bufferSubData(gl.ARRAY_BUFFER, 0, flatten(gunVertices));
        }
    });

    makeBirds(7);
    render();
}

function makeBirds(count) {
    // fylla fylkið birds með 3 handahófskennt staðsettum "fuglum"
    for (var i = 0; i < count; i++) {
        var birdX = Math.random() * 1.6 - 0.8;
        var birdY = Math.random() * 0.7 + 0.3;
        var birdWidth = 0.15;
        var birdHeight = 0.075;
        var birdSpeed = Math.random() * 0.007 + 0.005;
        var birdDirection = Math.random() < 0.5 ? -1 : 1;

        birds.push({ x: birdX, y: birdY, width: birdWidth, height: birdHeight, speed: birdSpeed, direction: birdDirection });
    }
}

function renderBirds() {
    birds.forEach(function(bird, index) {
        bird.x += bird.speed * bird.direction;

        if (bird.x + bird.width < -1.0) {
            bird.x = 1;
            bird.y = Math.random() * 0.7 + 0.3;
            bird.direction = Math.random() < 0.5 ? -1 : 1;
        }
        if (bird.x > 1.0) {
            bird.x = -1.15;
            bird.y = Math.random() * 0.7 + 0.3;
            bird.direction = Math.random() < 0.5 ? -1 : 1;
        }

        bullets = bullets.filter(function(bullet) {
            return bullet.y < 1.0;
        });

        birdVertices = [
            vec2(bird.x, bird.y),
            vec2(bird.x + bird.width, bird.y),
            vec2(bird.x + bird.width, bird.y - bird.height),
            vec2(bird.x, bird.y - bird.height)
        ];

        var birdBufferId = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, birdBufferId);
        gl.bufferData(gl.ARRAY_BUFFER, flatten(birdVertices), gl.DYNAMIC_DRAW);

        var vPosition = gl.getAttribLocation(gl.getParameter(gl.CURRENT_PROGRAM), "vPosition");
        gl.vertexAttribPointer(vPosition, 2, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(vPosition);

        gl.drawArrays(gl.TRIANGLE_FAN, 0, 4);
    });
}

function renderGun() {
    gl.bufferData( gl.ARRAY_BUFFER, flatten(gunVertices), gl.DYNAMIC_DRAW );
    gl.drawArrays( gl.TRIANGLE_FAN, 0, 3 );
    gl.bufferSubData(gl.ARRAY_BUFFER, 0, flatten(gunVertices));
}

function renderBullet() {
    var bulletWidth = 0.01;
    var bulletX = gunVertices[1][0] - (bulletWidth/2);
    var bulletY = -0.9;
    var bulletHeight = 0.1;
    var bulletSpeed = 0.1;
    bullets.push({ x: bulletX, y: bulletY, width: bulletWidth, height: bulletHeight, speed: bulletSpeed });
}

function updateBullets() {
    bullets.forEach(function (bullet) {
        bullet.y += bullet.speed;
    });

    bullets = bullets.filter(function(bullet) {
        return bullet.y < 1.0;
    });
}

function drawBullets() {
    bullets.forEach(function(bullet) {
        var bulletVertices = [
            vec2(bullet.x, bullet.y),
            vec2(bullet.x + bullet.width, bullet.y),
            vec2(bullet.x + bullet.width, bullet.y + bullet.height),
            vec2(bullet.x, bullet.y + bullet.height)
        ];

        gl.bufferData(gl.ARRAY_BUFFER, flatten(bulletVertices), gl.DYNAMIC_DRAW);
        gl.bufferSubData(gl.ARRAY_BUFFER, 0, flatten(bulletVertices));
        gl.drawArrays(gl.TRIANGLE_FAN, 0, 4);
    });
}

function shoot() {
    window.addEventListener("keydown", (event) => {
        if (event.code === 'Space' && !stopper && bullets.length < maxBullets) {
            stopper = true;
            renderBullet();
            bulletFired = true;
        }
    });

    window.addEventListener("keyup", (event) => {
        if (event.code === 'Space') {
            stopper = false;
        }
    });
}

function detectCollision(bird, bullet) {
    for (var i = 0; i < bullets.length; i++) {
        var bullet = bullets[i];

        var bulletTop = bullet.y + bullet.height;
        var bulletBottom = bullet.y;
        var bulletLeft = bullet.x;
        var bulletRight = bullet.x + bullet.width;

        for (var j = 0; j < birds.length; j++) {
            var bird = birds[j];

            var birdTop = bird.y + bird.height;
            var birdBottom = bird.y;
            var birdLeft = bird.x;
            var birdRight = bird.x + bird.width;

            if (bulletRight > birdLeft && 
                bulletLeft < birdRight &&
                bulletTop > birdBottom &&
                bulletBottom < birdTop) {

                bullets.splice(i, 1);
                birds.splice(j, 1);
                stig += "|";
                document.getElementById("stig").innerText = `Stig: ${stig}`;

                i--;
                break;
            }
        }
    }

    
}

function render() {
    gl.clear( gl.COLOR_BUFFER_BIT );
    renderGun();
    renderBirds();
    if (bulletFired) {
        updateBullets();
        drawBullets();
    }
    shoot();
    detectCollision();

    window.requestAnimationFrame(render);
}
