const SUMMER = 0;
const WINTER = 1;
const SNOW_SCALE = 0.2; // Size of snowflake adjuster

var needsRedraw = true;
var ishavskatedraln;
var tromsdalsntindn;
var floya;
var nordjelle;
let debugPanelVisible = false; 

function initHoverTargets() {
    ishavskatedraln = document.getElementById("ishavs");
    tromsdalsntindn = document.getElementById("tromsdalstindn");
    floya = document.getElementById("floya");
    nordjelle = document.getElementById("nordfjelle");
}

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
var WaterMark = 0.76;

// this object keeps track of all layers and handles drawing & canvas setup
var CanvasLayer = {
  layers: [],
  layerVisible: [],
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
    result.filter = "no";
    result.applyFilter = function(filter) {
      if(filter == result.lastFilter) return;
      result.lastFilter = filter;
      this.width = this.img.width;
      this.height = this.img.height;
      let ctx = this.getContext("2d");
      ctx.filter = filter;
      ctx.drawImage(img, 0, 0);
    };
    img.onload = function() {
      result.applyFilter(filter);
      CanvasLayer.imageLoaded(result);
    };
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
        (this.imagesLoaded * width) / Math.max(1, this.images.length),
        height / 2 + 20
      );
      return;
    }
    let t = (new Date()).getTime();
    let start = t;
    let rendertimes = [];
    for (let i = 0; i < this.layers.length; i++) {      
      if(this.layerVisible[i]) {
        ctx.save();
        this.layers[i].paint(ctx, width, height);
        ctx.restore();
      let t2 = (new Date()).getTime();
      rendertimes.push({name: i+". " + this.layers[i]._name || "Layer "+i, renderTime: t2 - t});
      t = t2;
      } else {
        rendertimes.push({name: i+". " + this.layers[i]._name || "Layer "+i, renderTime: "<i>--</i> "});
      }
    }
    if(animTicks % 10 === 0 && debugPanelVisible) {
      let r = "<h3>Render Times</h3><table>";
      for(i in rendertimes) {
        r += "<tr><td>" + rendertimes[i].name + "</td><td class='debug-render-times'>" + rendertimes[i].renderTime+ "ms </td></tr>";
      }
      let ffs = this.lastRender ? (start - this.lastRender) : (t-start);
    
      r += "</table><h3>Total:" + (t - start) + "ms (+"+(ffs - (t-start))+"ms), " +(1000 / ffs).toFixed(2) + " fps</h3>";
      document.getElementById("debuginfo").innerHTML = r;
    }
    this.lastRender = start;
  },
  // this method should be called when the page is loaded
  initialize: function(targetCanvas) {
    this.canvas = document.getElementById(targetCanvas);
    animateProc();
  },
  // use this method to add layers to the scene
  addLayer: function(layer, name) {
    if(name)
    layer["_name"] = name;
    this.layers.push(layer);
    this.layerVisible.push(true);
    layer.initialize(this);
  },
  // signals the day cycle (0 = day, 1 = night) to all layers
  setDayCycle: function(value) {
    for (let i = 0; i < this.layers.length; i++)
      if (this.layers[i].setDayCycle) this.layers[i].setDayCycle(value);
  }
};

var SkyLayer = {
    topColor: new Color(224, 22, 224),
    bottomColor: new Color(224, 124, 224),
  initialize: function(canvasLayer) {
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
    //this.topColor = this.dayColors.top.blend(this.nightColors.top, amount);
    //this.bottomColor = this.dayColors.bottom.blend(
    //  this.nightColors.bottom,
    //  amount
    //);
  }
};

function smoothstep(x) { return 3*x*x - 2*x*x*x; }

var CloudLayer = {
  clouds: [],
  cloudAlpha: 1,
  cloudAmount: 1,
  initialize: function(canvasLayer) {
    this.cloud1 = canvasLayer.loadImage("./Images/cloud1.png");
    this.cloud2 = canvasLayer.loadImage("./Images/cloud2.png");
    for (let i = 0; i < 36; i++) {
      this.clouds.push({
        x: Math.random(),
        y: Math.random() * 0.5,
        image: this["cloud" + (1 + (i % 2))],
        size: 0.25 + Math.random() * 0.1
      });
    }
    return this;
  },
  paint: function(ctx, width, height) {
    ctx.globalAlpha = 1;
    for (let i = 0; i < Math.round(Math.min(1, this.cloudAmount) * this.clouds.length); i++) {
      let c = this.clouds[i];
      let w = width * c.size;
      let h = w * c.image.ratio;
      let x = c.x * width - w / 2 + 500 * Math.sin(animTicks / 1000 + i / 2);
      if(this.cloudAlpha < 1) {
        let outx = c.x>0.5 ?  (width + w) : - (width + w);
        x = outx + (x - outx) * smoothstep(Math.min(1, this.cloudAlpha * (1 + i/60)));
      }
      let y = c.y * height - h / 2;
      ctx.drawImage(c.image, x, y, w, h);
    }
    ctx.globalAlpha = 1;
  },
  setDayCycle: function(amount) {
    this.cloudAlpha = 1 - amount * 1;
  }
};

