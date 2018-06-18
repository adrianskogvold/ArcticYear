function Snowflake(){
    const opacity = Math.random();
    const size = Math.ceil((Math.random() * 35) + 10);
    const startpos = Math.ceil(Math.random() * 2000);
    const snowflake = document.createElement("em");

    const zindex = Math.ceil(Math.random() * 1);
    snowflake.innerHTML = "*";
    let top = 0;
    snowflake.setAttribute("class", "snowflake");
    snowflake.setAttribute("style", "font-size:" + size + "px;left:" + startpos + "px;opacity:" + opacity + ";top:0px;z-index:" + zindex );
    document.getElementById("snow").appendChild(snowflake);

    const interval = setInterval(function() {
        top += 6;
        snowflake.style.top = top + "px";
    }, 10)
    setTimeout(function() {
        snowflake.parentNode.removeChild(snowflake);
        clearInterval(interval)
    }, 10000)
}

const snow = setInterval(function () {
   Snowflake();
}, 400);
