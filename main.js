/* 
    2 1 5
      3
      6
      4
*/

const N = 9;
// const N = 3;

const make2d = (n) =>
  Array(n)
    .fill([])
    .map(() => Array(n).fill(false));

const makeFaces = () =>
  Array(6)
    .fill([])
    .map(() => make2d(N));

const onClickCell = (e) => {
  const f = parseInt(e.getAttribute("data-f"));
  const i = parseInt(e.getAttribute("data-i"));
  const j = parseInt(e.getAttribute("data-j"));

  //   getNeighbors(f, i, j).forEach((n) => {
  //     console.log("neighbor:", n);
  //     Session._faces[n[0] - 1][n[1]][n[2]] = !Session._faces[n[0] - 1][n[1]][n[2]];
  // });
  Session._faces[f - 1][i][j] = !Session._faces[f - 1][i][j];

  Session.render();
};

const getNeighbors = (f, i, j) => {
  return [
    [f, i - 1, j - 1],
    [f, i - 1, j],
    [f, i - 1, j + 1],
    [f, i, j - 1],
    [f, i, j + 1],
    [f, i + 1, j - 1],
    [f, i + 1, j],
    [f, i + 1, j + 1],
  ].map(remap);
};

const FACE_ADJ = {
  1: {
    imin: { f: 4, rot: 0 },
    imax: { f: 3, rot: 0 },
    jmin: { f: 2, rot: 0 },
    jmax: { f: 5, rot: 0 },
  },
  2: {
    imin: { f: 4, rot: 90 },
    imax: { f: 3, rot: -90 },
    jmin: { f: 6, rot: 180 },
    jmax: { f: 1, rot: 0 },
  },
  3: {
    imin: { f: 1, rot: 0 },
    imax: { f: 6, rot: 0 },
    jmin: { f: 2, rot: 90 },
    jmax: { f: 5, rot: -90 },
  },
  4: {
    imin: { f: 6, rot: 0 },
    imax: { f: 1, rot: 0 },
    jmin: { f: 2, rot: -90 },
    jmax: { f: 5, rot: 90 },
  },
  5: {
    imin: { f: 4, rot: -90 },
    imax: { f: 3, rot: 90 },
    jmin: { f: 1, rot: 0 },
    jmax: { f: 6, rot: 180 },
  },
  6: {
    imin: { f: 3, rot: 0 },
    imax: { f: 4, rot: 0 },
    jmin: { f: 2, rot: 180 },
    jmax: { f: 5, rot: 180 },
  },
};

const remap = ([f, i, j]) => {
  let adj;
  if (i < 0) {
    // console.log("ILLEGAL1", f, i, j);
    adj = FACE_ADJ[f].imin;
    i = N - 1;
    // i = FACE_ADJ[f].imin.low ? 0 : N - 1;
    // f = FACE_ADJ[f].imin.f;
  } else if (i >= N) {
    // console.log("ILLEGAL2", f, i, j);
    adj = FACE_ADJ[f].imax;
    i = 0;
    // adj = FACE_ADJ[f].imax;
    // const adj = FACE_ADJ[f].imax;

    // i = FACE_ADJ[f].imax.low ? 0 : N - 1;
    // if (adj.swap) {
    //   const swp = i;
    //   i = j;
    //   j = swp;
    // }
  }
  if (j < 0) {
    // console.log("ILLEGAL3", f, i, j);
    adj = FACE_ADJ[f].jmin;
    j = N - 1;
    // j = FACE_ADJ[f].jmin.low ? 0 : N - 1;
    // f = FACE_ADJ[f].jmin.f;
  } else if (j >= N) {
    // console.log("ILLEGAL4", f, i, j, FACE_ADJ[f].jmax, FACE_ADJ[f].jmax.low);
    adj = FACE_ADJ[f].jmax;
    j = 0;
    // j = FACE_ADJ[f].jmax.low ? 0 : N - 1;
    // f = FACE_ADJ[f].jmax.f;
  }
  //   console.log(adj);
  if (adj) {
    // i = 0;
    // j = 0;
    f = adj.f;

    if (adj.rot == -90) {
      const swp = i;
      i = N - 1 - j;
      j = swp;
    } else if (adj.rot == 90) {
      const swp = j;
      j = N - 1 - i;
      i = swp;
    } else if (adj.rot == 180) {
      i = N - 1 - i;
      j = N - 1 - j;
    }
  }
  return [f, i, j];
};

const onMouseEnter = (e) => {
  //   const f = parseInt(e.getAttribute("data-f"));
  //   const i = parseInt(e.getAttribute("data-i"));
  //   const j = parseInt(e.getAttribute("data-j"));
  //   Session._faces[f][i][j] = !Session._faces[f][i][j];
  //   Session.render();
};

