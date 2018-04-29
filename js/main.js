// CONSTANTS
// difficulty determines num of tiles on board 
// todo: difficulty will need to be retrieved later.
// easy = 5, medium = 7, hard = 10
const DIFFICULTY = {
    boardLength: 5,
    pathLength: 10
    //pathLength: 20 + Math.floor(Math.random()*5),
};

const CANVAS_DIM = 320;

const gameArea = {
    canvas: document.createElement("canvas"),
    start: function() {
        this.canvas.setAttribute("id", "myCanvas");
        this.canvas.height = CANVAS_DIM;
        this.canvas.width = CANVAS_DIM;
        this.canvas.style.border = "1px solid black";
        this.context = this.canvas.getContext("2d");
        this.canvasLeft = this.canvas.offsetLeft;
        this.canvasTop = this.canvas.offsetTop;
        document.body.insertBefore(this.canvas, document.body.childNodes[0]);
    },
    clearCanv: function() {
        this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
    },
    update: function() {
        updateGameArea();
        window.requestAnimationFrame(gameArea.update);
    }
}


// ******************* Helper Functions *******************
const getRandBool = () => {
    b = Math.floor(Math.random()*2);

    return b;
}

const genColor = () => {
    let r = 50 + Math.floor(Math.random()*150);
    let g = 50 + Math.floor(Math.random()*150);
    let b = 50 + Math.floor(Math.random()*150);
    let color = "rgb("+r+","+g+","+b+")";

    return color;
}

const coord_to_pos = (x, y, dim) => {
    return {x : parseInt(x/dim), y: parseInt(y/dim)};
}

// ****** MAIN ***********

let board = new Board();

const updateGameArea = () => {
    gameArea.clearCanv();
    for (let i=0, l=board.dim; i < l; i++) {
        for (let j=0; j < l; j++) {
            board.blocks[i][j].update();
        }
    }
}

const startup = () => {
    let elem = document.getElementById("myCanvas");
    elem.addEventListener('touchstart', handleStart, false);
    elem.addEventListener('touchend', handleEnd, false);
}

const handleStart = (event) => {
    event.preventDefault();
    let elem = document.getElementById("myCanvas"),
        context = elem.getContext("2d"),
        touches = event.changedTouches;
        
    for (let i=0; i < touches.length; i++) {
        let x = touches[i].pageX - elem.offsetLeft,
            y = touches[i].pageY - elem.offsetTop;
        console.log("[handleStart] touches:");
        console.log("[handleStart] touches at ("+x+", "+y+")");

        for (let j=0; j < board.dim; j++) {
            for (let k=0; k < board.dim; k++) {
                let block = board.blocks[j][k];
                
                if (x <= (block.coord.x + board.blockDim) && x >= block.coord.x &&
                    y <= (block.coord.y + board.blockDim) && y >= block.coord.y) {
                        console.log("block coords: ("+block.coord.x+", "+block.coord.y+")");
                        if (block.blockType === 'Tile' && block.prevTile === null) {
                            console.log("touching the starting tile.");
                            board.times = [];
                            board.timedTile = block;
                            board.times[0] = performance.now();
                            elem.addEventListener('touchmove', handleMove, false);
                        }
                        else {
                            console.log("Not the starting tile.");
                            elem.removeEventListener('touchmove', handleMove, false);
                        }
                }
            }
        }
    }
}

