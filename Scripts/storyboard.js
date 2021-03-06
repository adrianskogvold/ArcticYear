function cloneObject(obj) {
  if (Array.isArray(obj)) {
    let result = [];
    for (i in obj) result.push(cloneObject(obj));
    return result;
  }
  if (typeof obj == "object") {
    let result = {};
    for (i in obj) result[i] = cloneObject(obj[i]);
    return result;
  }
  return obj;
}

function blend(a, b, blendValue) {
  return a + (b - a) * blendValue;
}

var StoryBoard = {
    scenes: [ 
        // 1 initial state (black)
        {
            blackOverlay: 1,
            skyColors: {
                top: new Color(0, 0, 0),
                bottom: new Color(0, 0, 0)
            },
            stars: 0,
            cityFilter: 0.5,
            clouds: 0,
            waterReflections: 1,
            cloudAmount: 1,
            snow: 0,
            northernLights: 0,
            sun: 0,
            duration: 1000,
            label: 'Winter'
          },
        // 2
        {
            blackOverlay: 0.3,
            skyColors: {
                top: new Color(3, 11, 30),
                bottom: new Color(0, 15, 40)
            },
            stars: 1,
            duration: 10000
        },
        {
            cityFilter: 0.5,
            blackOverlay: 0.3,
            cloudAmount:1,
            duration: 5000,
            label: 'Winter',
            stars: 1
        },
        /*
        // performance tests
        {
            blackOverlay: 0.5,
            skyColors: {
                top: new Color(255, 0, 0),
                bottom: new Color(0, 0, 0)
            },
            stars: 1,
            cityFilter: 1,
            clouds: 1,
            waterReflections: 1,
            snow: 1,
            northernLights: 1,
            duration: 1000,
        },
        {
            blackOverlay: 0,
            duration: 10000
        },*/

        // 3
        {
            waterReflections: 1,
            skyColors: {
                top: new Color(3, 11, 30),
                bottom: new Color(0, 15, 40)
            },            
            duration: 1000
        },
        // 4
        {
            clouds: 1,
            duration: 25000
        },
        // 5
        {
            snow: 1,
            duration: 1000
        },
        {
            duration: 5000
        },
        // 6
        {
            clouds: 0,
            stars: 0,
            snow: 0,
            blackOverlay: 0,
            northernLights: 1,            
            duration: 10000
        },
        // 7
        {
            //northernLights: 1,
            duration: 20000
        },
        // 8 (transform to summer)
        {
            cityFilter: 0,
            skyColors: {
                top: new Color(92, 130, 189),
                bottom: new Color(152, 192, 240)
            },
            stars: 0,
            northernLights: 0,         
            duration: 8000,
            label: 'Summer'
        },
        // 9 (sun)
        {
            sun: 1,
            cloudAmount:0.5,
            duration: 1000
        },
        // 10 (clouds)
        {
            clouds: 1,
            duration: 15000
        },
        // 11 (rain)
        {
            sun: 0,
            duration: 1000
        },
        // 12 (clouds)
        {
            clouds: 0,
            duration: 7000
        },        
    ],
    initialize: function() {
        this.currentState = cloneObject(this.scenes[0]);
        this.nextState = cloneObject(this.scenes[0]);
        this.sceneIndex = 0;
        this.sceneStart = performance.now();
        this.ff = false;
    },
    jumpToNextState: function(){
        this.sceneStart = 1;
    },
    jumpToState: function(index){
        var zoomer = setInterval( function(){
            if(StoryBoard.sceneIndex == index){
                clearInterval(zoomer);
            }
                StoryBoard.jumpToNextState();
        }, 200);
    },
  timerTick: function() {
    if (!this.currentState) return;

    let timestamp = performance.now();
    let f = Math.min(
      1,
      (timestamp - this.sceneStart) / this.nextState.duration
    );

        f = 3*f*f - 2*f*f*f;

        if(this.nextState.hasOwnProperty('skyColors')) {
            SkyLayer.topColor = this.currentState.skyColors.top.blend(this.nextState.skyColors.top, f);
            SkyLayer.bottomColor = this.currentState.skyColors.bottom.blend(this.nextState.skyColors.bottom, f);
        }
        if(this.nextState.hasOwnProperty('clouds')) {
            CloudLayer.cloudAlpha = blend(this.currentState.clouds, this.nextState.clouds, f);
        }
        if(this.nextState.hasOwnProperty('cloudAmount')) {
            CloudLayer.cloudAmount = blend(this.currentState.cloudAmount, this.nextState.cloudAmount, f);
        }
        if(this.nextState.hasOwnProperty('blackOverlay')) {
            BlackOverlay.alpha = blend(this.currentState.blackOverlay, this.nextState.blackOverlay, f);
        }
        if(this.nextState.hasOwnProperty('northernLights')) {
            NorthernLights.alpha = blend(this.currentState.northernLights, this.nextState.northernLights, f);
        }
        if(this.nextState.hasOwnProperty('snow')) {
            SnowLayer2.alpha = SnowLayer.alpha = blend(this.currentState.snow, this.nextState.snow, f);
        }
        if(this.nextState.hasOwnProperty('sun')){
            SunLayer.alpha = blend(this.currentState.sun, this.nextState.sun, f);
        }
        if(this.nextState.hasOwnProperty('cityFilter')){
            CityLayer.hueRotate = blend(this.currentState.cityFilter, this.nextState.cityFilter, f);
            MountainLayer.hueRotate =  blend(this.currentState.cityFilter, this.nextState.cityFilter, f);
        }
        if(this.nextState.hasOwnProperty('waterReflections')) {
            WaterLayer.alpha = SnowLayer.alpha = blend(this.currentState.waterReflections, this.nextState.waterReflections, f);
        }
        if(this.nextState.hasOwnProperty('stars')){
            StarLayer.alpha = blend(this.currentState.stars, this.nextState.stars, f);
        }
        if(this.nextState.hasOwnProperty('label')) {
            document.getElementById("season-label").innerText = this.nextState.label;
        }

    if (f >= 1 && !(SunLayer.doom && this.sceneIndex == 10)) {
      for (i in this.nextState) this.currentState[i] = this.nextState[i];

      if (++this.sceneIndex >= this.scenes.length) {
        this.sceneIndex = 2;
      }
      this.nextState = cloneObject(this.scenes[this.sceneIndex]);
      this.sceneStart = timestamp;

      if (this.nextState.hasOwnProperty("label")) {
        document.getElementById(
          "season-label"
        ).innerText = this.nextState.label;
      }
    }
}
}

var currentString = "";
window.onkeypress = function(e) {
    if(e.key == "Enter"){
        let entrybutton = document.getElementById("entry-button").click();
    }
    else {
        currentString = currentString + e.key;
    }
    if(currentString.length > 20){
        currentString = currentString.substring(1);
    }

    if(currentString.includes("summer")){
        StoryBoard.jumpToState(9);
        currentString = "";     
    }
    else if(currentString.includes("winter")){
        currentString = "";
        StoryBoard.jumpToState(2);
    }
    else if(currentString.includes("apocalypse")){
        currentString = "";
        SunLayer.doom = true;
        MountainLayer.quake += 1;
        CityLayer.quake += 1; 
        StoryBoard.jumpToState(9);
    }
    else if(currentString.includes("skip")){
        currentString = "";
        StoryBoard.jumpToNextState();
    }
    else if(currentString.includes("loopall")){
        currentString = "";
        StoryBoard.jumpToState(0);
    }
    else if(currentString.includes("reload")){
        currentString = "";
        window.location.reload();
    }

};