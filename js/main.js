// CONSTANTS
// difficulty determines num of tiles on board 
// todo: difficulty will need to be retrieved later.
// easy = 5, medium = 7, hard = 10
const DIFFICULTY = {
    boardLength: 5,
    pathLength: 8 + Math.floor(Math.random()*4),
};

const CANVAS_DIM = 500;

// Initialize board and block dimension variables
const boardL = DIFFICULTY.boardLength;
const blockDim = CANVAS_DIM / boardL; // length (px) of each block
const lim = boardL * blockDim - blockDim; // edge of board (limit)

function startGame() {
    console.log("Starting game!");
    //console.log("clear board");
    //clearBoard();
    //const promise = clearBoard().then(result => {console.log(result)}, () => {console.log("failed to print board");});;
    //console.log(board);
    gameArea.start();
    let board = initBoard(DIFFICULTY);
    //gameArea.update(board);
    //gameArea.update();
}

const gameArea = {
    canvas: document.createElement("canvas"),
    start: function() {
        this.canvas.height = CANVAS_DIM;
        this.canvas.width = CANVAS_DIM;
        this.canvas.style.border = "1px solid black";
        this.context = this.canvas.getContext("2d");
        document.body.insertBefore(this.canvas, document.body.childNodes[0]);
        //this.interval = setInterval(updateGameArea, 15); // update 67 fps
    },
    clear: function() {
        this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
    },
    update: function() {
        this.interval = setInterval(updateGameArea, 15); // update 67 fps
    }
}

