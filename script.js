// Three.js and Cannon.js Setup
let scene, camera, renderer, world;
let player1, player2, bullets = [];
let player1Health = 100, player2Health = 100;
let playerSpeed = 5, bulletSpeed = 0.5;
let playerBody1, playerBody2, groundBody, keys = {};

// Load Textures for Players and Ground
const textureLoader = new THREE.TextureLoader();
const groundTexture = textureLoader.load('https://cdn.pixabay.com/photo/2017/07/27/12/37/grass-2541042_960_720.jpg');
const playerTexture = textureLoader.load('https://i.imgur.com/JKCIBaR.png');

// Initialize Three.js and Cannon.js
function init() {
    // Scene and Camera Setup
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 10, 20);
    camera.lookAt(0, 0, 0);

    // Renderer
    renderer = new THREE.WebGLRenderer();
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.getElementById("gameContainer").appendChild(renderer.domElement);

    // Physics World (Cannon.js)
    world = new CANNON.World();
    world.gravity.set(0, -9.82, 0);

    // Ground
    const groundGeometry = new THREE.PlaneGeometry(100, 100);
    const groundMaterial = new THREE.MeshBasicMaterial({ map: groundTexture });
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    scene.add(ground);

    groundBody = new CANNON.Body({
        mass: 0, // Infinite mass for static object
        shape: new CANNON.Plane()
    });
    groundBody.quaternion.setFromEuler(-Math.PI / 2, 0, 0);
    world.addBody(groundBody);

    // Obstacles
    createObstacle(0, 1, 0);
    createObstacle(-5, 1, -5);
    createObstacle(5, 1, -5);

    // Players
    player1 = createPlayer(0xff0000, -5, playerTexture); // Red player
    player2 = createPlayer(0x0000ff, 5, playerTexture);  // Blue player
    playerBody1 = createPlayerBody(-5, 1);
    playerBody2 = createPlayerBody(5, 1);

    animate();
}

// Create a Player
function createPlayer(color, xPosition, texture) {
    const geometry = new THREE.BoxGeometry(1, 1, 1);
    const material = new THREE.MeshBasicMaterial({ map: texture });
    const player = new THREE.Mesh(geometry, material);
    player.position.x = xPosition;
    player.position.y = 1;
    scene.add(player);
    return player;
}

// Create a Player Physics Body
function createPlayerBody(x, y) {
    const shape = new CANNON.Box(new CANNON.Vec3(0.5, 0.5, 0.5));
    const body = new CANNON.Body({ mass: 1, shape });
    body.position.set(x, y, 0);
    world.addBody(body);
    return body;
}

// Create an Obstacle
function createObstacle(x, y, z) {
    const geometry = new THREE.BoxGeometry(2, 2, 2);
    const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
    const obstacle = new THREE.Mesh(geometry, material);
    obstacle.position.set(x, y, z);
    scene.add(obstacle);

    const shape = new CANNON.Box(new CANNON.Vec3(1, 1, 1));
    const obstacleBody = new CANNON.Body({ mass: 0, shape });
    obstacleBody.position.set(x, y, z);
    world.addBody(obstacleBody);
}

// Shooting
function shoot(player, direction) {
    const bullet = createBullet(player.position.clone(), direction);
    bullets.push(bullet);
}

// Create Bullet
function createBullet(position, direction) {
    const geometry = new THREE.SphereGeometry(0.2, 16, 16);
    const material = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const bullet = new THREE.Mesh(geometry, material);
    bullet.position.copy(position);
    bullet.direction = direction;
    scene.add(bullet);
    return bullet;
}

// Bullet Physics and Collision
function moveBullets() {
    bullets.forEach((bullet, index) => {
        bullet.position.add(bullet.direction.multiplyScalar(bulletSpeed));

        // Check for collisions with players
        if (bullet.position.distanceTo(player1.position) < 1) {
            player1Health -= 10;
            document.getElementById('health1').textContent = player1Health;
            scene.remove(bullet);
            bullets.splice(index, 1);
        } else if (bullet.position.distanceTo(player2.position) < 1) {
            player2Health -= 10;
            document.getElementById('health2').textContent = player2Health;
            scene.remove(bullet);
            bullets.splice(index, 1);
        }

        // Remove bullets off-screen
        if (bullet.position.length() > 50) {
            scene.remove(bullet);
            bullets.splice(index, 1);
        }
    });
}

// Move Players
function movePlayers() {
    // Player 1 (WASD)
    if (keys['w']) playerBody1.position.z -= playerSpeed;
    if (keys['s']) playerBody1.position.z += playerSpeed;
    if (keys['a']) playerBody1.position.x -= playerSpeed;
    if (keys['d']) playerBody1.position.x += playerSpeed;

    // Player 2 (Arrow keys)
    if (keys['ArrowUp']) playerBody2.position.z -= playerSpeed;
    if (keys['ArrowDown']) playerBody2.position.z += playerSpeed;
    if (keys['ArrowLeft']) playerBody2.position.x -= playerSpeed;
    if (keys['ArrowRight']) playerBody2.position.x += playerSpeed;
}

// Main Game Loop
function animate() {
    requestAnimationFrame(animate);

    world.step(1 / 60); // Step the physics world

    player1.position.copy(playerBody1.position);
    player2.position.copy(playerBody2.position);

    movePlayers();
    moveBullets();

    // Game Over Condition
    if (player1Health <= 0 || player2Health <= 0) {
        alert(player1Health <= 0 ? "Player 2 Wins!" : "Player 1 Wins!");
        resetGame();
    }

    renderer.render(scene, camera);
}

// Reset Game
function resetGame() {
    player1Health = 100;
    player2Health = 100;
    document.getElementById('health1').textContent = player1Health;
    document.getElementById('health2').textContent = player2Health;
    bullets.forEach(bullet => scene.remove(bullet));
    bullets = [];
}

// Handle Keyboard Input
window.addEventListener('keydown', (e) => {
    keys[e.key] = true;
    if (e.key === ' ') shoot(player1, new THREE.Vector3(1, 0, 0)); // Player 1 shoots (Space)
    if (e.key === 'Enter') shoot(player2, new THREE.Vector3(-1, 0, 0)); // Player 2 shoots (Enter)
});
window.addEventListener('keyup', (e) => {
    keys[e.key] = false;
});

// Initialize the game
init();
