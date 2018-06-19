
const SUMMER = 0;
const WINTER = 1;

/* holds rgb(a) values which can be converted into a style-compatible string.
   additionally it allows blending with another color (returns a new Color instance) */
function Color(r, g, b, a) {
  this.r = r;
  this.g = g;
  this.b = b;
  this.a = a;
  this.toString = function() {
    var col = this.r + ", " + this.g + ", " + this.b;
    return this.a ? "rgba(" + col + ", " + this.a + ")" : "rgb(" + col + ")";
  };
  this.blend = function(color, blend) {
    let r = this.r + (color.r - this.r) * blend;
    let g = this.g + (color.g - this.g) * blend;
    let b = this.b + (color.b - this.b) * blend;
    let a1 = this.a || 1;
    let a2 = color.a || 1;
    let a = this.a || color.a ? a1 + (a2 - a1) * blend : undefined;
    return new Color(r, g, b, a);
  };
}

// best name ever, this is (in %) where the water in the scene starts
var WaterMark = 0.72;

// this object keeps track of all layers and handles drawing & canvas setup
var CanvasLayer = {
  layers: [],
  images: [],
  imagesLoaded: 0,
  // returns an Image() object with an image 
  loadImage: function(url) {
    for (let i = 0; i < this.images.length; i++) {
      if (this.images[i].src == url) return this.images[i];
    }
    let result = new Image();
    result.src = url;
    result.onload = function() {
      CanvasLayer.imageLoaded(this);
    };
    return result;
  },
  // returns a canvas object that almost seems like an Image object, but with a filter applied
  // this is done for performance reasons as css filters on canvas are rather expensive
  loadImageFiltered: function(url, filter) {
    let img = new Image();
    let result = document.createElement("canvas");
    result.style.display = "none";
    img.src = url;
    result.img = img;
    result.applyFilter = function(filter) {
      this.width = this.img.width;
      this.height = this.img.height;
      let ctx = this.getContext("2d");
      ctx.filter = filter;
      ctx.drawImage(img, 0, 0);
    };
    img.onload = () => { result.applyFilter(filter); CanvasLayer.imageLoaded(result); };
    this.images.push(result);
    return result;
  },
  // do not use, used internally to signal when an image was loaded
  imageLoaded: function(targetImage) {
    this.imagesLoaded++;
    targetImage.ratio = targetImage.height / targetImage.width;
    if (this.imagesLoaded >= this.images.length) this.loaded = true;
  },
  // this method should be called in requested animation frames
  paint: function() {
    if (!this.canvas) return;
    var ctx = this.canvas.getContext("2d");
    var width = (this.canvas.width = this.canvas.clientWidth);
    var height = (this.canvas.height = this.canvas.clientHeight);
    ctx.clearRect(0, 0, width, height);
    if (!this.loaded) {
      ctx.fillStyle = "rgb(255, 255, 255)";
      ctx.fillRect(
        0,
        height / 2 - 10,
        this.imagesLoaded * width / Math.max(1, this.images.length),
        height / 2 + 20
      );
      return;
    }
    for (let i = 0; i < this.layers.length; i++)
      this.layers[i].paint(ctx, width, height);
  },
  // this method should be called when the page is loaded
  initialize: function(targetCanvas) {
    this.canvas = document.getElementById(targetCanvas);
    animateProc();
  },
  // use this method to add layers to the scene
  addLayer: function(layer) {
    this.layers.push(layer);
    layer.initialize(this);
  },
  // signals the day cycle (0 = day, 1 = night) to all layers 
  setDayCycle: function(value) {
    for (let i = 0; i < this.layers.length; i++)
      if (this.layers[i].setDayCycle) this.layers[i].setDayCycle(value);
  }
};

var SkyLayer = {
  dayColors: {
    top: new Color(92, 130, 189),
    bottom: new Color(152, 192, 240)
  },
  nightColors: {
    // (#011642, #0e58bc
    top: new Color(01, 22, 102),
    bottom: new Color(14, 124, 224)
  },
  initialize: function(canvasLayer) {
    this.topColor = this.dayColors.top;
    this.bottomColor = this.dayColors.bottom;
    return this;
  },
  paint: function(ctx, width, height) {
    var grad = ctx.createLinearGradient(0, 0, 0, height * WaterMark);
    grad.addColorStop(0, this.topColor.toString());
    grad.addColorStop(1, this.bottomColor.toString());
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height * (WaterMark - 0.05));
  },
  setDayCycle: function(amount) {
    this.topColor = this.dayColors.top.blend(this.nightColors.top, amount);
    this.bottomColor = this.dayColors.bottom.blend(
      this.nightColors.bottom,
      amount
    );
  }
};