const Session = {
  _faces: makeFaces(),
  _setIntervalId: undefined,

  next: () => {
    const start = new Date().getTime();
    const nextFaces = makeFaces();

    Session._faces.forEach((face, h) => {
      for (let i = 0; i < face.length; i++) {
        for (let j = 0; j < face[i].length; j++) {
          const f = h + 1;
          const neighborcoords = getNeighbors(f, i, j);
          const neighbors = neighborcoords.map((c) => Session._faces[c[0] - 1][c[1]][c[2]]);
          const neighborCount = neighbors.reduce((acc, v) => (v ? acc + 1 : acc), 0);
          if (face[i][j] && (neighborCount == 2 || neighborCount == 3)) {
            nextFaces[h][i][j] = true;
          } else if (!face[i][j] && neighborCount == 3) {
            nextFaces[h][i][j] = true;
          } else {
            nextFaces[h][i][j] = false;
          }
        }
      }
    });

    Session._faces = nextFaces;
    const end = new Date().getTime();

    console.log("next:", end - start);

    Session.render();
    // const next = () => {
    //   const newboard = [];
    //   for (let i = 0; i < N; i++) {
    //     newboard.push(make(N));
    //   }
    //   for (let i = 0; i < N; i++) {
    //     for (let j = 0; j < N; j++) {
    //       const neighbors = [getb(board, i - 1, j - 1), getb(board, i - 1, j), getb(board, i - 1, j + 1), getb(board, i, j - 1), getb(board, i, j + 1), getb(board, i + 1, j - 1), getb(board, i + 1, j), getb(board, i + 1, j + 1)];
    //       const neighborcount = neighbors.reduce((acc, v) => (v ? acc + 1 : acc), 0);
    //       if (board[i][j] && (neighborcount == 2 || neighborcount == 3)) {
    //         newboard[i][j] = true;
    //       } else if (!board[i][j] && neighborcount == 3) {
    //         newboard[i][j] = true;
    //       } else {
    //         newboard[i][j] = false;
    //       }
    //     }
    //   }
    //   board = newboard;
    //   rndr();
    // };
  },

  stop: () => {
    Session._running = false;
  },

  start: () => {
    if (Session._running) {
      return;
    }
    Session._running = true;
    Session.loop();
  },

  loop: () => {
    if (!Session._running) {
      return;
    }
    Session.next();
    setTimeout(() => {
      Session.loop();
    }, 10);
  },

  reset: () => {
    Session._faces = makeFaces();
    Session.render();
  },

  renderFace: (face, f) => {
    const faces = face.map(
      (r, i) =>
        `<div class='row'>${r
          .map((c, j) => {
            return `<div data-f="${f + 1}" data-i="${i}" data-j="${j}" class='${c ? "cell filled" : "cell"}' onclick="onClickCell(this)" onmouseenter="onMouseEnter(this)"></div>`;
          })
          .join("")}</div>`
    );
    return faces.join("");
  },

  render: () => {
    const start = new Date().getTime();
    // if (!Session._donef) {
    //   Session._donef = true;

    const faces = Session._faces.map((f, i) => Session.renderFace(f, i));
    faces.forEach((f, i) => {
      const el = document.getElementById(`face_${i + 1}`);
      el.innerHTML = f;
    });
    // }
    const mid = new Date().getTime();
    draw3();
    const end = new Date().getTime();
    console.log("render:", end - start);
    console.log("render2:", mid - start);
    console.log("render3:", end - mid);
  },
};

const scene = new THREE.Scene();
const renderer = new THREE.WebGLRenderer({ antialias: true });
document.getElementById("vrbutton").appendChild(VRButton.createButton(renderer));
renderer.xr.enabled = true;
renderer.xr.setReferenceSpaceType("local");

const el = document.getElementById("scene");
const axesHelper = new THREE.AxesHelper(100);
scene.add(axesHelper);

const faces3 = {};

// var edges = new THREE.LineSegments(geometry, material);
// cube.add(edges);
// const light = new THREE.DirectionalLight(0xffffff, 0.8);
// light.position.set(50, 200, 100);
// light.position.multiplyScalar(1.3);
// light.castShadow = true;
// light.shadow.mapSize.width = 1024;
// light.shadow.mapSize.height = 1024;
// const dl = 300;
// light.shadow.camera.left = -dl;
// light.shadow.camera.right = dl;
// light.shadow.camera.top = dl;
// light.shadow.camera.bottom = -dl;
// light.shadow.camera.far = 1000;
// scene.add(light);
const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
scene.add(directionalLight);
console.log(directionalLight);

var cubegroup = new THREE.Group();
// var linegroup = new THREE.Group();

