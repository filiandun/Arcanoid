import { levels } from "./game levels.js";

export { GameState, GameObject, Paddle, Ball, Brick, Bonus, Music };

class GameState
{
    numLevel
    difficulty
    
    lives
    speed

    paddle
    balls
    bonuses
    bricks

    constructor(numLevel, difficulty)
    {
        this.numLevel = numLevel;
        
        this.difficulty = difficulty;
        
        this.lives = 5; 
        this.speed = difficulty * 3;

        this.paddle = new Paddle('cyan');
        this.balls = [];
        this.bonuses = [];
        this.bricks = [];

        this.changeLevel(this.numLevel);
    }

    changeDifficulty()
    {
        let newDifficulty = document.getElementById('range-difficulty').value;

        this.difficulty = newDifficulty;
        this.changeSpeed(this.difficulty * 3);
    }

    changeLevel(value)
    {
        this.numLevel += value;
        if (this.numLevel < 0)
        {
            this.numLevel = levels.length - 1;
        }
        else if (this.numLevel > levels.length - 1)
        {
            this.numLevel = 0;
        }
     
        const colorMap = 
        {
            'R': 'red',
            'O': 'orange',
            'G': 'green',
            'Y': 'yellow'
        };

        const brickGap = 2;
        const brickWidth = 25;
        const brickHeight = 12;
        const wallSize = 12;
        
        this.bricks.length = 0;
        let level = levels[this.numLevel];

        for (let row = 0; row < level.length; row++) 
        {
            for (let col = 0; col < level[row].length; col++) 
            {
                if (level[row][col] != null)
                {
                    const colorCode = level[row][col];
                    
                    this.bricks.push(new Brick(wallSize + (brickWidth + brickGap) * col, wallSize + (brickHeight + brickGap) * row, brickWidth, brickHeight, colorMap[colorCode]));
                }
            }
        }
    }

    decreaseLives()
    {
        this.lives--;
        this.updateLives();
    }

    increaseLives()
    {
        this.lives++;
        this.updateLives();
    }

    updateLives()
    {
        const livesElement = document.getElementById('lives');
        livesElement.textContent = this.lives;
    }

    changeSpeed(newSpeed)
    {
        this.speed = newSpeed;

        for (let i = 0; i < this.balls.length; i++)
        {
            this.balls[i].dx = this.balls[i].dx / this.balls[i].speed * newSpeed;
            this.balls[i].dy = this.balls[i].dy / this.balls[i].speed * newSpeed;
    
            this.balls[i].speed = newSpeed;
        }

        for (let i = 0; i < this.bonuses.length; i++)
        {
            this.bonuses[i].dx = this.bonuses[i].dx / this.bonuses[i].speed * (newSpeed / 2);
            this.bonuses[i].dy = this.bonuses[i].dy / this.bonuses[i].speed * (newSpeed / 2);
    
            this.bonuses[i].speed = newSpeed / 2;
        }
    }

    changeSize(coefficient)
    {
        for (let i = 0; i < this.balls.length; i++)
        {
            this.balls[i].radius *= coefficient;
            this.balls[i].height *= coefficient;
            this.balls[i].width *= coefficient;
        }
    }

    reset()
    {
        this.speed = this.difficulty * 3;
        this.paddle.reset();
        this.balls.length = 0;
        this.bonuses.length = 0;
    }

    restart()
    {
        this.lives = 5;  
        this.reset();
        this.updateLives();
        this.changeLevel(0);
    }
}


class GameObject
{
    x // координаты
    y
    
    dx // направление
    dy

    width // размеры
    height
    
    speed // скорость
    
    color // цвет
    
    constructor(x, y, dx, dy, width, height, speed, color)
    {
        this.x = x;
        this.y = y;
        
        this.dx = dx;
        this.dy = dy;
        
        this.width = width;
        this.height = height;
        
        this.speed = speed;
        
        this.color = color;
    }

    static collides(obj1, obj2) 
    {
        return obj1.x < obj2.x + obj2.width &&
            obj1.x + obj1.width > obj2.x &&
            obj1.y < obj2.y + obj2.height &&
            obj1.y + obj1.height > obj2.y;
    }
}

class Paddle extends GameObject
{
    constructor(color)
    {
        super(400 / 2 - 25 / 2, 440, 0, 0, 25, 12, 0, color);
    }

    reset()
    {
        this.width = 25;
        this.height = 12;
    }
}

class Ball extends GameObject
{
    radius

