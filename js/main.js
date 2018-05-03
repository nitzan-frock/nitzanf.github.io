// CONSTANTS
// difficulty determines num of tiles on board 
// todo: difficulty will need to be retrieved later.
// easy = 5, 12, medium = 8, 24, hard = 10, 50
const DIFFICULTY = {
    boardLength: 5,
    pathLength: 12
    //pathLength: 20 + Math.floor(Math.random()*5),
};

const CANVAS_DIM = 320;

const DEBUG = false;

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
        this.context.clearRect(0, 0, CANVAS_DIM, CANVAS_DIM);
    },
    update: function() {
        updateGameArea();
        window.requestAnimationFrame(gameArea.update);
    }
}

const startGame = () => {
    gameArea.start();
    board.initBoard();
    window.requestAnimationFrame(gameArea.update);
    startup();
}

// ******************* Helper Functions *******************
const genColor = () => {
    let r = 50 + Math.floor(Math.random()*150);
    let g = 50 + Math.floor(Math.random()*150);
    let b = 50 + Math.floor(Math.random()*150);
    let color = "rgb("+r+","+g+","+b+")";

    return color;
}

const coord_to_pos = (x, y, blockDim) => {
    return {x : parseInt(x/blockDim), y: parseInt(y/blockDim)};
}

// ********* MAIN ***********

let board = new Board();

const updateGameArea = () => {
    gameArea.clearCanv();
    board.blocks.forEach(rowOfBlocks => {
        rowOfBlocks.forEach(block => {
            block.update();
        });
    });
}

const startup = () => {
    let elem = document.getElementById("myCanvas");
    elem.addEventListener('touchstart', handleStart, false);
    elem.addEventListener('touchend', handleEnd, false);
}

const isStart = (x, y) => {
    let block = board.startTile;
    if (x <= (block.coord.x + board.blockDim) && x >= block.coord.x &&
        y <= (block.coord.y + board.blockDim) && y >= block.coord.y) {
            board.timedTile = block;
            return true;
    }
    return false;
}

const getGameState = (touches, elem) => {
    let toReturn = null;
    Object.keys(touches).forEach(touch => {
        let x = touches[touch].pageX - elem.offsetLeft,
            y = touches[touch].pageY - elem.offsetTop;
        if (isStart(x, y)) {
            toReturn = 'start'
        } else if (isMoveOnCanvas(x, y)) {
            toReturn = getMoveType(x, y);
        } else {
            toReturn = 'outOfBounds';
        }
    });
    return toReturn;
}

const handleStart = (event) => {
    event.preventDefault();
    let elem = document.getElementById("myCanvas"),
        touches = event.changedTouches;
    if (getGameState(touches, elem) === 'start') {
        elem.addEventListener('touchmove', handleMove, false);
    }
}

const isMoveOnCanvas = (x ,y) => {
    return x < CANVAS_DIM && x > board.LL && y < CANVAS_DIM && y > board.LL;
}

const stepOnCorner = () => {
    let current = board.timedTile,
        corner = board.timedTile.nextTile,
        next = corner.nextTile,
        cur = coord_to_pos(current.coord.x, current.coord.y, board.blockDim);
    // obstacle in 1st quadrant
    if (corner.directionFromPrevTile === "L" && next.directionFromPrevTile === "U") {
        board.blocks[cur.x][cur.y-1].onStep();
    } else if (corner.directionFromPrevTile === "D" && next.directionFromPrevTile === "R") {
        board.blocks[cur.x+1][cur.y].onStep();

    // obstacle in 2nd quadrant
    } else if (corner.directionFromPrevTile === "D" && next.directionFromPrevTile === "L") {
        board.blocks[cur.x-1][cur.y].onStep();
    } else if (corner.directionFromPrevTile === "R" && next.directionFromPrevTile === "U") {
        board.blocks[cur.x][cur.y-1].onStep();

    // obstacle in 3rd quadrant
    } else if (corner.directionFromPrevTile === "R" && next.directionFromPrevTile === "D") {
        board.blocks[cur.x][cur.y+1].onStep();
    } else if (corner.directionFromPrevTile === "U" && next.directionFromPrevTile === "L") {
        board.blocks[cur.x-1][cur.y].onStep();

    // obstacle in 4th quadrant
    } else if (corner.directionFromPrevTile === "L" && next.directionFromPrevTile === "D") {
        board.blocks[cur.x][cur.y+1].onStep();
    } else if (corner.directionFromPrevTile === "U" && next.directionFromPrevTile === "R") {
        board.blocks[cur.x+1][cur.y].onStep();
    }
    return 'corner';
}

const stepOnTile = (block) => {
    if (block === board.timedTile.nextTile) {
        block.onStep();
        if (!block.nextTile) {
            return 'finished';
        }
        board.timedTile = block;
        return 'next';
    } else if (block === board.timedTile.prevTile) { // cannot move backwards.
        block.color = "#C62828"; //change to red-800
        return 'backwards';
    } else if (block === board.timedTile) {
        return 'current';
    } else {
        return stepOnCorner();
    }
}

const stepOnObstacle = (block) => {
    block.onStep();
    return 'obstacle';
}

const getMoveType = (x, y) => {
    let pos = coord_to_pos(x, y, board.blockDim);
        block = board.blocks[pos.x][pos.y];
    if (block.blockType === 'Tile') {
        return stepOnTile(block);
    } else {
        return stepOnObstacle(block);
    }
}