const draw3init = () => {
  for (let f = 0; f < 6; f++) {
    faces3[f] = [];
    for (let i = 0; i < N; i++) {
      faces3[f][i] = [];
      for (let j = 0; j < N; j++) {
        const sx = 1;
        const sy = 1;
        const sz = 0.01;

        const geometry = new THREE.BoxGeometry(sx, sy, sz);
        const material = new THREE.MeshBasicMaterial({ color: 0xffffff });
        const cube = new THREE.Mesh(geometry, material);
        cube.userData = { f, i, j };

        // wireframe;
        var geo2 = new THREE.EdgesGeometry(cube.geometry);
        var mat2 = new THREE.LineBasicMaterial({ color: 0x000000, linewidth: 2 });
        var wireframe2 = new THREE.LineSegments(geo2, mat2);
        wireframe2.renderOrder = 1; // make sure wireframes are rendered 2nd
        cube.add(wireframe2);

        const d = f + 1;

        const unit = 1;
        const offset = (N * unit) / 2;

        if (d == 1) {
          cube.rotateY(0);
          cube.position.set(0.5 + N - 1 - j - offset, 0.5 + N - 1 - i - offset, 0 - offset);
        } else if (d == 2) {
          cube.rotateY(Math.PI / 2);
          cube.position.set(1 * N - offset, 0.5 + N - 1 - i - offset, 0.5 + N - 1 - j - offset);
        } else if (d == 3) {
          cube.rotateX(-Math.PI / 2);
          cube.position.set(0.5 + N - 1 - j - offset, 0 - offset, 0.5 + i - offset);
        } else if (d == 4) {
          cube.rotateX(-Math.PI / 2);
          cube.position.set(0.5 + N - 1 - j - offset, 1 * N - offset, 0.5 + N - 1 - i - offset);
        } else if (d == 5) {
          cube.rotateY(Math.PI / 2);
          cube.position.set(0 - offset, 0.5 + N - 1 - i - offset, 0.5 + j - offset);
        } else {
          cube.position.set(0.5 + N - 1 - j - offset, 0.5 + i - offset, 1 * N - offset);
        }
        faces3[f][i][j] = cube;
        scene.add(cube);
      }
    }
  }
};

draw3init();

//our lights
var light = new THREE.SpotLight(0xffffff);
light.position.set(-20, 10, 100);
light.castShadow = true;

scene.add(light);

var ambient = new THREE.AmbientLight(0x404040);
scene.add(ambient);

const draw3 = () => {
  for (let f = 0; f < 6; f++) {
    for (let i = 0; i < N; i++) {
      for (let j = 0; j < N; j++) {
        const cube = faces3[f][i][j];
        const color = Session._faces[f][i][j] ? 0x000000 : 0xffffff;
        cube.material.color.setHex(color);
      }
    }
  }
};

renderer.setSize(800, 800);
el.appendChild(renderer.domElement);

const camera = new THREE.PerspectiveCamera();
// camera.position.set(N * 2, N * 2, N * 2);
camera.lookAt(0, 0, 0);

const user = new THREE.Group();
user.add(camera);
scene.add(user);

// 70, //FOV
//   1, //aspect
//   1, //near clipping plane
//   100; //far clipping plane

/// GOOD
// const controls = new THREE.OrbitControls(camera, renderer.domElement);
// controls.minDistance = 2 * N;
// controls.maxDistance = N * N;
// renderer.render(scene, camera);
// controls.update();
// function animate() {
//   // required if controls.enableDamping or controls.autoRotate are set to true
//   controls.update();
//   renderer.render(scene, camera);
//   requestAnimationFrame(animate);
// }
// animate();
/// GOOD

console.log("hi");
let controller1 = renderer.xr.getController(0);
controller1.addEventListener("selectstart", onSelectStart);
controller1.addEventListener("selectend", onSelectEnd);
controller1.addEventListener("connected", function (event) {
  //   this.add(buildController(event.data));
  console.log("connected", event);
});
controller1.addEventListener("disconnected", function () {
  this.remove(this.children[0]);
});
scene.add(controller1);

var raycaster = new THREE.Raycaster();
raycaster.set(new THREE.Vector3(0, 0, 0), new THREE.Vector3(1, 1, 1).normalize());
// const controllerray = new THREE.ArrowHelper(raycaster.ray.direction, raycaster.ray.origin, 300, 0xff00ff);
// scene.add(controllerray);

const linematerial1 = new THREE.LineBasicMaterial({
  color: 0xff00ff,
});
const linematerial2 = new THREE.LineBasicMaterial({
  color: 0xffff00,
});

