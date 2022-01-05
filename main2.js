const make2d = (n, m) =>
  Array(n)
    .fill([])
    .map(() => Array(m).fill(false));

const make3d = (n, m, o) =>
  Array(n)
    .fill([])
    .map(() => make2d(m, o));

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
  ]
    .map(remap)
    .filter((v) => !!v);
};

const FACE_ADJ = {
  0: {
    imin: { f: 3, rot: 0 },
    imax: { f: 2, rot: 0 },
    jmin: { f: 1, rot: 0 },
    jmax: { f: 4, rot: 0 },
  },
  1: {
    imin: { f: 3, rot: 90 },
    imax: { f: 2, rot: -90 },
    jmin: { f: 5, rot: 180 },
    jmax: { f: 0, rot: 0 },
  },
  2: {
    imin: { f: 0, rot: 0 },
    imax: { f: 5, rot: 0 },
    jmin: { f: 1, rot: 90 },
    jmax: { f: 4, rot: -90 },
  },
  3: {
    imin: { f: 5, rot: 0 },
    imax: { f: 0, rot: 0 },
    jmin: { f: 1, rot: -90 },
    jmax: { f: 4, rot: 90 },
  },
  4: {
    imin: { f: 3, rot: -90 },
    imax: { f: 2, rot: 90 },
    jmin: { f: 0, rot: 0 },
    jmax: { f: 5, rot: 180 },
  },
  5: {
    imin: { f: 2, rot: 0 },
    imax: { f: 3, rot: 0 },
    jmin: { f: 1, rot: 180 },
    jmax: { f: 4, rot: 180 },
  },
};

