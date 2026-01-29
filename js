class SudokuGame {
    constructor() {
        this.board = [];
        this.solution = [];
        this.selectedCell = null;
        this.difficulty = 'easy';
        this.score = 0;
        this.mistakes = 0;
        this.maxMistakes = 3;
        this.timeElapsed = 0;
        this.timerInterval = null;
        this.leaderboard = JSON.parse(localStorage.getItem('sudokuLeaderboard')) || [];
        
        this.init();
    }
    
    init() {
        this.createBoard();
        this.setupEventListeners();
        this.updateLeaderboard();
        this.newGame();
    }
    
    createBoard() {
        const boardElement = document.getElementById('sudoku-board');
        for (let i = 0; i < 81; i++) {
            const cell = document.createElement('div');
            cell.className = 'cell';
            cell.dataset.index = i;
            boardElement.appendChild(cell);
        }
    }
    
    setupEventListeners() {
        const cells = document.querySelectorAll('.cell');
        cells.forEach(cell => {
            cell.addEventListener('click', () => this.selectCell(cell));
        });
        
        document.querySelectorAll('.num-btn').forEach(btn => {
            btn.addEventListener('click', () => this.placeNumber(parseInt(btn.dataset.number)));
        });
        
        document.getElementById('erase-btn').addEventListener('click', () => this.eraseCell());
        document.getElementById('hint-btn').addEventListener('click', () => this.giveHint());
        document.getElementById('new-game-btn').addEventListener('click', () => this.newGame());
        document.getElementById('play-again-btn').addEventListener('click', () => {
            document.getElementById('win-modal').classList.remove('active');
            this.newGame();
        });
        
        document.querySelectorAll('.diff-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.diff-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.difficulty = btn.dataset.difficulty;
                this.newGame();
            });
        });
    }
    
    generateSudoku() {
        this.solution = this.createFullBoard();
        this.board = JSON.parse(JSON.stringify(this.solution));
        
        const cellsToRemove = {
            'easy': 40,
            'medium': 50,
            'hard': 60
        };
        
        this.removeNumbers(cellsToRemove[this.difficulty]);
    }
    
    createFullBoard() {
        const board = Array(9).fill(0).map(() => Array(9).fill(0));
        this.fillBoard(board);
        return board;
    }
    
    fillBoard(board, row = 0, col = 0) {
        if (row === 9) return true;
        if (col === 9) return this.fillBoard(board, row + 1, 0);
        
        const numbers = this.shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9]);
        
        for (let num of numbers) {
            if (this.isValidMove(board, row, col, num)) {
                board[row][col] = num;
                if (this.fillBoard(board, row, col + 1)) return true;
                board[row][col] = 0;
            }
        }
        
        return false;
    }
    
    isValidMove(board, row, col, num) {
        for (let i = 0; i < 9; i++) {
            if (board[row][i] === num) return false;
            if (board[i][col] === num) return false;
        }
        
        const boxRow = Math.floor(row / 3) * 3;
        const boxCol = Math.floor(col / 3) * 3;
        
        for (let i = 0; i < 3; i++) {
            for (let j = 0; j < 3; j++) {
                if (board[boxRow + i][boxCol + j] === num) return false;
            }
        }
        
        return true;
    }
    
    removeNumbers(count) {
        let removed = 0;
        while (removed < count) {
            const row = Math.floor(Math.random() * 9);
            const col = Math.floor(Math.random() * 9);
            
            if (this.board[row][col] !== 0) {
                this.board[row][col] = 0;
                removed++;
            }
        }
    }
    
    shuffle(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }
    
    renderBoard() {
        const cells = document.querySelectorAll('.cell');
        cells.forEach((cell, index) => {
            const row = Math.floor(index / 9);
            const col = index % 9;
            const value = this.board[row][col];
            
            cell.textContent = value === 0 ? '' : value;
            cell.classList.remove('fixed', 'incorrect', 'correct');
            
            if (value !== 0 && this.solution[row][col] === value && !cell.dataset.userInput) {
                cell.classList.add('fixed');
            }
        });
    }
    
    selectCell(cell) {
        if (cell.classList.contains('fixed')) return;
        
        document.querySelectorAll('.cell').forEach(c => c.classList.remove('selected'));
        cell.classList.add('selected');
        this.selectedCell = cell;
    }
    
    placeNumber(num) {
        if (!this.selectedCell || this.selectedCell.classList.contains('fixed')) return;
        
        const index = parseInt(this.selectedCell.dataset.index);
        const row = Math.floor(index / 9);
        const col = index % 9;
        
        this.board[row][col] = num;
        this.selectedCell.textContent = num;
        this.selectedCell.dataset.userInput = 'true';
        
        if (num === this.solution[row][col]) {
            this.selectedCell.classList.remove('incorrect');
            this.selectedCell.classList.add('correct');
            this.score += 10;
            this.updateScore();
            
            if (this.checkWin()) {
                this.gameWon();
            }
        } else {
            this.selectedCell.classList.remove('correct');
            this.selectedCell.classList.add('incorrect');
            this.mistakes++;
            this.updateMistakes();
            
            if (this.mistakes >= this.maxMistakes) {
                this.gameLost();
            }
        }
    }
    
    eraseCell() {
        if (!this.selectedCell || this.selectedCell.classList.contains('fixed')) return;
        
        const index = parseInt(this.selectedCell.dataset.index);
        const row = Math.floor(index / 9);
        const col = index % 9;
        
        this.board[row][col] = 0;
        this.selectedCell.textContent = '';
        this.selectedCell.classList.remove('incorrect', 'correct');
        delete this.selectedCell.dataset.userInput;
    }
    
    giveHint() {
        const emptyCells = [];
        document.querySelectorAll('.cell').forEach((cell, index) => {
            if (!cell.classList.contains('fixed') && cell.textContent === '') {
                emptyCells.push({ cell, index });
            }
        });
        
        if (emptyCells.length === 0) return;
        
        const randomCell = emptyCells[Math.floor(Math.random() * emptyCells.length)];
        const row = Math.floor(randomCell.index / 9);
        const col = randomCell.index % 9;
        
        this.board[row][col] = this.solution[row][col];
        randomCell.cell.textContent = this.solution[row][col];
        randomCell.cell.classList.add('fixed');
        
        this.score = Math.max(0, this.score - 20);
        this.updateScore();
    }
    
    checkWin() {
        for (let i = 0; i < 9; i++) {
            for (let j = 0; j < 9; j++) {
                if (this.board[i][j] !== this.solution[i][j]) {
                    return false;
                }
            }
        }
        return true;
    }
    
    gameWon() {
        this.stopTimer();
        
        const timeBonus = Math.max(0, 500 - this.timeElapsed);
        const finalScore = this.score + timeBonus;
        
        this.leaderboard.push({
            difficulty: this.difficulty,
            score: finalScore,
            time: this.formatTime(this.timeElapsed),
            timestamp: Date.now()
        });
        
        this.leaderboard.sort((a, b) => b.score - a.score);
        this.leaderboard = this.leaderboard.slice(0, 10);
        localStorage.setItem('sudokuLeaderboard', JSON.stringify(this.leaderboard));
        
        document.getElementById('final-score').textContent = finalScore;
        document.getElementById('final-time').textContent = this.formatTime(this.timeElapsed);
        document.getElementById('final-difficulty').textContent = this.difficulty.charAt(0).toUpperCase() + this.difficulty.slice(1);
        document.getElementById('win-modal').classList.add('active');
        
        this.updateLeaderboard();
    }
    
    gameLost() {
        this.stopTimer();
        alert('Game Over! You made too many mistakes. Try again!');
        this.newGame();
    }
    
    newGame() {
        this.score = 0;
        this.mistakes = 0;
        this.timeElapsed = 0;
        this.selectedCell = null;
        
        this.generateSudoku();
        this.renderBoard();
        this.updateScore();
        this.updateMistakes();
        this.startTimer();
    }
    
    startTimer() {
        this.stopTimer();
        this.timerInterval = setInterval(() => {
            this.timeElapsed++;
            document.getElementById('timer').textContent = this.formatTime(this.timeElapsed);
        }, 1000);
    }
    
    stopTimer() {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
    }
    
    formatTime(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    
    updateScore() {
        document.getElementById('score').textContent = this.score;
    }
    
    updateMistakes() {
        document.getElementById('mistakes').textContent = `${this.mistakes}/${this.maxMistakes}`;
    }
    
    updateLeaderboard() {
        const tbody = document.getElementById('leaderboard-body');
        
        if (this.leaderboard.length === 0) {
            tbody.innerHTML = '<tr><td colspan="4">No games completed yet</td></tr>';
            return;
        }
        
        tbody.innerHTML = this.leaderboard.map((entry, index) => `
            <tr>
                <td>${index + 1}</td>
                <td>${entry.difficulty.charAt(0).toUpperCase() + entry.difficulty.slice(1)}</td>
                <td>${entry.score}</td>
                <td>${entry.time}</td>
            </tr>
        `).join('');
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new SudokuGame();
});
