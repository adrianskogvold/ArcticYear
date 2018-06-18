//window.alert("you have been hacked");


var PixelsBeforeReflection = 100;

var derp = 0;
var SkyControl = {
    clouds: [],
    wind: 0,
    initialize: function(target) {
        this.targetContainer = document.getElementById(target);
        for(let i=0; i < 10; i++) {
            this.addCloud("Images/cloud" + (1 + (i%2)) + ".png");
        }
        document.body.addEventListener("mousemove", event => {
            SkyControl.wind = (event.x / document.body.clientWidth) * 2 - 1;
        });
    },
    addCloud: function(imageUrl)  {
        var el = document.createElement("div");
        el.className = "cloud";
        var img = document.createElement("img");
        img.src = imageUrl;
        el.image = img;
        img.onload = () => {
            el.ratio = img.height / img.width;

            el.hasLoaded = true;
            el.applyPosition();
        };
        el.appendChild(img);
        el.X = Math.random();
        el.style.zIndex = 10 + this.clouds.length;
        el.Y = Math.random() * 0.4;
        el.size = 0.25 + Math.random() * 0.1;
        el.direction = 0.0005 * Math.random();
        el.applyPosition = function(x, y) {
            if(!this.hasLoaded)
              return;

            this.X = x || this.X;
            this.Y = y || this.Y;
            var width = Math.round(this.size * document.body.clientWidth);
            var height = Math.round(width * el.ratio);
            img.width = width;
            img.height = height;
            this.style.left = Math.round(this.X * document.body.clientWidth - width/2) +  "px";
            this.style.top = Math.round(this.Y * document.body.clientHeight - height/2) + "px";

        };
        this.targetContainer.appendChild(el);
        this.clouds.push(el);
    },
    animate: function() {
        for(i in this.clouds) {
            //this.clouds[i].size = 0.5 + 0.25*Math.sin(++derp/200 + i);
            this.clouds[i].X += this.clouds[i].direction * this.wind;
            this.clouds[i].applyPosition();
        }
    }
};

var WaterControl = {
    initialize: function(target, targetCanvas) {
        this.targetContainer = document.getElementById(target);
        this.canvas = document.getElementById(targetCanvas);
        this.canvas.width = this.targetContainer.clientWidth;
        this.canvas.height = this.targetContainer.clientHeight;
        //this.draw();
    },

    fakeReflection: function(ctx, x, y, width, color) {
        let reclectionLength = 100;
        var grad = ctx.createLinearGradient(0, y, 0, y+reclectionLength);
        color = color.replace(/rgb/i, "rgba").replace(")", ", ");
        grad.addColorStop(0, color + "0.9)");
        grad.addColorStop(0.5, color + "0.25)");
        grad.addColorStop(1, color + "0)");
        //grad.addColorStop(0.75, "rgba(255, 255, 255, 0.05)");
        
        grad.addColorStop(1, "rgba(255, 255, 255, 0)");
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(x, Math.max(PixelsBeforeReflection, y) + width / 2, width / 2, 0, Math.PI * 2);
        ctx.rect(x - width/2, Math.max(PixelsBeforeReflection,y) + width / 2, width, reclectionLength);
        ctx.closePath();
        ctx.fill();
    },

    draw: function() {
        var ctx = this.canvas.getContext("2d");
        ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        ctx.globalAlpha = 0.03;
        for(let i=0; i < SkyControl.clouds.length; i++) {
            let cloud = SkyControl.clouds[i];
            ctx.drawImage(cloud.image, cloud.X * this.canvas.width, PixelsBeforeReflection + (1 - cloud.Y) * this.canvas.height, cloud.size * this.canvas.width, -cloud.size * this.canvas.width * cloud.ratio * 0.6);
        }
        ctx.clearRect(0, 0, this.canvas.width, PixelsBeforeReflection);

        ctx.globalAlpha = 1;
        //ctx.drawImage(this.canvas,  0.1*Math.sin(++derp/3), 1.5);
        //ctx.fillStyle = "rgba(0, 0, 0, 0.04)";
        //ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        let lightCount = 100;
        let pointSizes = [0.5, 3, 2, 4, 1, 3.5, 2];
        let pointColors = ["rgb(255, 255, 255)", "rgb(255, 255, 0)", "rgb(127, 127, 255)", "rgb(255, 255, 128)", "rgb(255, 192, 192)", "rgb(213, 171, 196)", "rgb(239, 216, 116)"];
        let pointDistances = [1, 3, 2, 4, 5, 3];
        
        for(let i=0; i<lightCount; i++) {
            let x = i * this.canvas.width / lightCount + 50 * Math.sin((++derp)/20000 + i * 3);
            let pointSize = pointSizes[(i*257) % pointSizes.length];
            let pointDist = pointDistances[(i * 11) % pointDistances.length] + Math.abs(20 * Math.sin(derp/10000 + i*2));
            this.fakeReflection(ctx, x, PixelsBeforeReflection - pointDist, pointSize * 2, pointColors[(i*17) % pointColors.length]);
            ctx.beginPath();
            ctx.fillStyle = pointColors[(i*17) % pointColors.length];
            //ctx.arc(i * this.canvas.width / lightCount, 50 + pointSize/2, pointSize, 0, Math.PI * 2);
            ctx.arc(x, PixelsBeforeReflection - pointDist, pointSizes[(i*257) % pointSizes.length], 0, Math.PI * 2);
            ctx.fill();
            ctx.closePath();
        }
        ctx.fillStyle = "rgba(0, 0, 30, 0.25)";
        ctx.fillRect(0, PixelsBeforeReflection, this.canvas.width, this.canvas.height - PixelsBeforeReflection);
    }
}
function animateProc() {
    SkyControl.animate();
    WaterControl.draw();
    window.requestAnimationFrame(animateProc);
}