const handleMove = (event) => {
    event.preventDefault();
    let elem = document.getElementById("myCanvas"),
        context = elem.getContext("2d"),
        touches = event.changedTouches;

    for (let i=0; i < touches.length; i++) {
        let x = touches[i].pageX - elem.offsetLeft,
            y = touches[i].pageY - elem.offsetTop;
        //console.log("[handleMove] touches at ("+x+", "+y+")");

        if (x < CANVAS_DIM && x > board.LL &&
            y < CANVAS_DIM && y > board.LL) {
                let pos = coord_to_pos(x, y, board.blockDim);
                let block = board.blocks[pos.x][pos.y];

                if (block.blockType === 'Tile') {
                    if (block !== board.startTile) {
                        if (block === board.timedTile.nextTile) {
                            board.times.push(performance.now());
                            console.log("next block in path");
                            console.log(pos.x,", ", pos.y);
                            block.onStep();
                            board.timedTile = board.timedTile.nextTile;
                            if (!block.nextTile) {
                                elem.removeEventListener('touchmove', handleMove, false);
                                console.log("Finished!");
                                console.log(board.times);
                            }
                        } else if (block !== board.timedTile) {
                            // moved through a corner skipping the next tile.
                            console.log("moved through corner");
                            let current = board.timedTile,
                                corner = board.timedTile.nextTile,
                                next = corner.nextTile;

                            let cur = coord_to_pos(current.coord.x, current.coord.y, board.blockDim);
                            // obstacle in 1st quadrant
                            if (corner.directionFromPrevTile === "L" && next.directionFromPrevTile === "U") {
                                board.blocks[cur.x][cur.y-1].onStep();
                                elem.removeEventListener('touchmove', handleMove, false);
                            } else if (corner.directionFromPrevTile === "D" && next.directionFromPrevTile === "R") {
                                board.blocks[cur.x+1][cur.y].onStep();
                                elem.removeEventListener('touchmove', handleMove, false);

                            // obstacle in 2nd quadrant
                            } else if (corner.directionFromPrevTile === "D" && next.directionFromPrevTile === "L") {
                                board.blocks[cur.x-1][cur.y].onStep();
                                elem.removeEventListener('touchmove', handleMove, false);
                            } else if (corner.directionFromPrevTile === "R" && next.directionFromPrevTile === "U") {
                                board.blocks[cur.x][cur.y-1].onStep();
                                elem.removeEventListener('touchmove', handleMove, false);

                            // obstacle in 3rd quadrant
                            } else if (corner.directionFromPrevTile === "R" && next.directionFromPrevTile === "D") {
                                board.blocks[cur.x][cur.y+1].onStep();
                                elem.removeEventListener('touchmove', handleMove, false);
                            } else if (corner.directionFromPrevTile === "U" && next.directionFromPrevTile === "L") {
                                board.blocks[cur.x-1][cur.y].onStep();
                                elem.removeEventListener('touchmove', handleMove, false);

                            // obstacle in 4th quadrant
                            } else if (corner.directionFromPrevTile === "L" && next.directionFromPrevTile === "D") {
                                board.blocks[cur.x][cur.y+1].onStep();
                                elem.removeEventListener('touchmove', handleMove, false);
                            } else if (corner.directionFromPrevTile === "U" && next.directionFromPrevTile === "R") {
                                board.blocks[cur.x+1][cur.y].onStep();
                                elem.removeEventListener('touchmove', handleMove, false);
                            }
                        }
                    }
                } else {
                    console.log("obstacle/wall");
                    block.onStep();
                    elem.removeEventListener('touchmove', handleMove, false);
                }
        } else {
            console.log("[Error] Out of bounds.");
            elem.removeEventListener('touchmove', handleMove, false);
        }
        //console.log(touches[i]);
    }
}

const handleEnd = (event) => {
    event.preventDefault();
    let elem = document.getElementById("myCanvas"),
        context = elem.getContext("2d"),
        touches = event.changedTouches;
    
        console.log("game over");
    board.clear();
    board.initBoard();


    // for (let i=0; i < touches.length; i++) {
    //     //ongoingTouches.push(copyTouch(touches[i]));
    //     console.log("[handleEnd] Game over.");
    //     alert("Game over, reset?");
    //     board.clear();
    //     board.initBoard();
    //     //console.log(touches[i]);
    // }
}

// const copyTouch = (touch) => {
//     return {identifier: touch.identifier, pageX: touch.pageX, pageY: touch.pageY};
// }

const startGame = () => {
    console.log("Starting game!");
    gameArea.start();
    console.log("initializing board");
    board.initBoard();
    console.log("board initialized");
    console.log(board);
    window.requestAnimationFrame(gameArea.update);
    console.log("starting up listeners");
    startup();
    console.log("created listeners");
}





// ***************** OBJECTS AND CLASSES ******************
// Object inheritance and prototpyes: 
// https://developer.mozilla.org/en-US/docs/Learn/JavaScript/Objects/Inheritance

