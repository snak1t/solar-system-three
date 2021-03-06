import {
  Scene,
  PerspectiveCamera,
  WebGLRenderer as Renderer,
  Raycaster
} from 'three';
import OrbitControls from 'three-orbitcontrols';

import createSun, { initSunLight } from './planets/sun';
import {
  createPlanets,
  rotatePlanets,
  addPlanetsToScene,
  lookAtPlanetAnimation
} from './planets/planets';
import createStars from './planets/stars';
import adaptiveHDR from './effects/adaptiveHDR';
import backdropMesh from './scene/bg';

const width = window.innerWidth;
const height = window.innerHeight - 4;
const proportion = width / height;

const initCamera = () => {
  const camera = new PerspectiveCamera(45, proportion, 1, 10000000);
  camera.position.x = 0;
  camera.position.y = 0;
  camera.position.z = 30000;
  camera.rotation.z = -Math.PI / 20;
  return camera;
};

const initScene = () => {
  return new Scene();
};

const initRenderer = () => {
  const renderer = new Renderer({ alpha: true });
  renderer.setSize(width, height);
  renderer.setClearColor(0x000000, 1);
  document.body.appendChild(renderer.domElement);
  return renderer;
};

export default () => {
  var camera = initCamera();
  var scene = initScene();
  var renderer = initRenderer();
  var stars = createStars(39000);
  var sun = createSun();
  var planets = createPlanets();
  var light = initSunLight();

  scene.add(light);
  scene.add(sun);
  scene.add(stars);
  scene.add(backdropMesh);
  addPlanetsToScene(planets, scene);

  var shaderRenderrer = adaptiveHDR(renderer, scene, camera, light);

  var controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.25;
  controls.enableZoom = true;
  controls.enabled = true;

  var raycaster = new Raycaster();
  var planetToLookAt = null;
  var cameraPrevPosition;
  var mouseIsDown = false;

  var selector = document.getElementById('planetSelector');

  window.addEventListener('mousedown', e => {
    if (mouseIsDown) return;
    var mouse = {
      x: event.clientX / renderer.domElement.clientWidth * 2 - 1,
      y: -(event.clientY / renderer.domElement.clientHeight) * 2 + 1
    };
    raycaster.setFromCamera(mouse, camera);
    var intersects = raycaster.intersectObjects(scene.children);
    if (intersects.length === 0) return;
    controls.enabled = false;
    var planet = intersects[0].object;
    if ( ! planet.isSelectable) return;
    selector.value = planet.planetName;
    setPlanetToLook(planet);
  });

  selector.addEventListener('change', e => {
    var planetSelected = e.target.value;
    if (planetSelected === 'none') {
      return resetPlanetToLook();
    }
    setPlanetToLook(planets[planetSelected].planet);
  });

  window.addEventListener('keydown', e => {
    if (e.keyCode !== 27) return;
    selector.value = 'none';
    return resetPlanetToLook();
  });

  function animation() {
    requestAnimationFrame(animation);
    sun.rotation.y += 0.001;
    rotatePlanets(planets);
    lookAtPlanetAnimation({ planet: planetToLookAt, camera, controls });
    shaderRenderrer.render(0.017);
  }

  animation();

  function setPlanetToLook(planet) {
    controls.enabled = false;
    cameraPrevPosition = {
      x: camera.position.x,
      y: camera.position.y,
      z: camera.position.z
    };
    planetToLookAt = planet;
    mouseIsDown = true;
  }

  function resetPlanetToLook(planet) {
    console.log('reseted');
    planetToLookAt = null;
    camera.position.x = cameraPrevPosition.x;
    camera.position.y = cameraPrevPosition.y;
    camera.position.z = cameraPrevPosition.z;
    mouseIsDown = false;
  }
};
