const starTypes = ["✵", "✴", "✦", "✸"];
const starsizes = ["5px Arial", "6px Arial"]
const screensize = window.innerWidth;
const pointColors = ["rgb(255, 255, 255)"];

const StarControl = {
    stars: [],
    initialize: function(target, targetCanvas) {
        this.targetContainer = document.getElementById(target);
        this.canvas = document.getElementById(targetCanvas);
        this.canvas.width = this.targetContainer.clientWidth;
        this.canvas.height = this.targetContainer.clientHeight;
        var ctx = this.canvas.getContext("2d");
        ctx.clearRect(0, 0, this.canvas.width, 1000);
        ctx.globalAlpha = 1;
        let starCount = 100;
        for(let i=0; i<starCount; i++) {
            let x = Math.ceil(Math.random() * screensize);
            let y =  Math.ceil(Math.random() * 800) -200;
            ctx.beginPath();
            ctx.fillStyle = pointColors[(i*17) % pointColors.length];
            //ctx.arc(i * this.canvas.width / starCount, 50 + pointSize/2, pointSize, 0, Math.PI * 2);
            ctx.font = starsizes[0];
            ctx.fillText(starTypes[i % starTypes.length], x, y);
            //ctx.arc(x, y, pointSizes[(i*257) % pointSizes.length], 0, Math.PI * 2);
            let star = {
                x,
                y,
            }
            this.stars.push(star)
            ctx.fill();
            ctx.closePath();
        }
    },

    animate: function() {
        let ctx = this.canvas.getContext("2d");
        ctx.clearRect(0, 0, this.canvas.width, 1000);
        for(i in this.stars) {
            ctx.fillStyle = pointColors[(i*17) % pointColors.length];
            ctx.font = starsizes[Math.floor(Math.random() * starsizes.length )];
            let x = this.stars[i].x +2;
            let t = Math.sin((x / screensize) * Math.PI);
            let ydirection = -1;
            if (x > screensize) {
                x = 0;
                this.stars[i].y = Math.ceil(Math.random() * 1000);
            }
            if( x > screensize/2){
                ydirection = 1;
            }
            let curvesize = 0.9 * (1-t);
            this.stars[i].x = x;
            this.stars[i].y = this.stars[i].y + (curvesize * ydirection);
            ctx.fillText(starTypes[i % starTypes.length], this.stars[i].x, this.stars[i].y);
            ctx.fill();
            ctx.closePath();
        }
    }
}