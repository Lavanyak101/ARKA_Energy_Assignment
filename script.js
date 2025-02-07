// Setup Three.js Scene
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Add Light
const light = new THREE.AmbientLight(0xffffff, 1.5);
scene.add(light);

// Add a ground plane
const planeGeometry = new THREE.PlaneGeometry(20, 20);
const planeMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.DoubleSide });
const plane = new THREE.Mesh(planeGeometry, planeMaterial);
plane.rotation.x = -Math.PI / 2;
scene.add(plane);

// Add a Grid Helper
const gridHelper = new THREE.GridHelper(20, 20);
scene.add(gridHelper);

// Camera positioning
camera.position.set(0, 10, 15);
camera.lookAt(0, 0, 0);

// Store vertices and polygon objects
let vertices = [];
let polygon = null;
let copiedPolygon = null;
let isMoving = false;

// Function to create a vertex at mouse click
window.addEventListener('click', (event) => {
    if (isMoving) return;

    const mouse = new THREE.Vector2();
    const raycaster = new THREE.Raycaster();

    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObject(plane);

    if (intersects.length > 0) {
        let point = intersects[0].point;

        // Ensure unique vertices (remove duplicate clicks)
        const isDuplicate = vertices.some(v => v.x === point.x && v.z === point.z);
        if (!isDuplicate) {
            vertices.push(point);
            drawVertices();
        }
    }
});

// Function to display vertices
function drawVertices() {
    vertices.forEach((v) => {
        const sphere = new THREE.SphereGeometry(0.1, 16, 16);
        const material = new THREE.MeshBasicMaterial({ color: 0xff0000 });
        const pointMesh = new THREE.Mesh(sphere, material);
        pointMesh.position.copy(v);
        scene.add(pointMesh);
    });
}

// Function to complete the polygon (Final Fix - Correct Positioning)
document.getElementById('completeBtn').addEventListener('click', () => {
    if (vertices.length < 3) {
        alert("At least 3 points are required to form a polygon.");
        return;
    }

    // Find center of the points
    const center = vertices.reduce((acc, v) => ({
        x: acc.x + v.x / vertices.length,
        z: acc.z + v.z / vertices.length
    }), { x: 0, z: 0 });

    // Sort points COUNTERCLOCKWISE to ensure correct polygon shape
    const sortedVertices = vertices.slice().sort((a, b) => {
        const angleA = Math.atan2(a.z - center.z, a.x - center.x);
        const angleB = Math.atan2(b.z - center.z, b.x - center.x);
        return angleB - angleA;
    });

    // Create the shape
    const shape = new THREE.Shape();
    shape.moveTo(sortedVertices[0].x - center.x, sortedVertices[0].z - center.z);

    // Connect all points
    for (let i = 1; i < sortedVertices.length; i++) {
        shape.lineTo(sortedVertices[i].x - center.x, sortedVertices[i].z - center.z);
    }

    shape.lineTo(sortedVertices[0].x - center.x, sortedVertices[0].z - center.z); // Close the shape

    const geometry = new THREE.ShapeGeometry(shape);
    polygon = new THREE.Mesh(
        geometry,
        new THREE.MeshBasicMaterial({ color: 0x00ff00, side: THREE.DoubleSide })
    );

    // Fix positioning offset
    polygon.rotation.x = -Math.PI / 2;
    polygon.position.set(center.x, 0.1, center.z); // Centered at the correct position
    scene.add(polygon);
});

// Copy Polygon Feature (Fixed)
document.getElementById('copyBtn').addEventListener('click', () => {
    if (!polygon) return alert("No polygon to copy.");

    copiedPolygon = polygon.clone();
    copiedPolygon.material = new THREE.MeshBasicMaterial({ color: 0xffa500, side: THREE.DoubleSide, transparent: true, opacity: 0.7 });
    copiedPolygon.position.set(0, 0.1, 0);
    scene.add(copiedPolygon);
    isMoving = true;

    // Debug panel update
    document.getElementById('copyExists').innerText = "Yes";
    document.getElementById('isMoving').innerText = "Yes";
});

// Move Copy with Mouse (Fixed)
window.addEventListener('pointermove', (event) => {
    if (!isMoving || !copiedPolygon) return;

    const mouse = new THREE.Vector2();
    const raycaster = new THREE.Raycaster();

    // Convert screen coordinates to world coordinates
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObject(plane);

    if (intersects.length > 0) {
        let point = intersects[0].point;
        copiedPolygon.position.set(point.x, 0.1, point.z);
        document.getElementById('isMoving').innerText = "Yes"; // Update debug panel
    }
});

// Fix Copy at Final Position on Click
window.addEventListener('pointerdown', () => {
    if (isMoving) {
        isMoving = false;
        document.getElementById('isMoving').innerText = "No";
    }
});

// Fully Working Reset Button
document.getElementById('resetBtn').addEventListener('click', () => {
    // Remove all objects from the scene
    for (let i = scene.children.length - 1; i >= 0; i--) {
        let obj = scene.children[i];
        if (obj !== plane && obj !== gridHelper) {
            scene.remove(obj);
        }
    }

    // Clear all variables
    vertices = [];
    polygon = null;
    copiedPolygon = null;
    isMoving = false;

    // Reset Debug Panel
    document.getElementById('totalObjects').innerText = "0";
    document.getElementById('copyExists').innerText = "No";
    document.getElementById('isMoving').innerText = "No";

    console.log("Scene fully reset!"); // Debug message
});

// Update Debug Info Every Second
function updateDebug() {
    document.getElementById('totalObjects').innerText = scene.children.length;
    document.getElementById('copyExists').innerText = copiedPolygon ? "Yes" : "No";
    document.getElementById('isMoving').innerText = isMoving ? "Yes" : "No";
}

setInterval(updateDebug, 1000);

// Animation Loop
function animate() {
    requestAnimationFrame(animate);
    renderer.render(scene, camera);
}
animate();