let points1 = [];
points1.push(new THREE.Vector3(0, 0, 0));
points1.push(new THREE.Vector3(0, 0, 0));
let controllerline1geometry = new THREE.BufferGeometry().setFromPoints(points1);
const controllerline1 = new THREE.LineSegments(controllerline1geometry, linematerial1);
scene.add(controllerline1);

let points2 = [];
points2.push(new THREE.Vector3(0, 0, 0));
points2.push(new THREE.Vector3(0, 0, 0));
let controllerline2geometry = new THREE.BufferGeometry().setFromPoints(points2);
const controllerline2 = new THREE.LineSegments(controllerline2geometry, linematerial2);
scene.add(controllerline2);

let controller2 = renderer.xr.getController(1);
controller2.addEventListener("selectstart", onSelectStart);
controller2.addEventListener("selectend", onSelectEnd);
controller2.addEventListener("connected", function (event) {
  //   this.add(buildController(event.data));
  console.log("connected", event);
});
controller2.addEventListener("disconnected", function () {
  this.remove(this.children[0]);
});
scene.add(controller2);
console.log(controller1, controller2);
// console.log(controllerray);

let l = 1;
renderer.setAnimationLoop(function () {
  try {
    user.position.set(N * 2, N * 2, N * 2);

    points1 = [];
    points1.push(new THREE.Vector3(0, 0, 0));
    points1.push(user.position.clone().add(controller1.position));
    controllerline1geometry = new THREE.BufferGeometry().setFromPoints(points1);
    controllerline1.geometry = controllerline1geometry;

    points2 = [];
    points2.push(new THREE.Vector3(0, 0, 0));
    points2.push(user.position.clone().add(controller2.position));
    controllerline2geometry = new THREE.BufferGeometry().setFromPoints(points2);
    controllerline2.geometry = controllerline2geometry;

    //   const points2 = [];
    //   points2.push(new THREE.Vector3(0, 0, 0));
    //   point2.push(controller2.position);
    //   controllerline2geometry = new THREE.BufferGeometry().setFromPoints(points);
    //   controllerline2.geometry = controllerline2geometry;

    renderer.render(scene, camera);
  } catch (e) {
    console.log(e);
  }
});
renderer.render(scene, camera);

Session.render();

const w = 800;
const h = 800;
const onClickScene = (event) => {
  console.log("click", event.clientX, event.clientY);
  var mouse = new THREE.Vector2();
  mouse.x = (event.clientX / w) * 2 - 1;
  mouse.y = -(event.clientY / h) * 2 + 1;
  //   mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  //   mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
  //   mouse.x = event.clientX;
  //   mouse.y = event.clientY;
  var raycaster = new THREE.Raycaster();
  raycaster.params.Line.threshold = 0.01;

  // update the picking ray with the camera and mouse position
  raycaster.setFromCamera(mouse, camera);

  // calculate objects intersecting the picking ray
  var intersects = raycaster.intersectObjects(scene.children);
  const boxes = intersects.filter((ix) => ix.object.geometry instanceof THREE.BoxGeometry);
  if (boxes.length > 0) {
    console.log(boxes);
    // boxes[0].object.material.color.setHex(0xff0000);
    const f = boxes[0].object.userData.f;
    const i = boxes[0].object.userData.i;
    const j = boxes[0].object.userData.j;

    Session._faces[f][i][j] = !Session._faces[f][i][j];

    Session.render();
  }

  //   raycaster.setFromCamera(mouse, camera);

  //   for (let f = 0; f < 6; f++) {
  //     for (let i = 0; i < N; i++) {
  //       for (let j = 0; j < N; j++) {
  //         const cube = faces3[f][i][j];
  //         let intersects = raycaster.intersectObject(cube);
  //         if (intersects.length > 0) {
  //           console.log(f, i, j);
  //           cube.material.color.setHex(0xff0000);
  //         }
  //       }
  //     }
  //   }
};

renderer.domElement.addEventListener("dblclick", onClickScene);

function onSelectStart() {
  console.log("ON SELECT START");
}

function onSelectEnd() {
  console.log("ON SELECT END");
}

// export { VRButton };

// The XRControllerModelFactory will automatically fetch controller models
// that match what the user is holding as closely as possible. The models
// should be attached to the object returned from getControllerGrip in
// order to match the orientation of the held device.

// const controllerModelFactory = new XRControllerModelFactory();

// controllerGrip1 = renderer.xr.getControllerGrip(0);
// controllerGrip1.add(controllerModelFactory.createControllerModel(controllerGrip1));
// scene.add(controllerGrip1);

// controllerGrip2 = renderer.xr.getControllerGrip(1);
// controllerGrip2.add(controllerModelFactory.createControllerModel(controllerGrip2));
// scene.add(controllerGrip2);
