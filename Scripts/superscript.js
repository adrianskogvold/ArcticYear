//window.alert("you have been hacked");


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

    draw: function() {
        var ctx = this.canvas.getContext("2d");
        ctx.drawImage(this.canvas,  0.1*Math.sin(++derp/3), 1.5);
        ctx.fillStyle = "rgba(0, 0, 0, 0.04)";
        ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        let lightCount =100;
        ctx.clearRect(0, 0, this.canvas.width, 50);
        let pointSizes = [0.5, 3, 2, 4, 1, 3.5, 2];
        let pointColors = ["rgb(255, 255, 255)", "rgb(255, 255, 0)", "rgb(127, 127, 255)", "rgb(255, 255, 128)", "rgb(255, 192, 192)"];
        let pointDistances = [1, 3, 2, 4, 5, 3];
        
        for(let i=0; i<lightCount; i++) {
            ctx.beginPath();
            ctx.fillStyle = pointColors[(i*17) % pointColors.length];
            let pointSize = pointSizes[(i*257) % pointSizes.length];
            let pointDist = pointDistances[(i * 11) % pointDistances.length];// + Math.abs(20 * Math.sin(derp/100 + i*2));
            ctx.arc(i * this.canvas.width / lightCount, 50 + pointSize/2, pointSize, 0, Math.PI * 2);
            ctx.arc(i * this.canvas.width / lightCount, 50 - pointDist, pointSizes[(i*257) % pointSizes.length], 0, Math.PI * 2);
            ctx.fill();
            ctx.closePath();
        }
    }
}
function animateProc() {
    SkyControl.animate();
    WaterControl.draw();
    window.requestAnimationFrame(animateProc);
}