// Board Object
function Board() {
    this.dim = DIFFICULTY.boardLength;
    this.blockDim = CANVAS_DIM / this.dim;
    this.UL = CANVAS_DIM - this.blockDim;
    this.LL = 0;
    this.blocks = null;
    this.startTile = null;
    this.times = [];
    this.timedTile = null;

    // initialize board
    this.initBoard = function() {
        this.blocks = new Array(this.dim*this.dim);
        for (let i=0; i < this.dim; i++) {
            this.blocks[i] = new Array(this.dim);
        }        
        
        // position of starting tile
        const getFirstTile = () => {
            const getRandCoord = () => {
                //let coord = Math.floor(Math.random() * (boardL))*blockDim;
                let coord = [this.LL, this.UL][getRandBool()],
                    pos = coord / this.blockDim;

                return {coord, pos};
            }

            const x = getRandCoord();
            const y = getRandCoord();
            
            this.blocks[x.pos][y.pos] = new Tile(x.coord, y.coord, this.blockDim, null);
            this.startTile = this.blocks[x.pos][y.pos];
            this.startTile.color = "#8BC34A"; // light green - 500
            return this.startTile;
        }
        
        const getCardinalDirections = (tile) => {
            // direction: { x: variable coord (actual step change), y: const coord relative to tile}
            return {
                R: {
                    x: tile.coord.x + this.blockDim,
                    y: tile.coord.y
                },
                L:{
                    x: tile.coord.x - this.blockDim,
                    y: tile.coord.y
                },
                U: {
                    x: tile.coord.x,
                    y: tile.coord.y - this.blockDim
                },
                D: {
                    x: tile.coord.x,
                    y: tile.coord.y + this.blockDim
                }
            }
        }

        const checkAdjacentBlocks = (directions) => {
            Object.keys(directions).map(dir => {
                let x = (directions[dir].x)/this.blockDim,
                    y = (directions[dir].y)/this.blockDim;
                if (this.blocks[x][y]) {
                    //console.log("block at ("+x+", "+y+")");
                    delete directions[dir];
                }
            });

            return directions;
        }

        const limitDirections = (tile) => {
            let directions = getCardinalDirections(tile);

            // check board limits
            if (tile.coord.x === this.LL) {
                delete directions.L; // next tile can be right.        
            } else if (tile.coord.x === this.UL) {
                delete directions.R; // next tile can be left.           
            }

            if (tile.coord.y === this.LL) {
                delete directions.U; // next tile can be down.
            } else if (tile.coord.y === this.UL) {
                delete directions.D; // next tile can be up.
            }

            return checkAdjacentBlocks(directions);
        }

        const getDirectionOfNextTile = (tile) => {
            let directions = limitDirections(tile),
                dir = {x: 0, y: 0, direction: null};

            if (Object.keys(directions).length > 0) { // there is a direction possible to choose
                let count = Object.keys(directions).length,
                    index = Math.floor(Math.random() * count);
                dir.direction = Object.keys(directions)[index];

                if ((dir.direction === "L") || 
                    (dir.direction === "R")) { // move in the x direction
                    dir.x = directions[dir.direction].x;
                    dir.y = directions[dir.direction].y;
                } else { // move in the y direction
                    dir.y = directions[dir.direction].y;
                    dir.x = directions[dir.direction].x;
                }
            } else { // only one direction possible
                dir = null;
            }
            
            return dir;
        }

        const generateObstacles = (currentTile) => {
            const directions = limitDirections(currentTile);
            let next = currentTile.nextTile;

            Object.keys(directions).map(direction => {
                let x = directions[direction].x,
                    y = directions[direction].y;
                let obstacle = new Obstacle(x, y, this.blockDim);
                this.blocks[x/this.blockDim][y/this.blockDim] = obstacle;
                currentTile.assocObstacles.push(obstacle);
            });
        }

        let currentTile = getFirstTile();
        
        // use depth-first search to reach the path length
        const findPath = (pathLength, currentTile) => {
            if (pathLength) {
                const dir = getDirectionOfNextTile(currentTile);

                //console.log("current tile ("+currentTile.coord.x+", "+currentTile.coord.y+")");
                
                if (dir !== null) {
                    let pos = coord_to_pos(dir.x, dir.y, this.blockDim);
                    this.blocks[pos.x][pos.y] = new Tile(dir.x, dir.y, this.blockDim, currentTile, dir.direction);
                    currentTile.nextTile = this.blocks[pos.x][pos.y];
                    generateObstacles(currentTile);
                    pathLength -= 1;
                    findPath(pathLength, currentTile.nextTile);
                } else {
                    // replace the currentTile with an Obstacle.
                    //console.log("Backtracking...");
                    let pos = coord_to_pos(currentTile.coord.x, currentTile.coord.y, this.blockDim);
                    this.blocks[pos.x][pos.y] = null;
                    //console.log(currentTile);
                    let ctx = gameArea.context;
                    ctx.clearRect(currentTile.coord.x, currentTile.coord.y, this.blockDim, this.blockDim);
                    this.blocks[pos.x][pos.y] = new Obstacle(currentTile.coord.x, currentTile.coord.y, this.blockDim);
                    //this.blocks[pos.x][pos.y].color = "#987978a";
                    
                    let prevTile = currentTile.prevTile;

                    // Remove all obstacles associated with the previous tile.
                    // let directions = getCardinalDirections(currentTile);
                    
                    if (prevTile.assocObstacles) {
                        console.log("removing associated obstacles");
                        prevTile.assocObstacles.map((obstacle, index) => {

                            if (!(obstacle.coord.x === currentTile.coord.x && obstacle.coord.y === currentTile.coord.y)) {
                                let pos = coord_to_pos(obstacle.coord.x, obstacle.coord.y, this.blockDim);
                                ctx.clearRect(obstacle.coord.x, obstacle.coord.y, this.blockDim, this.blockDim);
                                prevTile.assocObstacles.splice(index, 1);
                                this.blocks[pos.x][pos.y] = null;
                            }
                        });
                    }

                    pathLength += 1;
                    findPath(pathLength, prevTile);
                }
            }
        }

        findPath(DIFFICULTY.pathLength, currentTile);

        // fill in the rest of the board
        let x = 0,
            y = 0;
        for (let i=0, l=this.dim; i < l; i++) {
            for (let j=0; j < l; j++) {
                if (!this.blocks[i][j]) {
                    let x = i*this.blockDim,
                        y = j*this.blockDim;
                    this.blocks[i][j] = new Obstacle(x, y, this.blockDim);
                }
            }
        }
        return this.blocks;
    }

    this.clear = function() {
        this.blocks = null;
    }
}