var CloudLayer = {
  clouds: [],
  cloudAlpha: 1,
  initialize: function(canvasLayer) {
    this.cloud1 = canvasLayer.loadImage("./Images/cloud1.png");
    this.cloud2 = canvasLayer.loadImage("./Images/cloud2.png");
    for (let i = 0; i < 30; i++) {
      this.clouds.push({
        x: Math.random(),
        y: Math.random() * 0.5,
        image: this["cloud" + (1 + i % 2)],
        size: 0.25 + Math.random() * 0.1
      });
    }
    return this;
  },
  paint: function(ctx, width, height) {
    ctx.globalAlpha = this.cloudAlpha;
    for (let i = 0; i < this.clouds.length; i++) {
      let c = this.clouds[i];
      let w = width * c.size;
      let h = w * c.image.ratio;
      let x = c.x * width - w / 2 + 500 * Math.sin(animTicks / 1000 + i / 2);
      let y = c.y * height - h / 2;
      ctx.drawImage(c.image, x, y, w, h);
    }
    ctx.globalAlpha = 1;
  },
  setDayCycle: function(amount) {
    this.cloudAlpha = 1 - amount * 1;
  }
};

var CityLayer = {
  initialize: function(canvasLayer) {
    this.city = canvasLayer.loadImage("./Images/CityWithRoadCutout.png");
    this.nightCity = canvasLayer.loadImageFiltered("./Images/CityWithRoadCutout.png", "sepia(100%) hue-rotate(180deg) brightness(75%) saturate(300%)");
    this.tromsdalstin = canvasLayer.loadImage("./Images/Tromsdalstin.png");
    this.floya = canvasLayer.loadImage("./Images/Floya.png");
    this.nordFjellet = canvasLayer.loadImage("./Images/NordFjellet.png");

    // this.nightCity = canvasLayer.loadImageFiltered("./Images/tromsocolor.png", "sepia(100%) hue-rotate(180deg) brightness(75%) saturate(300%)");
    // this.city = canvasLayer.loadImage("./Images/tromsocolor.png");
  },
  paint: function(ctx, width, height) {
    let h = width * this.city.ratio;
    //  ctx.filter = ;
    const t = Math.sin(animTicks/100);
    const yPosition = height * WaterMark - h;
    const drawnWidth = width * 1.05;
    const deltaWidth = (drawnWidth - width)/2;
    const drawnHeight = h * 1.05;
    ctx.drawImage(this.tromsdalstin, t * 15 - deltaWidth, yPosition, drawnWidth, drawnHeight);
    ctx.drawImage(this.nordFjellet, t * 20 - deltaWidth, yPosition, drawnWidth, drawnHeight);
    ctx.drawImage(this.floya, t * 25 - deltaWidth, yPosition, drawnWidth, drawnHeight);
    ctx.drawImage(this.city, t * 35 - deltaWidth, yPosition, drawnWidth, drawnHeight);
    ctx.globalAlpha = this.nightAlpha;
    // ctx.drawImage(this.nightCity, 0, height - h, width, h);
    ctx.globalAlpha = 1;
  },  
  setDayCycle: function(value) {
    this.nightAlpha = value;
  }
};

var SnowLayer = {
  snow: [],
  initialize: function(canvasLayer) {
    for (let i = 0; i < 1000; i++) {
      this.snow.push({
        x: Math.random(),
        y: Math.random(),
        z: 0.5 + Math.random() * 0.5,
        speedX: 0,
        speedY: 0
      });
    }
    this.alpha = 0;
  },
  paint: function(ctx, width, height) {
    if (this.alpha == 0) return;
    ctx.fillStyle = "#fff";
    ctx.font = "16px jabin";
    const flakes = ['•'];
    ctx.globalAlpha = this.alpha;
    for (let i = 0; i < this.snow.length; i++) {
      let f = this.snow[i];
      f.speedY += 0.00001 + Math.random() * 0.00001 - 0.000005;
      f.speedX += Math.random() * 0.0001 - 0.00005;
      f.x += f.speedX * f.z;
      f.y += f.speedY * f.z;
      //ctx.beginPath();
      ctx.arc(f.x * width, f.y * height, 5 * (0.1 + f.z), 0, 2 * Math.PI);
      if (f.y > WaterMark) {
        f.y = -0.05;
        f.speedX = 0;
        f.speedY = 0.001;
      }
      ctx.fillText(".", f.x * width, f.y * height);
    }
    ctx.globalAlpha = 1;
  },
  setDayCycle: function(value) {
    this.alpha = value;
  }
};

