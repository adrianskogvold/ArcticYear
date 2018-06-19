

var WaterMark = 0.8;

var CanvasLayer = {
    layers: [],
    images: [],
    imagesLoaded: 0,
    loadImage: function(url) {
        for(let i=0; i < this.images.length; i++) {
            if(this.images[i].src == url)
                return this.images[i];
        }
        let result = new Image();
        result.src = url;
        result.onload = function() { CanvasLayer.imageLoaded(this); };
        return result;
    },
    imageLoaded: function(targetImage) {
        this.imagesLoaded++;
        targetImage.ratio = targetImage.height/targetImage.width;
        if(this.imagesLoaded >= this.images.length)
            this.loaded = true;
    },
    paint: function() {
        if(!this.canvas)
            return;
        var ctx = this.canvas.getContext("2d");
        var width = this.canvas.width = this.canvas.clientWidth;
        var height = this.canvas.height = this.canvas.clientHeight;
        ctx.clearRect(0, 0, width, height);
        if(!this.loaded) {
            ctx.fillStyle = "rgb(255, 255, 255)";
            ctx.fillRect(0, height / 2 - 10, this.imagesLoaded * width / max(1, this.images.length), height / 2 + 20);
            return;
        }
        for(let i=0; i < this.layers.length; i++)
            this.layers[i].paint(ctx, width, height);
    },
    initialize: function(targetCanvas) {
        this.canvas = document.getElementById(targetCanvas);
        animateProc();
    },
    addLayer: function(layer) { this.layers.push(layer); layer.initialize(this); }
};

var CloudLayer = {
    clouds: [],
    initialize: function(canvasLayer) {
        this.cloud1 = canvasLayer.loadImage("./Images/cloud1.png");
        this.cloud2 = canvasLayer.loadImage("./Images/cloud2.png");
        for(let i=0; i < 30; i++) {
            this.clouds.push({x: Math.random(), y: Math.random() * 0.5, image: this["cloud" + (1 + (i % 2))], size: 0.25 + Math.random() * 0.1});
        }
        return this;   
    },
    paint: function(ctx, width, height) {
        var grad = ctx.createLinearGradient(0, 0, 0, height * WaterMark);
        grad.addColorStop(0, "rgb(92, 130, 189)");
        grad.addColorStop(1, "rgb(152, 192, 240)");
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, width, height * WaterMark);
        for(let i=0; i < this.clouds.length; i++) {
            let c = this.clouds[i];
            let w = width * c.size;
            let h = w * c.image.ratio;
            let x = c.x * width - w/2 + 500 * Math.sin(animTicks/1000 + i / 2);
            let y = c.y * height - h/2;
            ctx.drawImage(c.image, x, y, w, h);
        }
    }
}

var CityLayer = {
    initialize: function(canvasLayer) {
        this.city = canvasLayer.loadImage("./Images/tromsocolor.png");
    },
    paint: function(ctx, width, height) {
        let h = width * this.city.ratio;
        ctx.drawImage(this.city, 0, height * WaterMark - h, width, h);
    }
};

var SnowLayer = {
    snow: [],
    initialize: function(canvasLayer) {
        for(let i=0; i < 1000; i++) {
            this.snow.push({x: Math.random(), y: Math.random(), z: (0.5 + Math.random() * 0.5), speedX: 0, speedY: 0});
        }
    },
    paint: function(ctx, width, height) {
        ctx.fillStyle = "#fff";
        ctx.font = "16px serif";
        const flakes=["❄","❅","❆"];
        for(let i=0; i < this.snow.length; i++) {
            let f=this.snow[i];
            f.speedY += 0.00001 + Math.random() * 0.00001 - 0.000005;
            f.speedX += Math.random() * 0.0001 - 0.00005;
            f.x += f.speedX * f.z;
            f.y += f.speedY * f.z;
            //ctx.beginPath();
            ctx.arc(f.x * width, f.y * height, 5 * (0.1 + f.z), 0, 2 * Math.PI);
            if(f.y > WaterMark ) {
                f.y = -0.05;
                f.speedX = 0;
                f.speedY = 0.001;
            }
            ctx.fillText("*", f.x * width, f.y * height);
            }
    }
};

var SnowLayer2 = {
    snow: [],
    initialize: function(canvasLayer) {
        for(let i=0; i < 1000; i++) {
            this.snow.push({x: Math.random(), y: Math.random(), z: (0.5 + Math.random() * 0.5), speedX: 0, speedY: 0});
        }
    },
    paint: function(ctx, width, height) {
        ctx.fillStyle = "#fff";
        ctx.font = "24px serif";
        const flakes=["❄","❅","❆"];
        for(let i=0; i < this.snow.length; i++) {
            let f=this.snow[i];
            f.speedY += 0.00005 + Math.random() * 0.00001 - 0.000005;
            f.speedX += Math.random() * 0.0001 - 0.00005;
            f.x += f.speedX * f.z;
            f.y += f.speedY * f.z;
            //ctx.beginPath();
            ctx.arc(f.x * width, f.y * height, 5 * (0.1 + f.z), 0, 2 * Math.PI);
            if(f.y > 1.05 ) {
                f.y = -0.05;
                f.speedX = 0;
                f.speedY = 0.001;
            }
            ctx.fillText("*", f.x * width, f.y * height);
            }
    }
}


CanvasLayer.addLayer(CloudLayer);
CanvasLayer.addLayer(SnowLayer);
CanvasLayer.addLayer(CityLayer);
CanvasLayer.addLayer(SnowLayer2);

var animTicks = 0;
function animateProc() {
    CanvasLayer.paint();
    animTicks++;
    window.requestAnimationFrame(animateProc);
  }
  