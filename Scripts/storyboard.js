

function cloneObject(obj) {
    if(Array.isArray(obj)) {
        let result = [];
        for(i in obj)
            result.push(cloneObject(obj));
        return result;
    } 
    if(typeof obj == "object") {
        let result = {};
        for(i in obj)
            result[i] = cloneObject(obj[i]);
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
            cityFilter: 1,
            clouds: 0,
            waterReflections: 1,
            snow: 0,
            northernLights: 0,
            duration: 1000,
        },
        // 2
        {
            blackOverlay: 0.5,
            skyColors: {
                top: new Color(01, 22, 102),
                bottom: new Color(14, 124, 224)
            },
            stars: 1,
            duration: 1000
        },
        {
            duration: 5000,
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
            cityFilter: 0,
            waterReflections: 1,
            skyColors: {
                top: new Color(01, 22, 102),
                bottom: new Color(14, 124, 224)
            },            
            duration: 1000
        },
        // 4
        {
            clouds: 1,
            duration: 5000
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
            snow: 0,
            northernLights: 1,            
            duration: 5000
        },
        // 7
        {
            //northernLights: 1,
            blackOverlay: 0,
            duration: 10000
        },
        // 8 (transform to summer)
        {
            skyColors: {
                top: new Color(92, 130, 189),
                bottom: new Color(152, 192, 240)
            },
            stars: 0,
            northernLights: 0,         
            duration: 1000
        },
        // 9 (sun)
        {
            duration: 1000
        },
        // 10 (clouds)
        {
            clouds: 1,
            duration: 1000
        },
        // 11 (rain)
        {
            duration: 1000
        },
        // 12 (clouds)
        {
            duration: 1000
        },        
    ],
    initialize: function() {
        this.currentState = cloneObject(this.scenes[0]);
        this.nextState = cloneObject(this.scenes[0]);
        this.sceneIndex = 0;
        this.sceneStart = (new Date()).getTime();
    },
    timerTick: function() {
        if(!this.currentState) return;

        let timestamp = (new Date()).getTime();
        let f = Math.min(1, (timestamp - this.sceneStart) / this.nextState.duration);

        if(this.nextState.hasOwnProperty('skyColors')) {
            SkyLayer.topColor = this.currentState.skyColors.top.blend(this.nextState.skyColors.top, f);
            SkyLayer.bottomColor = this.currentState.skyColors.bottom.blend(this.nextState.skyColors.bottom, f);
        }
        if(this.nextState.hasOwnProperty('clouds')) {
            CloudLayer.cloudAlpha = blend(this.currentState.clouds, this.nextState.clouds, f);
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
        if(this.nextState.hasOwnProperty('waterReflections')) {
            WaterLayer.alpha = SnowLayer.alpha = blend(this.currentState.waterReflections, this.nextState.waterReflections, f);
        }

        if(f >= 1) {
            for(i in this.nextState)
                this.currentState[i] = this.nextState[i];

            if(++this.sceneIndex >= this.scenes.length) {
                this.sceneIndex = 2;
            }
            this.nextState = cloneObject(this.scenes[this.sceneIndex]);
            this.sceneStart = timestamp;
        }
    }
}