var MountainLayer = {
  initialize: function(canvasLayer) {
    this.tromsdalstin = canvasLayer.loadImage("./Images/Tromsdalstin.png");
    this.hueRotate = 0.5;
    this.quake = 0;
  },
  paint: function(ctx, width, height) {
    ctx.globalAlpha = 1;
    let h = width * this.tromsdalstin.ratio;
    ctx.filter =  `sepia(100%) hue-rotate(${this.hueRotate * 360}deg) brightness(100%) saturate(70%)`; 
    // const t = Math.sin(animTicks/100); // For parallaxing
    const t = 0;
    const yPosition = height * WaterMark * (1.03 + this.quake * (0.02 + 0.01*Math.sin(animTicks/3))) - h;
    const drawnWidth = width * 1.1;
    const deltaWidth = (drawnWidth - width) / 2;
    const drawnHeight = h * 1.1;
    ctx.drawImage(
      this.tromsdalstin,
      t * 15 - deltaWidth,
      yPosition,
      drawnWidth,
      drawnHeight
    );
    if(needsRedraw){
      setHoverElement(tromsdalstindn,t * 15 - deltaWidth + (drawnWidth*0.35) , yPosition + (drawnHeight * 0.25), drawnHeight * 0.40, drawnWidth*0.3 );
    }
    ctx.filter = "none";
  }
};

var CityLayer = {
  initialize: function(canvasLayer) {
    this.city = canvasLayer.loadImage("./Images/CityWithRoadCutout.png");
    this.floya = canvasLayer.loadImage("./Images/Floya.png");
    this.nordFjellet = canvasLayer.loadImage("./Images/NordFjellet.png");
    this.t = 0;
    this.t2 = 0;
    this.width = window.innerWidth;
    this.quake = 0;
  },
  parallax: function(x, y) {
    // Should probably have a more accurate width here;
    this.t2 =  -(1-x/this.width);
  },
  paint: function(ctx, width, height) {
    this.t += (this.t2 - this.t) * 0.05;
    this.width = width;
    let h = width * this.city.ratio;
    ctx.filter =  `sepia(100%) hue-rotate(${this.hueRotate * 360}deg) brightness(100%) saturate(100%)`; 
    const yPosition = height * WaterMark * 1.03 - h;
    const drawnWidth = width * 1.03;
    const deltaWidth = (drawnWidth - width) / 2;
    const drawnHeight = h * 1.03;
    ctx.drawImage(
      this.nordFjellet,
      (this.t * width*25/1200) - deltaWidth,
      yPosition + height * (0.015 + 0.015 * Math.sin(animTicks/3 + 1))*this.quake,
      drawnWidth,
      drawnHeight
    );
    ctx.drawImage(
      this.floya,
      (this.t * width*35/1200) - deltaWidth,
      yPosition+ height * (0.012 + 0.012 * Math.sin(animTicks/3 + 1.5))*this.quake,
      drawnWidth,
      drawnHeight
    );
    ctx.drawImage(
      this.city,
      (this.t * width*40/1200)- deltaWidth,
      yPosition + height * (0.01 + 0.01 * Math.sin(animTicks/3 + 2))*this.quake,
      drawnWidth,
      drawnHeight
    );
    if(needsRedraw){
      setHoverElement(ishavskatedraln,(this.t * width*40/1200)- deltaWidth, yPosition + (drawnHeight * 0.70), drawnHeight * 0.20, drawnWidth*0.1);
      setHoverElement(floya,(this.t * width*35/1200) - deltaWidth + (drawnWidth*0.65), yPosition + (drawnHeight * 0.03), drawnHeight * 0.60, drawnWidth*0.35 );
      setHoverElement(nordjelle,(this.t * width*25/1200) - deltaWidth, yPosition + (drawnHeight * 0.40), drawnHeight * 0.30, drawnWidth*0.34 );
      needsRedraw = false;
    }
    ctx.filter = "none";
    ctx.globalAlpha = 1;
  },
  setDayCycle: function(value) {
    this.nightAlpha = value;
  }
};