// Block Object
function Block(x, y, blockDim) {
    this.width = blockDim;
    this.height = blockDim;
    this.coord = {x: x, y: y};
    this.color = null;



    this.update = function() {
        // console.log("updating block");
        // console.log("block color:");
        let ctx = gameArea.context;
        ctx.fillStyle = this.color;
        ctx.fillRect(this.coord.x, this.coord.y, this.width, this.height);
    }
}

// Tile Object
function Tile(x, y, blockDim, prevTile, direction) {
    Block.call(this, x, y, blockDim);

    this.color = "#00838F" // Cyan - 800
    this.prevTile = prevTile;
    this.directionFromPrevTile = direction;
    this.nextTile = null;
    this.assocObstacles =[];
    this.blockType = "Tile";

    let ctx = gameArea.context;
    ctx.fillStyle = this.color;
    ctx.fillRect(this.coord.x, this.coord.y, this.width, this.height);

    this.onStep = function() {
        this.color = "#00BCD4"; // Cyan - 500
    }
}

// Tile.prototype.onStep = () => {
//     this.Tile.color = "#00BCD4"; // Cyan - 500
// }

Tile.prototype = Object.create(Block.prototype);
Tile.prototype.constructor = Tile;

// Obstacle Object
function Obstacle(x, y, blockDim) {
    Block.call(this, x, y, blockDim);

    this.blockType = "Obstacle";
    this.color = "#212121"; // Grey - 900

    let ctx = gameArea.context;
    ctx.fillStyle = this.color;
    ctx.fillRect(this.coord.x, this.coord.y, this.width, this.height);

    this.onStep = function() {
        this.color = "#C62828"; // red - 800
    }
    
}

// Obstacle.prototype.onStep = () => {
//     this.Obstacle.color = "#C62828"; // red - 800
// }

Obstacle.prototype = Object.create(Block.prototype);
Obstacle.prototype.constructor = Obstacle;