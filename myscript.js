google.maps.event.addDomListener(window, "load", initMap);

var myMap = null;
var carMarker = null;

function initMap() {
  const mapEl = document.getElementById("map");
  myMap = new google.maps.Map(mapEl, mapConfig);

  renderRoutePolyline();
  renderCarMarker(route[0]);

  setTimeout(startAnimation, 1000);
}

function renderRoutePolyline() {
  const routePolyline = new google.maps.Polyline(polylineConfig);

  routePolyline.setMap(myMap);

  //start marker
  renderLocationMarker(route[0]);

  //destination marker
  renderLocationMarker(route[route.length - 1]);
}

function renderLocationMarker({ lat, lng }) {
  const canvas = document.createElement("canvas");
  canvas.width = 10;
  canvas.height = 10;

  const context = canvas.getContext("2d");
  context.fillRect(0, 0, 10, 10);
  context.fillStyle = "#fff";
  context.fillRect(2.5, 2.5, 5, 5);

  new google.maps.Marker({
    position: new google.maps.LatLng(lat, lng),
    map: myMap,
    icon: {
      url: canvas.toDataURL(),
      scaledSize: new google.maps.Size(10, 10),
      anchor: new google.maps.Point(5, 5),
    },
  });
}

/**
 *
 * Car Marker
 *
 */

const carCanvas = document.createElement("canvas");
carCanvas.width = 100;
carCanvas.height = 100;

function renderCarMarker({ lat, lng }) {
  const latLng = new google.maps.LatLng(lat, lng);

  const carImage = new Image();
  carImage.onload = () => {
    updateCarMarker(latLng, carImage);
  };

  carImage.src = "./car_marker.png";
}

function updateCarMarker(destinationLatLng, carImage) {
  let angle = 0;

  if (carMarker) {
    angle = getRotationAngle(carMarker.getPosition(), destinationLatLng);
  }

  drawCarIcon(angle, carImage);

  if (!carMarker) {
    carMarker = new google.maps.Marker({
      position: destinationLatLng,
      map: myMap,
    });

    carMarker.carImage = carImage;
  }

  const icon = getCarMarkerIcon();
  carMarker.setIcon(icon);
  carMarker.setPosition(destinationLatLng);
}

function drawCarIcon(angle, carImage) {
  const canvasWidth = carCanvas.width;
  const canvasHeight = carCanvas.height;

  const context = carCanvas.getContext("2d");

  const imageWidth = carImage.width;
  const imageHeight = carImage.height;

  const scaler = scalePreserveAspectRatio(imageWidth, imageHeight, canvasWidth, canvasHeight);

  const scaledWidth = imageWidth * scaler;
  const scaledHeight = imageHeight * scaler;

  context.save();
  context.clearRect(0, 0, canvasWidth, canvasHeight);
  context.translate(canvasWidth / 2, canvasHeight / 2);
  context.rotate(angle);
  context.drawImage(
    carImage,
    0,
    0,
    imageWidth,
    imageHeight,
    -scaledWidth / 2,
    -scaledHeight / 2,
    scaledWidth,
    scaledHeight
  );
  context.restore();

  function scalePreserveAspectRatio(imgW, imgH, maxW, maxH) {
    return Math.min(maxW / imgW, maxH / imgH);
  }
}

function getCarMarkerIcon() {
  return {
    url: carCanvas.toDataURL("image/png", 1),
    scaledSize: new google.maps.Size(30, 30),
    anchor: new google.maps.Point(15, 15),
  };
}

//https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/rotate
function getRotationAngle(start, destination) {
  const bearing = getBearing(start, destination);
  return ((360 - (90 - bearing)) * Math.PI) / 180;
}

//https://developers.google.com/maps/documentation/javascript/reference/geometry
function getBearing(start, destination) {
  return google.maps.geometry.spherical.computeHeading(start, destination);
}

/**
 *
 * Animation
 *
 */

function startAnimation() {
  let index = 1;
  doAnimate();

  setInterval(doAnimate, 3000);

  function doAnimate() {
    if (index < route.length) {
      animateCarMarker(route[index]);
      index++;
    }
  }
}

/*
   threshold - tells how fast the animation will take to finish 100 steps
*/
function animateCarMarker({ lat: destinationLat, lng: destinationLng }, threshold = 3) {
  const currentLatLng = carMarker.getPosition();
  const currentLat = currentLatLng.lat();
  const currentLng = currentLatLng.lng();

  const delay = 10 * threshold;

  //increase in latitude for each step
  const deltaLat = (destinationLat - currentLat) / 100;

  //increase in longitude for each step
  const deltaLng = (destinationLng - currentLng) / 100;

  let newLat = currentLat;
  let newLng = currentLng;

  for (let step = 0; step < 100; step++) {
    (function (inStep) {
      setTimeout(function () {
        newLat += deltaLat;
        newLng += deltaLng;

        updateCarMarker(new google.maps.LatLng(newLat, newLng), carMarker.carImage);
      }, delay * inStep);
    })(step);
  }
}
