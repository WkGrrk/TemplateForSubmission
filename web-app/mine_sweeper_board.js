const direction_vectors = [
    [-1, -1],
    [-1, 0],
    [-1, 1],
    [0, -1],
    [0, 1],
    [1, -1],
    [1, 0],
    [1, 1],
];
const COVER_NOT_OPEN = "C";
const FLAG = "F"
const MINE = 9;

// empty_board
//     level(1,2,3)
//     level 1, 8 X 8, - 10
//     level 2, 16 * 16 - 40
//     level 3, 32 * 16 - 99

/** Class representing a MineSweeperBoard. */
class MineSweeperBoard {
    /**
     * Create a MineSweeperBoard
     * @param {number} level The x coordinate of first click
     */
    constructor(level) {
        this._covers = []; // c not open, 2 Flag, 3 Question Mark
        this._board = []; // 9 Mine; 0 Space; > 0 total mines around itself
        this._level = level;
        this._width = 0;
        this._height = 0;
        this._totalMines = 0;
        this._is_ended = false;
        this.init();
    }

    // 根据Level来初始化，Width, Height, totalMines;  Cover & MineSweeperBoard, 并将其全部设置为0
    init() {
        this._is_ended = false;
        if (this._level == 1) {
            this._width = 8;
            this._height = 8;
            this._totalMines = 10;
        } else if (this._level == 2) {
            this._width = 16;
            this._height = 16;
            this._totalMines = 40;
        } else if (this._level == 3) {
            this._width = 32;
            this._height = 16;
            this._totalMines = 99;
        }
    
        for (let i = 0; i < this._height; i++) {
            let cur_board = [];
            let cur_covers = [];
            for (let j= 0; j < this._width; j++) {
                cur_board.push(0);
                cur_covers.push(COVER_NOT_OPEN);
            }
            this._board.push(cur_board);
            this._covers.push(cur_covers);
        }
    }
    /**
     * Create 8 * 8 Board
     * @memberof MineSweeperBoard
     * @function
     * @param {number} x The x coordinate of first click
     * @param {number} y The y coordinate of first click
     * @return {void}
     */
    random_generate (x, y) {
        let cur_mine = 0;
        let board_size = this._width * this._height;
        while (cur_mine < this._totalMines) {
            let ram_number = Math.floor(Math.random() * board_size);
            let cur_x = Math.floor(ram_number / this._height);
            let cur_y = ram_number % this._width;

            if (this._board[cur_x][cur_y] == MINE) {
                continue;
            }

            // First Click, Must be not a mine. Ignore current Random. 
            if (x == cur_x && y == cur_y) {
                continue;
            }

            this._board[cur_x][cur_y] = MINE
            cur_mine++;
        }

        // Update MineSweeperBoard, Total Number of Mines
        this.generateNumber();
        this.open_square(x, y);
    }

    // 定死一个 8x8 的棋盘， 并以固定点开始，例如（0，0）。然后更新 Cover & Board的数据。
    random_fake_generate(x, y) {
        this._board[0][2] = MINE;
        this._board[0][4] = MINE;
        this._board[0][5] = MINE;
        this._board[1][5] = MINE;
        this._board[2][0] = MINE;
        this._board[2][1] = MINE;
        this._board[2][3] = MINE;
        this._board[3][7] = MINE;
        this._board[4][2] = MINE;
        this._board[6][4] = MINE;

        this.generateNumber();
        this.open_square(x, y);
    }

    generateNumber() {
        for (let i = 0; i < this._height; i++) {
            for (let j = 0; j < this._width; j++) {
                if (this._board[i][j] == MINE) {
                    continue
                }
                let totalMine = 0;
                for (let k = 0; k < direction_vectors.length; k++) {
                    let x = i + direction_vectors[k][0];
                    let y = j + direction_vectors[k][1];
        
                    if (this.is_out_board(x, y)) {
                        continue;
                    }
        
                    if (this._board[x][y] == MINE) {
                        totalMine++;
                    }
                }
                this._board[i][j] = totalMine;
            }
        }
    }
    

    // 点开指定位置的格子并更新状态，如果点击位置为雷，则GameOver, Hint: Apply BFS
    open_square (x, y) {
        if (this.is_out_board(x, y)) {
            return;
        }
        // TODO: Update Cover
        
        // 1. Check Mine, Update is_end
        if (this._board[x][y] == MINE) {
            this._is_ended = true;
            return;
        }

        // 2. Check Number
        if (this._board[x][y] > 0) {
            this._is_ended = false;
            this._covers[x][y] = this._board[x][y]; 
            return;
        }

        // 3. Check Zero, and Check Cover Arround Zero, (BFS)
        let queue = []
        queue.push([x, y]);
        while (queue.length != 0) {
            let head = queue.shift();
            let curX = head[0];
            let curY = head[1];
            this._covers[curX][curY] = 0;

            for (let i = 0; i < direction_vectors.length; i++) {
                let nextX = curX + direction_vectors[i][0];
                let nextY = curY + direction_vectors[i][1];
                if (this.is_out_board(nextX, nextY)) {
                    continue;
                }

                // Push the new zero into queue
                if (this._board[nextX][nextY] == 0 && this._covers[nextX][nextY] == COVER_NOT_OPEN) {
                    queue.push([nextX, nextY]);
                }
                this._covers[nextX][nextY] = this._board[nextX][nextY]; 
            }
        }
    }