const SunLayer = {
  doomsizeMultiplier: 1.0005,
  doomsize: 1,
  initialize: function(canvasLayer) {
    this.doom = false;
    this.doomx = 1;
    this.sun = canvasLayer.loadImage("./Images/sun.png");
    this.doomsun = canvasLayer.loadImage("./Images/doomsun.png");
  },
  paint: function(ctx, width, height) {
    ctx.globalAlpha = 1;
      if(this.doom){
        let doombounce = (1 + 0.24 * Math.sin(animTicks/3));
        if (this.doomsize < 20){
          this.doomsize = width/8;
          this.doomx = width - (this.doomsize/2) ;
        }
        ctx.globalAlpha = this.alpha;
        let sunsize= this.doomsize * doombounce;
        let x = this.doomx;
        let y = -(sunsize/2);
        ctx.drawImage(this.doomsun,Math.max((width/2)-(this.doomsize*doombounce/2),x - sunsize/2), y , sunsize, sunsize);
        this.doomsize = this.doomsize * this.doomsizeMultiplier;
        this.doomx -= 0.21 + ((this.doomsize * this.doomsizeMultiplier) - this.doomsize);
    } 
    else  {
      ctx.globalAlpha = this.alpha;
      let sunsize= width/4;
      let x = width - (sunsize/2) ;
      let y = -(sunsize/2);
      ctx.drawImage(this.sun, x, y, sunsize, sunsize);
    }
    ctx.globalAlpha = 1;

  },
  setDayCycle: function(value) {
    // hmmm...
  }
}

//const starTypes = ["✵", "✴", "✦", "✸"];
//const starsizes = ["5px Arial"];
const pointColors = ["rgb(255, 255, 255)"];
const pointSizes = [1,2];

const StarLayer = {
  stars: [],
  alpha: 1,
  previousWidth: 1,
  width: window.innerWidth,
  initialize: function(canvasLayer) {
    let starCount = 100;
    for (let i = 0; i < starCount; i++) {
      let x = Math.ceil(Math.random() * this.width);
      let y = Math.ceil(Math.random() * 800) - 200;
      let star = {
        x,
        y
      };
      this.stars.push(star);
    }
    this.alpha = 0;
  },

  paint: function(ctx, width, height) {
    if(this.alpha <= 0 ) return;
    if( this.width != width){
      this.stars = [];
      this.width = width;
      this.initialize();
    }
    ctx.globalAlpha = this.alpha;
    for (i in this.stars) {
      ctx.fillStyle = pointColors[(i) % pointColors.length];
      //ctx.font = starsizes[Math.floor(Math.random() * starsizes.length)];
      let x = this.stars[i].x + 0.3;
      let t = Math.sin((x / width) * Math.PI);
      let ydirection = -1;
      if (x > width) {
        x = 0;
        this.stars[i].y = Math.ceil(Math.random() * 800) - 200;
      }
      if (x > width / 2) {
        ydirection = 1;
      }
      let curvesize = 0.3 * (1 - t);
      this.stars[i].x = x;
      this.stars[i].y = this.stars[i].y + curvesize * ydirection;
      ctx.beginPath();
      ctx.arc(this.stars[i].x, this.stars[i].y, pointSizes[i % pointSizes.length], 0, 2 * Math.PI);

      ctx.fill();
      ctx.closePath();
    }
    ctx.globalAlpha = 1;
  },
  setDayCycle: function(value) {
    this.nightAlpha = value;
  }
};

