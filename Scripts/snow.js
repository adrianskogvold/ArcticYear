const flakes = [ "❄", "❅", "❆" ];

function Snowflake(){
    const opacity = Math.random();
    const size = Math.ceil((Math.random() * 35) + 10);
    const startpos = Math.ceil(Math.random() * 1900);
    const snowflake = document.createElement("em");

    const zindex = Math.ceil(Math.random() * 1);
    snowflake.innerHTML = flakes[Math.floor(Math.random() * 3)];
    let top = 0;
    snowflake.setAttribute("class", "snowflake");
    snowflake.setAttribute("style", "font-size:" + size + "px;left:" + startpos + "px;opacity:" + opacity + ";z-index:" + zindex );
    document.getElementById("snowflakes").appendChild(snowflake);
}

const duration = 10000; // 10s
const numberOfSnowflakes = 30;
const timeBetweenSnowflakes =  duration / numberOfSnowflakes;

let snow = setInterval(function () {
   Snowflake();
}, timeBetweenSnowflakes);

setTimeout(function() {
    clearInterval(snow);
}, duration);

function clearAllSnow() {
    let snowflakes = document.getElementsByClassName("snowflake");
    [...snowflakes].forEach(flake => flake.remove());
}

function addSnow() {
    snow = setInterval(function () {
        Snowflake();
     }, timeBetweenSnowflakes);

     setTimeout(function() {
        clearInterval(snow);
    }, duration);
}