// initialize board
const initBoard = () => {
    let board = new Array(boardL);
    for (let i=0; i < boardL; i++) {
        board[i] = new Array(boardL);
    }

    // position of starting tile
    const getFirstTile = () => {
        const getRandCoord = () => {
            //let coord = Math.floor(Math.random() * (boardL))*blockDim;
            let coord = [0, lim]
            coord = coord[getRandBool()];
            let pos = coord / blockDim;

            return {coord, pos};
        }

        const x0 = getRandCoord();
        const y0 = getRandCoord();
        console.log("start position {"+x0.pos+", "+y0.pos+"}");
        board[x0.pos][y0.pos] = new Tile(x0.coord, y0.coord, "#8FD14F", false, null, null);

        return board[x0.pos][y0.pos];
    }
    
    const getCardinalDirections = (tile) => {
        // direction: { x: variable coord (actual step change), y: const coord relative to tile}
        return {
            right: {
                x: tile.coord.x + blockDim,
                y: tile.coord.y
            },
            left:{
                x: tile.coord.x - blockDim,
                y: tile.coord.y
            },
            up: {
                x: tile.coord.x,
                y: tile.coord.y - blockDim
            },
            down: {
                x: tile.coord.x,
                y: tile.coord.y + blockDim
            }
        }
    }

    const checkAdjacentBlocks = (directions) => {
        Object.keys(directions).map(dir => {
            let x = (directions[dir].x)/blockDim;
            let y = (directions[dir].y)/blockDim;
            if (board[x][y]) {
                console.log("adjecent block "+dir+". Removed "+dir+" direction.");
                delete directions[dir];

            }
        });

        console.log("directions left to choose");
        console.log(directions);

        return directions;
    }

    const limitTileDirections = (tile) => {

        console.log("current tile is at ("+tile.coord.x/blockDim+", "+tile.coord.y/blockDim+")");
        console.log("x coord: "+tile.coord.x+" y coord: "+tile.coord.y);

        let directions = getCardinalDirections(tile);

        // check board limits
        if (tile.coord.x === 0) {
            if (tile.coord.y === blockDim && tile.directionFromPrevTile === "left") { // corner case for (0,1)
                delete directions.right;
                delete directions.up;
            } else if (tile.coord.y === (lim-blockDim) && tile.directionFromPrevTile === "left") { // corner caase for (0,3)
                delete directions.right;
                delete directions.down;
            }
            delete directions.left; // next tile can be right.        
        } else if (tile.coord.x === lim) {
            if (tile.coord.y === blockDim && tile.directionFromPrevTile === "right") { // corner case for (4,1)
                delete directions.left;
                delete directions.up;
            } else if (tile.coord.y === (lim-blockDim) && tile.directionFromPrevTile === "right") { // corner case for (4,3)
                delete directions.left;
                delete directions.down;
            }
            delete directions.right; // next tile can be left.           
        }

        if (tile.coord.y === 0) {
            if (tile.coord.x === blockDim && tile.directionFromPrevTile === "up") { // corner case for (1, 0)
                console.log("   [corner case] (1,0)");
                delete directions.left;
                delete directions.down;
            } else if (tile.coord.x === (lim-blockDim) && tile.directionFromPrevTile === "up") { // corner case for (3, 0)
                console.log("   [corner case] (3,0)");
                delete directions.right;
                delete directions.down;
            }
            delete directions.up;; // next tile can be down.
        } else if (tile.coord.y === lim) {
            if (tile.coord.x === blockDim && tile.directionFromPrevTile === "down") { // corner case for (1, 4)
                console.log("   [corner case] (1,4)");
                delete directions.up;
                delete directions.left;
            } else if (tile.coord.x === (lim-blockDim) && tile.directionFromPrevTile === "down") { // corner case for (3,4)
                console.log("   [corner case] (3,4)");
                delete directions.up;
                delete directions.right;
            }
            delete directions.down; // next tile can be up.
        }
        console.log("directions after board limits: ");
        console.log(directions);

        // check additional corner cases
        if (tile.coord.x === blockDim && 
        tile.coord.y === blockDim && 
        tile.directionFromPrevTile === "up") {
            delete directions.left;
            delete directions.down;
            console.log("[corner case] tile can go up or right");
        } else if (tile.coord.x === blockDim && 
            tile.coord.y === (lim-blockDim) && 
            tile.directionFromPrevTile === "down") {
                delete directions.left;
                delete directions.up;
                console.log("[corner case] tile can go down or right");
        } else if (tile.coord.x === (lim-blockDim) &&
            tile.coord.y === blockDim && 
            tile.directionFromPrevTile === "up") {
                delete directions.right;
                delete directions.down;
                console.log("[corner case] tile can go up or left");
        } else if (tile.coord.x === (lim-blockDim) && 
            tile.coord.y === (lim-blockDim) && 
            tile.directionFromPrevTile === "down") {
                delete directions.right;
                delete directions.up;
                console.log("[corner case] tile can go down or left");
        }    
        console.log("directions before checking adjacent blocks");
        console.log(directions);
        // Check for adjacent blocks
        directions = checkAdjacentBlocks(directions);

        console.log("possible next tiles: ");
        Object.entries(directions).map(direction => {
            console.log("   "+direction[0]);
        });

        return directions;
    }

    const getDirectionOfNextTile = (tile) => {
        let directions = limitTileDirections(tile);
        let dir = {x: 0, y: 0, direction: null};
        let direction = null;

        // choose random direction for next tile
        if (Object.keys(directions).length > 1) {
            const count = Object.keys(directions).length;
            const index = Math.floor(Math.random() * count);
            const pool = Object.keys(directions);
            direction = pool[index]; // "up", "down", "left", "right"
        } else {
            direction = Object.keys(directions)[0];
        }
        console.log("[getDirectionOfNextTile] direction:");
        console.log(direction);
        if (direction){
            console.log("direction chosen to move: "+direction);
            if ((direction === "left") || (direction === "right")) { // move in the x direction
                dir.x = directions[direction].x;
                dir.y = directions[direction].y;
                dir.direction = direction;
            } else { // move in the y direction
                dir.y = directions[direction].y;
                dir.x = directions[direction].x;
                dir.direction = direction;
            }
            console.log("next tile is " + dir.direction);
        } else {
            dir = null;
        }

        return dir;
    }

    const limitObstacleDirections = (tile) => {
        let directions = getCardinalDirections(tile);

        // check for board limits
        if (tile.coord.x === 0) {
            delete directions.left; // obstacle can be right.
        } else if (tile.coord.x === lim) {
            delete directions.right; // obstacle can be left.
        }

        if (tile.coord.y === 0) {
            delete directions.up;; // obstacle can be down.
        } else if (tile.coord.y === lim) {
            delete directions.down; // obstacle can be up.
        }

        // Check for adjacent blocks
        directions = checkAdjacentBlocks(directions);

        return directions;
    }

    const generateObstacles = (currentTile) => {
        const directions = limitObstacleDirections(currentTile);
        let next = currentTile.nextTile;

        Object.keys(directions).map(direction => {
            let x = directions[direction].x;
            let y = directions[direction].y;

            console.log(" obstacle at {"+x/blockDim+", "+y/blockDim+"}");
            let obstacle = new Obstacle(x, y, "#1A1A1A", false);
            board[x/blockDim][y/blockDim] = obstacle;
            currentTile.assocObstacles.push(obstacle);
        });
        console.log("obstacles generated");
    }

    let currentTile = getFirstTile();
    console.log("path length: " +DIFFICULTY.pathLength);
    
    // use depth-first search to reach the path length
    const findPath = (pathLength, currentTile) => {
        if (pathLength) {
            const dir = getDirectionOfNextTile(currentTile);
            
            console.log("[findPath] direction exists: "+dir);
            if (dir !== null) {
                console.log("[findPath] dir: "+dir.direction);
                let xpos = dir.x/blockDim;
                let ypos = dir.y/blockDim;
                board[xpos][ypos] = new Tile(dir.x, dir.y, "#808080", false, currentTile, dir.direction);
                currentTile.nextTile = board[xpos][ypos];
    
                console.log("generate obstacles from tile "+(DIFFICULTY.pathLength - pathLength));
                generateObstacles(currentTile);
                
                pathLength -= 1;
                findPath(pathLength, currentTile.nextTile);
            } else {
                console.log("[findPath] BACKTRACKING...");
                // replace the currentTile with an Obstacle.
                console.log("current tile to be removed: ("+currentTile.coord.x+", "+currentTile.coord.y+")");
                board[currentTile.coord.x/blockDim][currentTile.coord.y/blockDim] = null;
                board[currentTile.coord.x/blockDim][currentTile.coord.y/blockDim] = new Obstacle(currentTile.coord.x, currentTile.coord.y, "#1A1A1A", false);
                
                let prevTile = currentTile.prevTile;
                console.log("prev tile: ("+prevTile.coord.x+", "+prevTile.coord.y+")");
                // Remove all obstacles associated with the previous tile.
                let directions = getCardinalDirections(currentTile);

                console.log(prevTile.assocObstacles);
                prevTile.assocObstacles.map(obstacle => {
                    if (!(obstacle.coord.x === currentTile.coord.x && obstacle.coord.y === currentTile.coord.y)) {
                        let ctx = gameArea.context;
                        ctx.clearRect(obstacle.coord.x, obstacle.coord.y, blockDim, blockDim);
                        board[obstacle.coord.x/blockDim][obstacle.coord.y/blockDim] = null;
                    }
                });                
                
                pathLength += 1;
                findPath(pathLength, prevTile);
            }
        }
    }

    findPath(DIFFICULTY.pathLength, currentTile);

    for (let i=0, l=boardL; i < l; i++) {
        for (let j=0; j < l; j++) {
            if (!board[i][j]) {
                let x = i * blockDim;
                let y = j * blockDim;
                board[i][j] = new Obstacle(x, y, "#1A1A1A", false);
            }
        }
    }
    console.log(board);
    return board;
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

// ***************** OBJECTS AND CLASSES ******************
// Object inheritance and prototpyes: 
// https://developer.mozilla.org/en-US/docs/Learn/JavaScript/Objects/Inheritance

// Block Object
function Block(x, y, color, isStepped) {
    this.width = blockDim;
    this.height = blockDim;
    this.coord = {x, y};
    this.color = color;
    this.isStepped = isStepped;

    ctx = gameArea.context;
    ctx.fillStyle = color;
    ctx.fillRect(this.coord.x, this.coord.y, this.width, this.height);

    this.update = function() {
        ctx = gameArea.context;
        ctx.fillStyle = color;
        ctx.fillRect(this.coord.x, this.coord.y, this.width, this.height);
    }
}

// Tile Object
function Tile(x, y, color, isStepped, prevTile, direction) {
    Block.call(this, x, y, color, isStepped);

    this.prevTile = prevTile;
    this.directionFromPrevTile = direction;
    this.nextTile = null;
    this.assocObstacles =[];
}

Tile.prototype.onStep = () => {
    if (this.Tile.isStepped) {
        this.Tile.color = "#8FD14F"; // green
    }
}

Tile.prototype = Object.create(Block.prototype);
Tile.prototype.constructor = Tile;

// Obstacle Object
function Obstacle(x, y, color, isStepped) {
    Block.call(this, x, y, color, isStepped);
}

Obstacle.prototype.onStep = () => {
    if (this.Obstacle.isStepped) {
        this.Obstacle.color = "#F24726"; // red
    }
}

Obstacle.prototype = Object.create(Block.prototype);
Obstacle.prototype.constructor = Obstacle 