var SnowLayer = {
  snow: [],
  initialize: function(canvasLayer) {
    for (let i = 0; i < 500; i++) {
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
    const flakes = ["•"];
    ctx.globalAlpha = this.alpha;
    for (let i = 0; i < this.snow.length; i++) {
      let f = this.snow[i];
      f.speedY += 0.00001 + Math.random() * 0.00001 - 0.000005;
      f.speedX += Math.random() * 0.0001 - 0.00005;
      f.x += f.speedX * f.z;
      f.y += f.speedY * f.z;
      ctx.beginPath();
      ctx.arc(f.x * width, f.y * height, 5 * (0.1 + f.z) * SNOW_SCALE, 0, 2 * Math.PI);
      //ctx.endPath();
      ctx.fill();
      if (f.y > WaterMark) {
        f.y = -0.05;
        f.speedX = 0;
        f.speedY = 0.001;
      }
      // ctx.arc(f.x * width, f.y * height, 1, 0, Math.PI * 2);
      // ctx.fillText(".", f.x * width, f.y * height);
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
    for (let i = 0; i < 200; i++) {
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
    const flakes = ["•"];
    ctx.globalAlpha = this.alpha;
    for (let i = 0; i < this.snow.length; i++) {
      let f = this.snow[i];
      f.speedY += 0.00005 + Math.random() * 0.00001 - 0.000005;
      f.speedX += Math.random() * 0.0001 - 0.00005;
      f.x += f.speedX * f.z;
      f.y += f.speedY * f.z;
      ctx.beginPath();
      ctx.arc(f.x * width, f.y * height, 5 * (0.1 + f.z) * SNOW_SCALE, 0, 2 * Math.PI);
      if (f.y > 1.05) {
        f.y = -0.05;
        f.speedX = 0;
        f.speedY = 0.001;
      }
      //ctx.closePath();
      ctx.fill();
      // ctx.arc(x, y, 1, 0, Math.PI * 2);
      // ctx.fillText("*", f.x * width, f.y * height);
    }
    ctx.globalAlpha = 1;
  },
  setDayCycle: function(value) {
    this.alpha = value;
  }
};

var CopyLayer = {
  initialize: function(canvasLayer) {
    this.canvas = document.createElement("canvas");
  },
  paint: function(ctx, width, height) {
    this.canvas.width = width;
    this.canvas.height = height;
    this.canvas.getContext("2d").drawImage(CanvasLayer.canvas, 0, 0);
  }
};

// TODO Move this water layer upwards to meet the mountain layer; note the offset
var WaterLayer = {
  initialize: function(canvasLayer) {
    this.waterCanvas = document.createElement("canvas");
    this.city = canvasLayer.loadImage("./Images/tromsocolor.png");
    this.alpha = 1;
  },
  fakeReflection: function(ctx, x, y, width) {
    let reflectionLength = 200;
    ctx.beginPath();
    //ctx.arc(x, Math.max(0, y) + width / 2, width / 2, 0, Math.PI * 2);
    ctx.rect(
      x - width / 2,
      Math.max(0, y),
      width,
      reflectionLength
    );
    ctx.closePath();
    ctx.fill();
  },
  lightAlpha: 1,
  paintWater: function(ctx, width, height) {
    ctx.globalAlpha = 0.2;
    ctx.scale(0.5, -0.5*0.33);
    ctx.drawImage(
      CopyLayer.canvas, //this.city,
      0,
      -height * 3
    );
    ctx.scale(1, -1 / 0.75);
    ctx.globalAlpha = 1;//this.lightAlpha;
    
    var grad = ctx.createLinearGradient(0, 0, 0, 200);
    color = "rgba(255,255,192,";
    grad.addColorStop(0, color + "0.6)");
    //grad.addColorStop(0.5, color + "0.25)");
    grad.addColorStop(1, color + "0)");
    //grad.addColorStop(0.75, "rgba(255, 255, 255, 0.05)");
    ctx.fillStyle = grad;

    for (let i = 0; i < 25; i++) {
      this.fakeReflection(
        ctx,
        ((animTicks/6000 + Math.sin(i/11.4))*2*width)%(2*width) ,
        0,
        5,
        "rgb(255, 255, 255)"
      );
    } 
  },
  paint: function(ctx, width, height) {
    if(this.alpha <= 0) return;
    this.waterCanvas.width = width * 0.5;
    this.waterCanvas.height = height * (1 - WaterMark);
    this.paintWater(
      this.waterCanvas.getContext("2d"),
      this.waterCanvas.width,
      this.waterCanvas.height
    );

    // Draw sliced image onto the canvas
    // Start at 0?
    let steps = 150;
    //ctx.drawImage(this.waterCanvas, 0, 0);
    ctx.globalAlpha = 1;//this.alpha;
    for (let i = 0; i < steps; i++) {
      let h = (height * (1 - WaterMark)) / steps;
      ctx.drawImage(
        this.waterCanvas,
        0,
        i * h * 0.5,
        width * 0.5,
        h * 0.5,
        Math.sin(i * 2 + animTicks / 10) * (1+(6 * i) / steps) +
          ((15 * (i * i)) / (steps * steps)) *
            Math.sin(i / 10 + animTicks / 30),
        height * WaterMark + i * h,
        width,
        h
      );
    }
    ctx.globalAlpha = 1;
  }
};

var NorthernLights = {
  initialize: function(canvasLayer) {
    this.canvas = document.createElement("canvas");
    this.canvas2 = document.createElement("canvas");
    this.points = [
      { x: -0.1, y: 0.25 },
      { x: 0.4, y: 0.1 },
      //{x: 0.1, y:0.1},
      { x: 0.6, y: 0.4 },
      { x: 0.5, y: 0.7 },
      { x: 1.0, y: 1.0 }
    ];
    this.globalAlpha = 0;
  },
  paintLight: function(ctx, width, height) {
    let points = this.points;
    ctx.globalAlpha = 0.5;
    ctx.lineWidth = 10;
    ctx.clearRect(0, 0, width, height);

    //First Northern Light
    let translations = [{x:-20, y:-10}, {x:40, y:50}, {x:-20,y:-40}];
    let colors = ["rgba(255, 255, 0, 0.15", "rgba(0, 255, 0, 0.15), rgba(0, 255, 0, 0.6)"];
    
    for(let j = 0; j < translations.length; j++) {
    ctx.translate(translations[j].x, translations[j].y);
    ctx.strokeStyle = colors[j];
    ctx.beginPath();
    ctx.moveTo(points[0].x * width, points[0].y * height);
    for (i = 1; i < points.length - 2; i++) {
      var xc = (width * (points[i].x + points[i + 1].x)) / 2;
      var yc = (height * (points[i].y + points[i + 1].y)) / 2;
      ctx.quadraticCurveTo(points[i].x * width, points[i].y * height, xc, yc);
    }
    // curve through the last point
    ctx.quadraticCurveTo(
      width * points[i].x,
      height * points[i].y,
      width * points[i + 1].x,
      height * points[i + 1].y
    );
    //ctx.closePath();
    ctx.stroke();
    } 
},
  paintFx: function(ctx, width, height) {
    ctx.clearRect(0, 0, width, height);
    ctx.globalAlpha = 0.5;
    ctx.drawImage(this.canvas, 0, 0);
    ctx.globalAlpha =
      0.45 + 0.1 * Math.sin(Math.sin(animTicks / 1000) + animTicks / 100);
    for (let i = 10; i >= 0; i--) {
      ctx.drawImage(
        this.canvas2,
        3 * Math.sin(i * 9 + animTicks / 1000),
        -3 - i * 1.65
      );
    }
  },
  paint: function(ctx, width, height) {
    if(this.alpha <=0 ) return;
    if (this.canvas.width != width * 0.5) {
      this.canvas.width = width * 0.5;
      this.canvas.height = height * 0.25;
      this.canvas2.width = width * 0.5;
      this.canvas2.height = height * 0.25;
    }
    for (let i = 0; i < this.points.length - 1; i++) {
      this.points[i].x += Math.sin(animTicks / 30 + i * 82) * 0.0001;
      this.points[i].y = 0.6 + 0.35 * Math.sin(animTicks / 120 + i * 4);
    }
    this.paintLight(
      this.canvas.getContext("2d"),
      this.canvas.width,
      this.canvas.height
    );
    this.paintFx(
      this.canvas2.getContext("2d"),
      this.canvas2.width,
      this.canvas2.height
    );
    ctx.globalAlpha = this.alpha * this.alpha * 0.6;
    ctx.drawImage(this.canvas2, 0, 0, width * 0.5, width * 0.25, 0, 0, width, height * 0.5);
  },
  setDayCycle: function(value) {
    this.alpha = value;
  }
};

var BlackOverlay = {
  initialize: function() {},
  alpha: 0,
  paint: function(ctx, width, height) {
    if(this.alpha<=0) return;
    ctx.fillStyle="#000";
    ctx.globalAlpha=this.alpha;
    ctx.fillRect(0, 0, width, height);
    ctx.globalAlpha=1;
  }
};

var animTicks = 0;
function animateProc() {
  CanvasLayer.paint();
  animTicks++;
  //CanvasLayer.setDayCycle(0.5 + 0.5 * Math.sin(animTicks / 500));
  StoryBoard.timerTick();
  window.requestAnimationFrame(animateProc);
}

function startDoom(){
  SunLayer.doom = true;
}

function ready(fn) {
  if (
    document.attachEvent
      ? document.readyState === "complete"
      : document.readyState !== "loading"
  ) {
    fn();
  } else {
    document.addEventListener("DOMContentLoaded", fn);
  }
}

function setHoverElement(element, x, y, height, width) {
  element.style.top = y + height/2 + (window.innerHeight*0.015) + "px";
  element.style.left = x + width/2 + (window.innerWidth*0.015) + "px";
  // element.style.width = width + "px";
  // element.style.height = height+ "px";
}

function initializeLayers() {
  CanvasLayer.addLayer(SkyLayer, "Sky");
  CanvasLayer.addLayer(SunLayer, "Black old sun");
  CanvasLayer.addLayer(StarLayer, "Stars");
  CanvasLayer.addLayer(NorthernLights, "Northern Lights");
  CanvasLayer.addLayer(MountainLayer, "Mountain");
  CanvasLayer.addLayer(CloudLayer, "Clouds");
  //CanvasLayer.addLayer(SnowLayer, "Snow");
  CanvasLayer.addLayer(WaterLayer, "Water");
  CanvasLayer.addLayer(CityLayer, "City");
  CanvasLayer.addLayer(CopyLayer, "Copy Layer");
  //CanvasLayer.addLayer(SnowLayer2, "Snow 2");
  CanvasLayer.addLayer(BlackOverlay, "Black Overlay");

}

ready(() => {
  initializeLayers();
  initHoverTargets();
    const entryButton = document.getElementById("entry-button");
    entryButton.addEventListener("click", () => {
      document.getElementById("audio-element").play();
      document.getElementById("intro-container").style.display = "none";

      //CanvasLayer.setDayCycle(1);
      StoryBoard.initialize();
      CanvasLayer.initialize("main");


      // Control parallax effect for the city
      const texture = document.getElementById("main-texture");
      const marker = document.getElementById("markers"); 
      let mouseTimeout;
      window.setTimeout(() => {
        let isHovered = false;
        window.addEventListener("mousemove", (evt) => {
          CityLayer.parallax(evt.x, evt.y);
          marker.classList.add("visible");
          mouseTimeout && clearTimeout(mouseTimeout);
          if (!isHovered) {
            mouseTimeout = setTimeout(() => {
              marker.classList.remove("visible");
            }, 1000);
          }
        });

        const markers = [
          {id: "ishavs", desc: "ARCTIC CATHEDRAL / ISHAVSKATEDRALEN\nConstruction completed in 1965\n\nBuilt mainly of aluminium-coated concrete panels, and designed by Norwegian architect Jan Inge Hovig, this church is the most famous landmark in Tromsø."}, 
          {id: "tromsdalstindn", desc: "TROMSDALSTINDEN / SÁLAŠOAIVI\n1,238 metres\n\nTromsdalstinden is a popular hiking destination. The Sámi name is comprised of the fact it is a good hunting area and has no jagged peaks."},
          {id: "floya", desc: "STORSTEINEN\n421 metres\n\nA four minute trip on the aerial tramway or a walk up the stone staircase will take you to the summit. A popular place to get a good view of Tromsø."}, 
          {id: "nordfjelle", desc: "NORDFJELLET\n626 metres\n\nIf you have an interesting factoid about this peak, please share."}
        ];
        const markerDescription = document.getElementById("marker-description");
        markers.map(markerItem => {
          const markerElement = document.getElementById(markerItem.id);
          markerElement.addEventListener("mouseenter", () => {
            markerDescription.innerText = markerItem.desc;
            markerDescription.style.display = 'block';
            isHovered = true;
          });
          markerElement.addEventListener("mouseleave", () => {
            markerDescription.style.display = 'none';
            isHovered = false;
          });
        });
      }, 5000);
    });

    window.addEventListener("keypress", function(e) {
      // Show/hide the debug panel when you press 'd'
      if (e.keyCode === 100) {
        const displayState = debugPanelVisible ? 'none' : 'block';
        document.getElementById("debuginfo").style.display = displayState;
        debugPanelVisible = !debugPanelVisible;
      }
      if((e.keyCode>=48)&&(e.keyCode<58)) {
        CanvasLayer.layerVisible[e.keyCode - 48] = !CanvasLayer.layerVisible[e.keyCode - 48];
      }
    });
});

 window.addEventListener("resize", function() {
  needsRedraw = true;
});