    constructor(x, y, radius, speed, color)
    {
        super(x, y, 0, -speed, radius * 2, radius * 2, speed, color);

        this.radius = radius;
    }
}

class Bonus extends GameObject
{
    bonusType
    image
    
    constructor(x, y, speed, bonusType)
    {
        super(x, y, 0, speed, 12, 12, speed, "blue");
        
        this.bonusType = bonusType;
        this.image = new Image();
        this.image.src = `Images/${bonusType}.png`;
    }

    static generateBonus(x, y, gameState)
    {
        if (Math.floor(Math.random() * 3) == 0)
        {
            let availableBonusList = this.#availableBonuses(gameState);
            
            let newBonus = new Bonus(x, y, gameState.speed / 2, bonusTypes[availableBonusList[Math.floor(Math.random() * availableBonusList.length)]]);
            
            gameState.bonuses.push(newBonus);
        }
    }

    static #availableBonuses(gameState)
    {
        let availableBonusList = [ 0, 5, 6 ];

        if (gameState.balls[0].radius <= 9)
        {
            availableBonusList.push(1);
        }
        if (gameState.balls[0].radius >= 3)
        {
            availableBonusList.push(2);
        }

        if (gameState.paddle.width <= 75)
        {
            availableBonusList.push(3);
        }
        if (gameState.paddle.width >= 13)
        {
            availableBonusList.push(4);
        }

        if (gameState.speed < 10)
        {
            availableBonusList.push(7);
        }
        if (gameState.speed > 1)
        {
            availableBonusList.push(8);
        }

        return availableBonusList;
    }

    static activateBonus(bonusType, gameState)
    {
        switch (bonusType)
        {
            case 'doubleBalls':
                let ballsLength = gameState.balls.length;
                for (let i = 0; i < ballsLength; i++)
                {
                    let newBall = new Ball(gameState.balls[i].x, gameState.balls[i].y, gameState.balls[i].radius, gameState.balls[i].speed, 'white');
                    newBall.dx *= -1;
                    gameState.balls.push(newBall); 
                }
                break;

            case 'bigBall': gameState.changeSize(2); break;

            case 'smallBall': gameState.changeSize(0.5); break;

            case 'longPaddle': gameState.paddle.width *= 2; break;
            case 'shortPaddle': gameState.paddle.width /= 2; break;

            case 'death': gameState.decreaseLives(); break;
            case 'life': gameState.increaseLives(); break;

            case 'fast': gameState.changeSpeed(gameState.speed + 1); break;
            case 'slow': gameState.changeSpeed(gameState.speed - 1); break;

            default: console.log("DEFAULT"); break;
        } 
    }
}

class Brick extends GameObject
{
    constructor(x, y, width, height, color)
    {
        super(x, y, 0, 0, width, height, 0, color)
    }
}

const bonusTypes = 
{
    0: 'doubleBalls',
    1: 'bigBall',
    2: 'smallBall',
    
    3: 'longPaddle',
    4: 'shortPaddle',
    
    5: 'death',
    6: 'life',

    7: 'fast',
    8: 'slow'
}

class Music
{
    #mainMusic

    touchSound
    deathSound
    bonusSound
    brickSound
    
    winSound
    loseSound

    constructor()
    {
        this.#mainMusic = new Audio();
        this.#mainMusic.preload = 'auto';
        this.#mainMusic.src = 'Sounds/main-music.mp3';
        this.#mainMusic.loop = true;

        this.touchSound = new Sound('Sounds/touch.mp3');
        this.deathSound = new Sound('Sounds/death.wav');
        this.bonusSound = new Sound('Sounds/bonus.mp3');
        this.brickSound = new Sound('Sounds/touch.mp3');
        this.winSound = new Sound('Sounds/win.mp3');    
        this.loseSound = new Sound('Sounds/lose.mp3');
    }

    mainMusicStart()
    {
        this.loseSound.stop();
        this.winSound.stop();

        this.#mainMusic.play();
    }

    mainMusicStop()
    {        
        this.#mainMusic.pause();
        this.#mainMusic.currentTime = 0.0;
    }
}

class Sound
{
    #sound

    constructor(source)
    {
        this.#sound = new Audio(source);
        this.#sound.preload = 'auto';
    }

    play()
    {
        if (this.#sound.played)
        {
            this.stop();
        }
        this.#sound.play();
    }

    stop()
    {
        this.#sound.pause();
        this.#sound.currentTime = 0.0;
    }
}