    open_square_by_flags(x, y) {
        if (this.is_out_board(x, y)) {
            return;
        }

        if (this._covers[x][y] == COVER_NOT_OPEN) {
            return;
        }

        if (this._covers[x][y] == 0) {
            return;
        }

        if (this._covers[x][y] == FLAG) {
            return;
        }

        let totalFlag = 0;
        for (let i = 0; i < direction_vectors.length; i++) {
            let nextX = x + direction_vectors[i][0];
            let nextY = y + direction_vectors[i][1];

            if (this.is_out_board(nextX, nextY)) {
                continue;
            }

            if (this._covers[nextX][nextY] == FLAG) {
                totalFlag++;
            }
        }

        if (totalFlag != this._covers[x][y]) {
            return;
        }

        // Open All Flags
        for (let i = 0; i < direction_vectors.length; i++) {
            let nextX = x + direction_vectors[i][0];
            let nextY = y + direction_vectors[i][1];

            if (this.is_out_board(nextX, nextY)) {
                continue;
            }

            // Open square when it is not flag
            if (this._covers[nextX][nextY] != FLAG) {
                this.open_square(nextX, nextY);
            }
        }
    }

    // Return is_ended
    is_ended() {
        return this._is_ended;
    }

    // return board
    get_board() {
        return this._board;
    }

    // Return Cover
    get_cover = function() {
        return this._covers
    }

    // print board to Console
    print_board = function() {
        for (let i = 0; i < this._height; i++) {
            let str_board = "";
            for (let j = 0; j < this._width; j++) {
                if (this._board[i][j] == MINE) {
                    str_board += "@, ";
                } else {
                    str_board += this._board[i][j] + ", ";
                }
            }
            console.log(str_board)
        }
    }

    // Out Cover to Console
    print_convers() {
        for (let i = 0; i < this._height; i++) {
            let str_board = "";
            for (let j = 0; j < this._width; j++) {
                if (this._covers[i][j] == 0) {
                    str_board += "0, ";
                } else {
                    str_board += this._covers[i][j] + ", ";
                }
            }
            console.log(str_board)
        }
    }

    // Out MineSweeperBoard and Cove to Console
    print_board_and_convers() {
        console.log("====MineSweeperBoard====")
        this.print_board();
        console.log("=============")
        
        console.log("====Cover====")
        this.print_convers();
        console.log("=============")
        console.log("")
    }

    // Mark Square as Flag, Set Cover Vaule to ,2
    mark_as_flag = function(x, y) {
        if (this._covers[x][y] == FLAG) {
            this._covers[x][y] = COVER_NOT_OPEN;
            return;
        }

        if (this._covers[x][y] == COVER_NOT_OPEN) {
            this._covers[x][y] = FLAG;
            return;
        }
    }

    get_total_flag() {
        let total = 0;
        for (let i = 0; i < this._height; i++) {
            for (let j = 0; j < this._width; j++) {
                if (this._covers[i][j] == FLAG) {
                    total++;
                }
            }
        }
        return total;
    }

    get_total_mines() {
        return this._totalMines;
    }

    get_remain_chance() {
        let amount = this.get_total_mines() - this.get_total_flag();
        return amount;
    }

    // // Mask Square as Question Mark, Set Cover Vaule to ,3
    // mark_as_question_mark = function(x, y) {

    // }
    is_out_board(x, y) {
        if (x < 0 || x >= this._height) {
            return true;
        }
    
        if (y < 0 || y > this._width) {
            return true;
        }
        return false;
    }
}

// let board = new MineSweeperBoard(1);
// board.random_fake_generate(7, 7);
// board.print_board_and_convers();
// board.open_square(2, 7);
// board.print_board_and_convers();
// board.open_square(0, 7);
// board.print_board_and_convers();

// board.mark_as_flag(6, 4)
// board.print_board_and_convers();

// board.open_square_by_flags(6, 5);
// board.print_board_and_convers();

// board.open_square(0, 3)
// board.mark_as_flag(0, 2)
// board.mark_as_flag(0, 4)
// board.print_board_and_convers();

// board.open_square_by_flags(0, 3)
// board.print_board_and_convers();

let board = new MineSweeperBoard(1);
board.random_generate(7, 7);
board.print_board_and_convers();