var SnowLayer2 = {
  snow: [],
  initialize: function(canvasLayer) {
    for (let i = 0; i < 1000; i++) {
      this.snow.push({
        x: Math.random(),
        y: Math.random(),
        z: 0.5 + Math.random() * 0.5,
        speedX: 0,
        speedY: 0
      });
      this.alpha = 0;
    }
  },
  paint: function(ctx, width, height) {
    if (this.alpha == 0) return;
    ctx.fillStyle = "#fff";
    ctx.font = "24px jabin";
    const flakes = ['•'];
    ctx.globalAlpha = this.alpha;
    for (let i = 0; i < this.snow.length; i++) {
      let f = this.snow[i];
      f.speedY += 0.00005 + Math.random() * 0.00001 - 0.000005;
      f.speedX += Math.random() * 0.0001 - 0.00005;
      f.x += f.speedX * f.z;
      f.y += f.speedY * f.z;
      //ctx.beginPath();
      ctx.arc(f.x * width, f.y * height, 5 * (0.1 + f.z), 0, 2 * Math.PI);
      if (f.y > 1.05) {
        f.y = -0.05;
        f.speedX = 0;
        f.speedY = 0.001;
      }
      ctx.fillText("*", f.x * width, f.y * height);
    }
    ctx.globalAlpha = 1;
  },
  setDayCycle: function(value) {
    this.alpha = value;
  }
};

var WaterLayer = {
  initialize: function(canvasLayer) {
    this.waterCanvas = document.createElement("canvas");
    this.city = canvasLayer.loadImage("./Images/tromsocolor.png");
  },
  fakeReflection: function(ctx, x, y, width, color) {
    let reflectionLength = 100;
    var grad = ctx.createLinearGradient(0, y, 0, y + reflectionLength);
    color = color.replace(/rgb/i, "rgba").replace(")", ", ");
    grad.addColorStop(0, color + "1)");
    grad.addColorStop(0.5, color + "0.25)");
    grad.addColorStop(1, color + "0)");
    //grad.addColorStop(0.75, "rgba(255, 255, 255, 0.05)");
    
    grad.addColorStop(1, "rgba(255, 255, 255, 0)");
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(x, Math.max(0, y) + width / 2, width / 2, 0, Math.PI * 2);
    ctx.rect(x - width/2, Math.max(0,y) + width / 2, width, reflectionLength);
    ctx.closePath();
    ctx.fill();
  },
  paintWater: function(ctx, width, height) {
    ctx.globalAlpha = 0.25;
    ctx.scale(1, -0.5);
    ctx.drawImage(this.city, 0, -width * this.city.ratio, width, width * this.city.ratio);
    ctx.scale(1, -1/0.5);
    ctx.globalAlpha = 1;
    for(let i=0; i < 50; i++) {
      this.fakeReflection(ctx, i * width / 50 + 50 * Math.sin(i/ 2 + animTicks/500), 0, 10, "rgb(255, 255, 255)");
    }  
  },
  paint: function(ctx, width, height) {
    this.waterCanvas.width = width;
    this.waterCanvas.height = height * (1 - WaterMark);
    this.paintWater(this.waterCanvas.getContext("2d"), this.waterCanvas.width, this.waterCanvas.height);

    // Reflections from city lights
    let steps = 150;
    for(let i=0; i < steps; i++) {
      let h = height * (1 - WaterMark) / steps;
      ctx.drawImage(this.waterCanvas, 0, i * h, width, h, Math.sin(i*2 + animTicks / 10) * (6*i/steps) + (15 * (i*i)/(steps*steps)) * Math.sin(i/10 + animTicks / 30), height * WaterMark + i * h, width, h);
    }
  }
};

