let scene = new THREE.Scene();
let camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
let renderer = new THREE.WebGLRenderer({ alpha: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setClearColor(0x000000, 0);
document.body.appendChild(renderer.domElement);

function findVertex(a, b, c) {
    const ab = new THREE.Vector3().subVectors(b, a);
    const ac = new THREE.Vector3().subVectors(c, a);
    const abxac = new THREE.Vector3().crossVectors(ab, ac);
    const norm_abxac = abxac.length();
    const ed = abxac.normalize();

    const ag = new THREE.Vector3().addVectors(ab, ac).multiplyScalar(1/3);
    const sol = [];

    const coeffA = 1 / (2 * Math.sqrt(ed.lengthSq()));
    const coeffB = -ed.dot(ag);
    const coeffC = Math.sqrt(ed.dot(ag) ** 2 - 4 * ed.lengthSq() * (ag.lengthSq() - ab.lengthSq()));
    
    sol[0] = coeffA * (coeffB + coeffC);
    sol[1] = coeffA * (coeffB - coeffC);

    const d1 = new THREE.Vector3().addVectors(a, ed.multiplyScalar(sol[0])).add(ag);
    const d2 = new THREE.Vector3().addVectors(a, ed.multiplyScalar(sol[1])).add(ag);

    return [d1, d2];
}

function nearVlist(p, vlistwc, elength) {
    for (let [vec] of vlistwc) {
        if (vec.distanceTo(p) < 0.999 * elength) {
            return true;
        }
    }
    return false;
}

function nearVlistWC(p, c, vlistwc, elength) {
    for (let [vec, color] of vlistwc) {
        if (c === color && vec.distanceTo(p) < Math.sqrt(3) * elength) {
            return true;
        }
    }
    return false;
}


function collectSimulationData(iterations) {
    let ans = new Object();
    let a = new THREE.Vector3(1, 0, 0);
    let b = new THREE.Vector3(0, 1, 0);
    let c = new THREE.Vector3(0, 0, 1);
    let dlist = findVertex(a, b, c);
    console.log("the list of dlist was successfully obtained: ",dlist[0]," and ",dlist[1])
    let elength = a.distanceTo(b);
    let colornum = [1, 2, 3, 4, 5, 6, 7, 8];
            
    let vlistwc = [[a, 1], [b, 2], [c, 3], [dlist[0], 4], [dlist[1], 5]];
    let tlistwc = [
        [[a, 1], [b, 2], [c, 3], [dlist[0], 4]],
        [[a, 1], [b, 2], [c, 3], [dlist[1], 5]]
    ];
    let tlist = [[a,b,c,dlist[0]], [a,b,c,dlist[1]]]; 

    for (let i = 0; i < iterations; i++) {
        let Tetrawc = tlistwc[Math.floor(Math.random() * tlistwc.length)];
        for (let i = 0; i < 4; i++) {
            console.log("Tetrawc is: ",Tetrawc," and the value of i is: ", i)
            let trianglewc = Tetrawc.filter((_,idx) => idx !== i);
            trianglewc.forEach((v, idx) => {
                if (!v[0] || !(v[0] instanceof THREE.Vector3)) {
                    console.error(`trianglewc[${idx}] does not have a valid vector!`, v);
                }
            });            
            console.log("trianglewc[0] is:",trianglewc[0]," trianglewc[1] is: ",trianglewc[1]," trianglewc[2] is: ",trianglewc[2])
            // 三角形の頂点座標の和をとる
            let sumOfVertices = trianglewc.reduce((acc, v) => acc.add(v[0]), new THREE.Vector3());
            let NewV = sumOfVertices.multiplyScalar(2 / 3).sub(Tetrawc[i][0]); // 計算
            if (isNaN(NewV.x) || isNaN(NewV.y) || isNaN(NewV.z)) {
                console.error("Invalid NewV detected in collectSimulationData for trianglewc:", trianglewc, "and Tetrawc[i]:", Tetrawc[i]);
            }
            let colors = trianglewc.map(v => v[1]);
            let NewClist = colornum.filter(c => !colors.includes(c));
            let NewC = NewClist[Math.floor(Math.random() * NewClist.length)];
            let NewTetrawc = [...trianglewc,[NewV, NewC]];
                    
            if (!nearVlist(NewV, vlistwc, elength) && !nearVlistWC(NewV, NewC, vlistwc, elength)) {
                vlistwc.push([NewV, NewC]);
                tlistwc.push(NewTetrawc);
                tlist.push(NewTetrawc.map(v => v[0]));
                console.log("tlistwc is: ",tlistwc)
            }
        }
    }

    ans.obj_1 = vlistwc;
    ans.obj_2 = tlist;
    return ans;
}

// Visualization code...
let colorset = ['red', 'blue', 'green', 'yellow', 'purple', 'orange', 'gray', 'black'];
let obj = collectSimulationData(7000);
let vlistwc = obj.obj_1;
let tlist = obj.obj_2;


vlistwc.forEach(item => {
    let vertex = item[0];
    let color = colorset[item[1] - 1];
    let geometry = new THREE.SphereGeometry(0.05, 32, 32);
    let material = new THREE.MeshBasicMaterial({ color: color });
    let sphere = new THREE.Mesh(geometry, material);
    sphere.position.set(vertex.x, vertex.y, vertex.z);
    scene.add(sphere);
});

let material = new THREE.MeshBasicMaterial({ color: 0x00ff00, wireframe: true });

tlist.forEach(tetra => {
    let geometry = new THREE.BufferGeometry();
    let vertices = [];
    tetra.forEach(vertex => {
        if (isNaN(vertex.x) || isNaN(vertex.y) || isNaN(vertex.z)) {
            console.error("Invalid vertex detected:", vertex);
            return; // Skip this tetrahedron
        }
        vertices.push(vertex.x, vertex.y, vertex.z);
    });
    if (vertices.length !== 12) return; // Skip if not all vertices are valid
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    let indices = [0, 1, 2, 0, 1, 3, 0, 2, 3, 1, 2, 3];
    geometry.setIndex(indices);
    let mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);
});

camera.position.z = 5;

let animate = function () {
    requestAnimationFrame(animate);
    renderer.render(scene, camera);
};

animate();