const remap = ([f, i, j]) => {
  const N = Model.N;
  let adj;
  if (i < 0) {
    adj = FACE_ADJ[f].imin;
    i = N - 1;
  } else if (i >= N) {
    adj = FACE_ADJ[f].imax;
    i = 0;
  }

  if (j < 0) {
    if (adj) {
      // ignore diagonal from corners (where i & j are out of bounds)
      return undefined;
    }
    adj = FACE_ADJ[f].jmin;
    j = N - 1;
  } else if (j >= N) {
    if (adj) {
      // ignore diagonal from corners (where i & j are out of bounds)
      return undefined;
    }
    adj = FACE_ADJ[f].jmax;
    j = 0;
  }

  // map to adjacent face
  if (adj) {
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

const urlSearchParams = new URLSearchParams(window.location.search);
const URL_N = parseInt(urlSearchParams.get("n")) || 10;
const URL_TILES = (urlSearchParams.get("tiles") || "")
  .split("_")
  .filter((s) => s)
  .map((s) => parseInt(s));

const Model = {
  N: URL_N,
  State: make3d(6, URL_N, URL_N),
  _on: {},

  _nextState: make3d(6, URL_N, URL_N),

  _subscribers: [],

  next: () => {
    const start = new Date().getTime();

    // reuse buffer?
    const nextState = Model._nextState;
    // const nextState = make3d(6, THE_N, THE_N);
    // const nextOn = {};
    const changed = [];

    // SPARSE
    const processed = new Set();
    const process = (f, i, j) => {
      const k = `${f}_${i}_${j}`;
      if (processed.has(k)) {
        return;
      }
      processed.add(k);

      const coords = getNeighbors(f, i, j);
      const values = coords.map((c) => Model.State[c[0]][c[1]][c[2]]);
      const ons = values.reduce((acc, v) => (v ? acc + 1 : acc), 0);

      const isCorner = values.length == 7; // TODO
      const diemin = isCorner ? 1 : 2;
      const diemax = isCorner ? 4 : 4;
      const spawnvalue = isCorner ? 3 : 3;

      const face = Model.State[f];

      if (face[i][j]) {
        if (ons < diemin) {
          nextState[f][i][j] = false;
          delete Model._on[k];
          changed.push({ f, i, j });
        } else if (ons < diemax) {
          nextState[f][i][j] = true;
        } else {
          nextState[f][i][j] = false;
          delete Model._on[k];
          changed.push({ f, i, j });
        }
      } else {
        if (ons == spawnvalue) {
          nextState[f][i][j] = true;
          const p = { f, i, j };
          Model._on[k] = p;
          changed.push(p);
        } else {
        }
      }
    };

    const q = {};
    Object.entries(Model._on).forEach(([_, v]) => {
      const { f, i, j } = v;
      process(f, i, j);
      const coords = getNeighbors(f, i, j);
      coords.forEach((n) => {
        const k = `${n[0]}_${n[1]}_${n[2]}`;
        q[k] = n;
      });
    });

    Object.entries(q).forEach(([_, v]) => {
      const [f, i, j] = v;
      process(f, i, j);
    });

    // SPARSE

    // Model.State.forEach((face, f) => {
    //   for (let i = 0; i < face.length; i++) {
    //     for (let j = 0; j < face[i].length; j++) {
    //       const coords = getNeighbors(f, i, j);
    //       const values = coords.map((c) => Model.State[c[0]][c[1]][c[2]]);
    //       const ons = values.reduce((acc, v) => (v ? acc + 1 : acc), 0);

    //       // is corner?
    //       const isCorner = values.length == 7;
    //       const dieLT = 2;
    //       const dieGT = 3;
    //       const spawnEQ = 3;

    //       if (face[i][j]) {
    //         if (ons < dieLT) {
    //           nextState[f][i][j] = false;
    //           changed.push({ f, i, j });
    //         } else if (ons <= dieGT) {
    //           nextState[f][i][j] = true;
    //           const k = `${f}_${i}_${j}`;
    //           nextOn[k] = { f, i, j };
    //         } else {
    //           nextState[f][i][j] = false;
    //           changed.push({ f, i, j });
    //         }
    //       } else {
    //         if (ons == spawnEQ) {
    //           nextState[f][i][j] = true;
    //           const k = `${f}_${i}_${j}`;
    //           nextOn[k] = { f, i, j };
    //           changed.push({ f, i, j });
    //         }
    //       }
    //     }
    //   }
    // });

    const swp = Model.State;
    Model.State = nextState;
    for (let f = 0; f < swp.length; f++) {
      for (let i = 0; i < swp[f].length; i++) {
        swp[f][i].fill(false);
      }
    }
    Model._nextState = swp;
    // Model._on = nextOn;

    const end = new Date().getTime();
    // console.log("next:", end - start);

    Model._subscribers.forEach((fn) => fn(changed));
  },

  reset: () => {
    Object.entries(Model._on).forEach(([k, v]) => {
      Model.State[v.f][v.i][v.j] = false;
    });
    Model._subscribers.forEach((fn) => fn(Object.values(Model._on)));
    Model._on = {};
  },

  set: (coords) => {
    for (let c of coords) {
      const { f, i, j, v } = c;
      Model.State[f][i][j] = !!v;
      const k = `${f}_${i}_${j}`;

      if (Model.State[f][i][j]) {
        Model._on[k] = { f, i, j };
      } else {
        delete Model._on[k];
      }
    }
    Model._subscribers.forEach((fn) => fn(coords));
  },

  toggle: (f, i, j) => {
    Model.State[f][i][j] = !Model.State[f][i][j];
    const k = `${f}_${i}_${j}`;
    if (Model.State[f][i][j]) {
      Model._on[k] = { f, i, j };
    } else {
      delete Model._on[k];
    }
    Model._subscribers.forEach((fn) => fn([{ f, i, j }]));
  },

  onUpdate: (fn) => {
    Model._subscribers.push(fn);
  },
};

const target = 50;
let rollingDuration = undefined;
const Controller = {
  start: () => {
    if (Controller.running) {
      return;
    }
    document.querySelector(".stopped-buttons").hidden = true;
    document.querySelector(".running-buttons").hidden = false;
    Controller.running = true;
    Controller._loop();
  },

  stop: () => {
    Controller.running = false;
    document.querySelector(".stopped-buttons").hidden = false;
    document.querySelector(".running-buttons").hidden = true;
  },
  url: () => {
    const s = Object.values(Model._on)
      .map((v) => `${v.f}_${v.i}_${v.j}`)
      .join("_");
    const urlParams = new URLSearchParams(window.location.search);
    urlParams.set("tiles", s);
    window.history.replaceState({}, "cube is life", `?${urlParams.toString()}`);
  },
  _loop: () => {
    if (!Controller.running) {
      return;
    }
    const start = new Date().getTime();
    Model.next();
    const end = new Date().getTime();
    const duration = end - start;

    if (rollingDuration == undefined) {
      rollingDuration = duration;
    } else {
      rollingDuration = rollingDuration * 0.8 + duration * 0.2;
    }
    // console.log(duration, rollingDuration);

    const delay = target - rollingDuration;
    setTimeout(Controller._loop, Math.max(delay, 10));
  },
};

const Renderer3D = {
  _updateQ: [],
  //   _camera: undefined,
  //   _controls: undefined,
  //   _el: undefined,
  //   _renderer: undefined,
  //   _running: undefined,
  //   _scene: undefined,
  //   _tiles: ,
  //   _H: undefined,
  //   _W: undefined,

  init: () => {
    const N = Model.N;

    const scene = new THREE.Scene();
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    const camera = new THREE.PerspectiveCamera();
    const controls = new THREE.OrbitControls(camera, renderer.domElement);
    const el = document.getElementById("scene3d");
    const W = el.getBoundingClientRect().width;
    const H = el.getBoundingClientRect().height;
    el.style.width = W;
    el.style.height = H;

    Renderer3D.W = W;
    Renderer3D.H = H;
    renderer.setSize(W, H);

    camera.position.set(N * 2, N * 2, -N * 2);
    camera.lookAt(0, 0, 0);
    scene.add(camera);

    const axesHelper = new THREE.AxesHelper(N * 2);
    scene.add(axesHelper);

    controls.minDistance = 2 * N;
    controls.maxDistance = N * N;
    controls.addEventListener("start", Renderer3D.start);
    controls.addEventListener("end", Renderer3D.stop);

    el.appendChild(renderer.domElement);
    renderer.render(scene, camera);

    Renderer3D.renderer = renderer;
    Renderer3D.controls = controls;
    Renderer3D.scene = scene;
    Renderer3D.camera = camera;
    Renderer3D.el = el;

    Renderer3D.render();

    Renderer3D._initCube();
    Model.onUpdate((coords) => {
      for (let c of coords) {
        Renderer3D.queueUpdate(c.f, c.i, c.j);
      }
      if (!Renderer3D.running) {
        Renderer3D.render();
      }
    });
    renderer.domElement.addEventListener("dblclick", Renderer3D._onClickScene);
    Renderer3D.render();
  },

  queueUpdate: (f, i, j) => {
    Renderer3D._updateQ.push({ f, i, j });
  },

  start: () => {
    if (Renderer3D.running) {
      return;
    }
    Renderer3D.running = true;
    Renderer3D._loop();
  },

  stop: () => {
    Renderer3D.running = false;
  },

  _initCube: () => {
    const N = Model.N;

    Renderer3D.tiles = {};
    const tiles = Renderer3D.tiles;
    const scene = Renderer3D.scene;

    for (let f = 0; f < 6; f++) {
      tiles[f] = [];
      for (let i = 0; i < N; i++) {
        tiles[f][i] = [];
        for (let j = 0; j < N; j++) {
          // cube is composed of 1x1x0.01 tiles
          const unit = 1;
          const sx = unit;
          const sy = unit;
          const sz = unit / 100;

          const geometry = new THREE.BoxGeometry(sx, sy, sz);
          const color = Model.State[f][i][j] ? 0x000000 : 0xffffff;
          const material = new THREE.MeshBasicMaterial({ color });
          const tile = new THREE.Mesh(geometry, material);
          tile.userData = { f, i, j };

          // wireframe;
          var outlineGeometry = new THREE.EdgesGeometry(tile.geometry);
          var outlineMaterial = new THREE.LineBasicMaterial({ color: 0x000000, linewidth: 2 });
          var outline = new THREE.LineSegments(outlineGeometry, outlineMaterial);
          outline.renderOrder = 1; // make sure wireframes are rendered after tile
          tile.add(outline);

          const d = f; // the 1-indexed face ... 1 indexed because I used the faces of a die to model the rotation
          const offset = (N * unit) / 2; // translate so the tile center is at the origin

          // this should be a 1-liner with .rotateOnAxis or .rotateOnWorldAxis
          // https://threejs.org/docs/#api/en/core/Object3D.rotateOnAxis
          // couldn't get it working so wrote one by one
          if (d == 0) {
            tile.rotateY(0);
            tile.position.set(0.5 + N - 1 - j - offset, 0.5 + N - 1 - i - offset, 0 - offset);
          } else if (d == 1) {
            tile.rotateY(Math.PI / 2);
            tile.position.set(1 * N - offset, 0.5 + N - 1 - i - offset, 0.5 + N - 1 - j - offset);
          } else if (d == 2) {
            tile.rotateX(-Math.PI / 2);
            tile.position.set(0.5 + N - 1 - j - offset, 0 - offset, 0.5 + i - offset);
          } else if (d == 3) {
            tile.rotateX(-Math.PI / 2);
            tile.position.set(0.5 + N - 1 - j - offset, 1 * N - offset, 0.5 + N - 1 - i - offset);
          } else if (d == 4) {
            tile.rotateY(Math.PI / 2);
            tile.position.set(0 - offset, 0.5 + N - 1 - i - offset, 0.5 + j - offset);
          } else {
            tile.position.set(0.5 + N - 1 - j - offset, 0.5 + i - offset, 1 * N - offset);
          }
          tiles[f][i][j] = tile;
          scene.add(tile);
        }
      }
    }
  },

  _loop: () => {
    if (!Renderer3D.running) {
      return;
    }
    Renderer3D.render();
    setTimeout(() => {
      requestAnimationFrame(Renderer3D._loop);
    }, 10);
  },

  render: () => {
    if (Renderer3D._updateQ.length > 0) {
      for (let q of Renderer3D._updateQ) {
        const tile = Renderer3D.tiles[q.f][q.i][q.j];
        const color = Model.State[q.f][q.i][q.j] ? 0x000000 : 0xffffff;
        tile.material.color.setHex(color);
      }
      Renderer3D._updateQ = [];
    }

    // Renderer3D.controls.update();
    Renderer3D.renderer.render(Renderer3D.scene, Renderer3D.camera);
  },

  _onClickScene: (event) => {
    // coordinates within the rendering canvas
    const x = event.clientX - Renderer3D.el.getBoundingClientRect().x;
    const y = event.clientY - Renderer3D.el.getBoundingClientRect().y;

    // coordinates for ray caster
    const mouse = new THREE.Vector2();
    mouse.x = (x / Renderer3D.W) * 2 - 1;
    mouse.y = -(y / Renderer3D.H) * 2 + 1;

    const { camera, scene, tiles } = Renderer3D;
    const raycaster = new THREE.Raycaster();
    raycaster.params.Line.threshold = 0.01;
    raycaster.setFromCamera(mouse, camera);

    // use the first intersecting box geometry
    const intersects = raycaster.intersectObjects(scene.children);
    const boxes = intersects.filter((ix) => ix.object.geometry instanceof THREE.BoxGeometry);
    if (boxes.length > 0) {
      const f = boxes[0].object.userData.f;
      const i = boxes[0].object.userData.i;
      const j = boxes[0].object.userData.j;
      Model.toggle(f, i, j);

      // show neighbors onclick to debug
      //   const neighborcoords = getNeighbors(f, i, j);
      //   for (let nc of neighborcoords) {
      //     const tile = tiles[nc[0]][nc[1]][nc[2]];
      //     tile.material.color.setHex(0xff0000);
      //   }
    }
  },
};
const Renderer2D = {
  init: () => {
    const faces = Model.State.map((f, i) => Renderer2D.initFace(f, i));

    faces.forEach((f, i) => {
      const el = document.getElementById(`face_${i}`);
      el.innerHTML = f;
    });

    Model.onUpdate((coords) => {
      for (let c of coords) {
        const { f, i, j } = c;
        Renderer2D.updateCell(f, i, j, Model.State[f][i][j]);
      }
    });
  },

  initFace: (face, f) => {
    const faces = face.map(
      (r, i) =>
        `<div class='row'>${r
          .map((c, j) => {
            return `<div id="c_${f}_${i}_${j}" data-f="${f}" data-i="${i}" data-j="${j}" class='${c ? "cell filled" : "cell"}' onclick="Renderer2D._onClickCell(this)"></div>`;
          })
          .join("")}</div>`
    );
    return faces.join("");
  },

  updateCell: (f, i, j, v) => {
    const el = document.getElementById(`c_${f}_${i}_${j}`);
    el.className = v ? "cell filled" : "cell";
  },

  _onClickCell: (e) => {
    const f = parseInt(e.getAttribute("data-f"));
    const i = parseInt(e.getAttribute("data-i"));
    const j = parseInt(e.getAttribute("data-j"));
    Model.toggle(f, i, j);
  },
};
const RendererVR = {
  init: () => {},
};

const DemoChase = [
  { f: 0, i: 0, j: 13, v: true },
  { f: 3, i: 21, j: 9, v: true },
  { f: 3, i: 17, j: 5, v: true },
  { f: 3, i: 13, j: 1, v: true },
  { f: 1, i: 2, j: 9, v: true },
  { f: 1, i: 6, j: 5, v: true },
  { f: 1, i: 10, j: 1, v: true },
  { f: 5, i: 10, j: 2, v: true },
  { f: 5, i: 6, j: 6, v: true },
  { f: 5, i: 2, j: 10, v: true },
  { f: 2, i: 23, j: 14, v: true },
  { f: 2, i: 19, j: 18, v: true },
  { f: 2, i: 15, j: 22, v: true },
  { f: 4, i: 23, j: 11, v: true },
  { f: 4, i: 19, j: 7, v: true },
  { f: 4, i: 15, j: 3, v: true },
  { f: 0, i: 1, j: 13, v: true },
  { f: 3, i: 22, j: 9, v: true },
  { f: 3, i: 18, j: 5, v: true },
  { f: 3, i: 14, j: 1, v: true },
  { f: 1, i: 2, j: 10, v: true },
  { f: 1, i: 6, j: 6, v: true },
  { f: 1, i: 10, j: 2, v: true },
  { f: 5, i: 10, j: 1, v: true },
  { f: 5, i: 6, j: 5, v: true },
  { f: 5, i: 2, j: 9, v: true },
  { f: 2, i: 23, j: 13, v: true },
  { f: 2, i: 19, j: 17, v: true },
  { f: 2, i: 15, j: 21, v: true },
  { f: 4, i: 24, j: 11, v: true },
  { f: 4, i: 20, j: 7, v: true },
  { f: 4, i: 16, j: 3, v: true },
  { f: 0, i: 2, j: 12, v: true },
  { f: 3, i: 23, j: 8, v: true },
  { f: 3, i: 19, j: 4, v: true },
  { f: 3, i: 15, j: 0, v: true },
  { f: 1, i: 3, j: 11, v: true },
  { f: 1, i: 7, j: 7, v: true },
  { f: 1, i: 11, j: 3, v: true },
  { f: 5, i: 9, j: 0, v: true },
  { f: 5, i: 5, j: 4, v: true },
  { f: 5, i: 1, j: 8, v: true },
  { f: 2, i: 22, j: 12, v: true },
  { f: 2, i: 18, j: 16, v: true },
  { f: 2, i: 14, j: 20, v: true },
  { f: 2, i: 10, j: 24, v: true },
  { f: 4, i: 21, j: 6, v: true },
  { f: 4, i: 17, j: 2, v: true },
  { f: 0, i: 1, j: 11, v: true },
  { f: 0, i: 2, j: 13, v: true },
  { f: 3, i: 22, j: 7, v: true },
  { f: 3, i: 23, j: 9, v: true },
  { f: 3, i: 18, j: 3, v: true },
  { f: 3, i: 19, j: 5, v: true },
  { f: 1, i: 0, j: 14, v: true },
  { f: 3, i: 15, j: 1, v: true },
  { f: 1, i: 2, j: 11, v: true },
  { f: 1, i: 4, j: 10, v: true },
  { f: 1, i: 6, j: 7, v: true },
  { f: 1, i: 8, j: 6, v: true },
  { f: 1, i: 10, j: 3, v: true },
  { f: 1, i: 12, j: 2, v: true },
  { f: 5, i: 8, j: 1, v: true },
  { f: 5, i: 10, j: 0, v: true },
  { f: 5, i: 4, j: 5, v: true },
  { f: 5, i: 6, j: 4, v: true },
  { f: 5, i: 0, j: 9, v: true },
  { f: 5, i: 2, j: 8, v: true },
  { f: 2, i: 21, j: 13, v: true },
  { f: 2, i: 23, j: 12, v: true },
  { f: 2, i: 17, j: 17, v: true },
  { f: 2, i: 19, j: 16, v: true },
  { f: 2, i: 13, j: 21, v: true },
  { f: 2, i: 15, j: 20, v: true },
  { f: 4, i: 24, j: 9, v: true },
  { f: 2, i: 11, j: 24, v: true },
  { f: 4, i: 20, j: 5, v: true },
  { f: 4, i: 21, j: 7, v: true },
  { f: 4, i: 16, j: 1, v: true },
  { f: 4, i: 17, j: 3, v: true },
  { f: 0, i: 11, j: 24, v: true },
  { f: 0, i: 12, j: 24, v: true },
  { f: 0, i: 13, j: 24, v: true },
  { f: 0, i: 13, j: 23, v: true },
  { f: 0, i: 12, j: 22, v: true },
];

function demo() {
  Model.reset();
  if (Model.N == 25) {
    Model.set(DemoChase);
  }
}

const urlCoords = [];
for (let i = 0; i < URL_TILES.length; i += 3) {
  const c = {
    f: URL_TILES[i],
    i: URL_TILES[i + 1],
    j: URL_TILES[i + 2],
    v: true,
  };
  // TODO: check bounds
  urlCoords.push(c);
}
Model.set(urlCoords);

document.addEventListener("DOMContentLoaded", function () {
  setTimeout(() => {
    Renderer2D.init();
    setTimeout(() => {
      Renderer3D.init();
    }, 0);
  }, 0);
});