var NorthernLights = {
  initialize: function(canvasLayer) {
    this.canvas = document.createElement("canvas");
    this.canvas2 = document.createElement("canvas");
    this.points = [
      {x: -0.1, y:0.25},
      {x: 0.4, y:0.1},
      //{x: 0.1, y:0.1},
      {x: 0.6, y: 0.4},
      {x: 0.5, y: 0.7},
      {x: 1.0, y: 0.8}
    ];
    this.globalAlpha = 0;
  },
  paintLight: function(ctx, width, height) {
    let points = this.points;
    ctx.globalAlpha = 0.5;
    ctx.lineWidth = 14;
    ctx.clearRect(0, 0, width, height);
    ctx.strokeStyle = "rgba(255, 255, 0, 0.15)";
    ctx.save();

    //First Northern Light
    ctx.translate(-20, -10);
    ctx.beginPath();
    ctx.moveTo(points[0].x * width, points[0].y * height);
    for (i = 1; i < points.length - 2; i ++)
    {
      var xc = width * (points[i].x + points[i + 1].x) / 2;
       var yc = height * (points[i].y + points[i + 1].y) / 2;
       ctx.quadraticCurveTo(points[i].x * width, points[i].y * height, xc, yc);
    }
    // curve through the last point
    ctx.quadraticCurveTo(width * points[i].x, height * points[i].y, width * points[i+1].x, height * points[i+1].y);
    //ctx.closePath();
    ctx.stroke();

    // Second Northern Light
    ctx.translate(40, 20);
    ctx.strokeStyle = "rgba(255, 128, 255, 0.15)";
    ctx.beginPath();
    ctx.moveTo(points[0].x * width, points[0].y * height);
    for (i = 1; i < points.length - 2; i ++)
    {
      var xc = width * (points[i].x + points[i + 1].x) / 2;
       var yc = height * (points[i].y + points[i + 1].y) / 2;
       ctx.quadraticCurveTo(points[i].x * width, points[i].y * height, xc, yc);
    }
    // curve through the last point
    ctx.quadraticCurveTo(width * points[i].x, height * points[i].y, width * points[i+1].x, height * points[i+1].y);
    //ctx.closePath();
    ctx.stroke();

    ctx.restore();

    ctx.strokeStyle = "rgba(0, 255, 0, 0.6)";

    // Last Northern Light
    ctx.beginPath();
    ctx.moveTo(points[0].x * width, points[0].y * height);
    for (i = 1; i < points.length - 2; i ++)
    {
       var xc = width * (points[i].x + points[i + 1].x) / 2;
       var yc = height * (points[i].y + points[i + 1].y) / 2;
       ctx.quadraticCurveTo(points[i].x * width, points[i].y * height, xc, yc);
    }
    i = points.length - 2;
    // curve through the last point
    ctx.quadraticCurveTo(width * points[i].x, height * points[i].y, width * points[i+1].x, height * points[i+1].y);
    //ctx.closePath();
    ctx.stroke();
  },
  paintFx: function(ctx, width, height) {
    ctx.clearRect(0, 0, width, height);
    ctx.globalAlpha = 0.5;
    ctx.drawImage(this.canvas, 0, 0);
    ctx.globalAlpha = 0.45 + 0.1 * Math.sin(Math.sin(animTicks/1000)+animTicks/100);
    for(let i=7; i >= 0; i--) {
    ctx.drawImage(this.canvas2, 3*Math.sin(i*9 + animTicks/1000), -3 - i*1.55);
    }
  },
  paint: function(ctx, width, height) {
    if(this.canvas.width != width) {
    this.canvas.width = width;
    this.canvas.height = height * 0.5;
    this.canvas2.width = width;
    this.canvas2.height = height * 0.5;
    }
    for(let i=0; i < this.points.length-1; i++) {
      this.points[i].x += Math.sin(animTicks/30 + i*82) * 0.0001;
      this.points[i].y = 0.5 + 0.35 * Math.sin(animTicks / 300 + i*4);
    }
    this.paintLight(this.canvas.getContext("2d"), this.canvas.width, this.canvas.height);
    this.paintFx(this.canvas2.getContext("2d"), this.canvas2.width, this.canvas2.height);
    ctx.globalAlpha = this.alpha * this.alpha * 0.6;
    ctx.drawImage(this.canvas2, 0, 0);
  },
  setDayCycle: function(value) {
    this.alpha = value;
  }
}


var animTicks = 0;
function animateProc() {
  CanvasLayer.paint();
  animTicks++;
  CanvasLayer.setDayCycle(0.5 + 0.5 * Math.sin(animTicks / 500));
  window.requestAnimationFrame(animateProc);
}


function ready(fn) {
  if (document.attachEvent ? document.readyState === "complete" : document.readyState !== "loading"){
    fn();
  } else {
    document.addEventListener('DOMContentLoaded', fn);
  }
}

ready(() => {
  const el = document.getElementById("entry-button");
  el.addEventListener("click", () => { 
    document.getElementById("intro-container").style.display = 'none';

    CanvasLayer.addLayer(SkyLayer);
    CanvasLayer.addLayer(NorthernLights);
    CanvasLayer.addLayer(CloudLayer);
    CanvasLayer.addLayer(SnowLayer);
    CanvasLayer.addLayer(WaterLayer);
    CanvasLayer.addLayer(CityLayer);
    CanvasLayer.addLayer(SnowLayer2);

    CanvasLayer.setDayCycle(1);
    CanvasLayer.initialize('main');
  });
})