const handleMove = (event) => {
    event.preventDefault();
    let elem = document.getElementById("myCanvas"),
        touches = event.changedTouches,
        state = getGameState(touches, elem);

    if (state === 'next') {
        board.times.push(performance.now());
    } else if (state === 'finished') {
        board.times.push(performance.now());
        elem.removeEventListener('touchmove', handleMove, false);
    } else if (state === 'backwards' || state === 'corner' || state === 'obstacle') {
        elem.removeEventListener('touchmove', handleMove, false);
    } else if (state === 'outOfBounds') {
        document.getElementById("body").style.backgroundColor = "#C62828";
        elem.removeEventListener('touchmove', handleMove, false);
    }
}

const handleEnd = (event) => {
    event.preventDefault();
    document.getElementById("body").style.backgroundColor = "white";
    board.clear();
    board.initBoard();
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
    this.times = null;
    this.timedTile = null;

    // initialize board
    this.initBoard = function() {
        this.times = [];

        this.blocks = new Array(this.dim*this.dim);
        for (let i=0; i < this.dim; i++) {
            this.blocks[i] = new Array(this.dim);
        }        
        
        // position of starting tile
        const getFirstTile = () => {
            const getRandCoord = () => {
                let coord = Math.floor(Math.random() * (this.dim))*this.blockDim, // any starting position
                //let coord = [this.LL, this.UL][getRandBool()], // corner starting position
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
                let pos = coord_to_pos(directions[dir].x, directions[dir].y, this.blockDim);
                if (this.blocks[pos.x][pos.y]) {
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
                    (dir.direction === "R")) {
                    // move in the x direction
                    dir.x = directions[dir.direction].x;
                    dir.y = directions[dir.direction].y;
                } else { 
                    // move in the y direction
                    dir.y = directions[dir.direction].y;
                    dir.x = directions[dir.direction].x;
                }
            } else { // no direction possible
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
        
        // use depth-first search to reach the path length
        const generatePath = (pathLength, currentTile) => {
            if (pathLength) {
                const dir = getDirectionOfNextTile(currentTile);
                let ctx = gameArea.context;
                
                if (dir !== null) {
                    // generate new tile on path
                    let pos = coord_to_pos(dir.x, dir.y, this.blockDim);
                    this.blocks[pos.x][pos.y] = new Tile(dir.x, dir.y, this.blockDim, currentTile, dir.direction);
                    currentTile.nextTile = this.blocks[pos.x][pos.y];

                    generateObstacles(currentTile);

                    pathLength -= 1;
                    generatePath(pathLength, currentTile.nextTile);
                } else if (currentTile !== this.startTile) {
                    // replace the currentTile with an Obstacle.
                    let pos = coord_to_pos(currentTile.coord.x, currentTile.coord.y, this.blockDim);
                    this.blocks[pos.x][pos.y] = null;

                    ctx.clearRect(currentTile.coord.x, currentTile.coord.y, this.blockDim, this.blockDim);
                    this.blocks[pos.x][pos.y] = new Obstacle(currentTile.coord.x, currentTile.coord.y, this.blockDim);

                    let prevTile = currentTile.prevTile;

                    // Remove all obstacles associated with the previous tile.  
                    if (prevTile.assocObstacles) {
                        prevTile.assocObstacles.map((obstacle, index) => {
                            let pos = coord_to_pos(obstacle.coord.x, obstacle.coord.y, this.blockDim);
                            ctx.clearRect(obstacle.coord.x, obstacle.coord.y, this.blockDim, this.blockDim);
                            prevTile.assocObstacles.splice(index, 1);
                            this.blocks[pos.x][pos.y] = null;
                        });
                    }

                    pathLength += 1;
                    generatePath(pathLength, prevTile);
                } else {
                    // Backtracked to starting tile.
                    this.clear();

                    let x = this.startTile.coord.x,
                        y = this.startTile.coord.y;
                    let pos = coord_to_pos(x, y, this.blockDim);
                    this.blocks[pos.x][pos.y] = this.startTile;

                    generatePath(DIFFICULTY.pathLength, this.startTile);
                }
            }
        }

        // Generate the path on the board.
        generatePath(DIFFICULTY.pathLength, getFirstTile());

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
        this.blocks = new Array(this.dim*this.dim);
        for (let i=0; i < this.dim; i++) {
            this.blocks[i] = new Array(this.dim);
        }
    }
}

// Block Object
function Block(x, y, blockDim) {
    this.width = blockDim;
    this.height = blockDim;
    this.coord = {x: x, y: y};
    this.color = null;

    if (DEBUG) {
        let ctx = gameArea.context;
        ctx.fillStyle = this.color;
        ctx.fillRect(this.coord.x, this.coord.y, this.width, this.height);
    }

    this.update = function() {
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
    
    this.onStep = function() {
        this.color = "#00BCD4"; // Cyan - 500
    }
}

Tile.prototype = Object.create(Block.prototype);
Tile.prototype.constructor = Tile;

// Obstacle Object
function Obstacle(x, y, blockDim) {
    Block.call(this, x, y, blockDim);

    this.blockType = "Obstacle";
    this.color = "#212121"; // Grey - 900

    this.onStep = function() {
        this.color = "#C62828"; // red - 800
    }
    
}

Obstacle.prototype = Object.create(Block.prototype);
Obstacle.prototype.constructor = Obstacle;
