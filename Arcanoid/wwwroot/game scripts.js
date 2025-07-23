import { GameState, GameObject, Paddle, Ball, Brick, Bonus, Music } from './game objects.js';

window.onload = function () 
{ 
    const canvas = document.getElementById('game');
    const context = canvas.getContext('2d');
    
    const music = new Music();
    const gameState = new GameState(0, 1);

    document.getElementById('range-difficulty').addEventListener('input', function() { gameState.changeDifficulty(); });
    document.getElementById('button-previous-level').addEventListener('click', function() { gameState.changeLevel(-1); });
    document.getElementById('button-next-level').addEventListener('click', function() { gameState.changeLevel(1); });

    const wallSize = 12;

    // главный цикл игры
    function loop() 
    {
        // на каждом кадре — очищаем поле и рисуем всё заново
        requestAnimationFrame(loop);
        context.clearRect(0, 0, canvas.width, canvas.height);

        /////////////////////////////////////////////////
        // ДВИЖЕНИЕ
        /////////////////////////////////////////////////

        // двигаем платформу с нужной скоростью 
        gameState.paddle.x += gameState.paddle.dx;
   
        // шарики тоже двигается со своей скоростью
        for (let ball of gameState.balls)
        {
            ball.x += ball.dx;
            ball.y += ball.dy;
        }

        // двигаем каждый бонус
        for (let bonus of gameState.bonuses)
        {
            bonus.y += bonus.dy;
        }

        /////////////////////////////////////////////////
        // ПРОВЕРКИ
        /////////////////////////////////////////////////

        //
        if (gameState.bricks.length == 0)
        {
            music.mainMusicStop();
            music.winSound.play();
            
            gameState.restart();

            return;
        }

        if (gameState.lives <= 0)
        {   
            music.mainMusicStop();
            music.loseSound.play();

            gameState.restart();

            return; 
        }
        
        // проверка платформы, чтобы она не уехала за левую или правую границы
        if (gameState.paddle.x < wallSize) 
        {
            gameState.paddle.x = wallSize
        }
        else if (gameState.paddle.x + gameState.paddle.width > canvas.width - wallSize) 
        {
            gameState.paddle.x = canvas.width - wallSize - gameState.paddle.width;
        }
    
        // проверка шарика
        for (let i = 0; i < gameState.balls.length; i++)
        {
            const ball = gameState.balls[i];

            // проверка левой и правой границ
            if (ball.x < wallSize) 
            { 
                ball.x = wallSize;
                ball.dx *= -1;

                music.touchSound.play();
            }
            else if (ball.x + ball.width > canvas.width - wallSize) 
            {          
                ball.x = canvas.width - wallSize - ball.width;
                ball.dx *= -1;

                music.touchSound.play();
            }
            
            // проверка верхней границы
            if (ball.y < wallSize) 
            {     
                ball.y = wallSize;
                ball.dy *= -1;

                music.touchSound.play();
            }
        
            // проверка нижней границы
            if (ball.y > canvas.height) 
            {
                gameState.balls.splice(i, 1);

                if (gameState.balls.length == 0)
                {
                    music.deathSound.play();
                    gameState.decreaseLives();
                    gameState.reset();
                }
            
                break;
            }
            
            // проверяем, коснулся ли шарик платформы, которой управляет игрок. Если коснулся — меняем направление движения шарика по оси Y на противоположное
            if (GameObject.collides(ball, gameState.paddle)) 
            {
                if ((ball.y + ball.height - ball.speed <= gameState.paddle.y || ball.y >= gameState.paddle.y + gameState.paddle.height - ball.speed))
                {
                    ball.dy *= -1;

                    // сдвигаем шарик выше платформы, чтобы на следующем кадре это снова не засчиталось за столкновение
                    ball.y = gameState.paddle.y - ball.height; 
                    
                    // в зависимости от того, на какой половине шарик ударился о платформу, вычисляются угол дальнейшего полёта
                    ball.dx = gameState.speed * ((ball.x - (gameState.paddle.x + gameState.paddle.width / 2)) / gameState.paddle.width);
                }
                else
                {
                    ball.dx *= -1;
                }  

                music.touchSound.play();
            }
            
            // проверяем, коснулся ли шарик цветного кирпича 
            // если коснулся — меняем направление движения шарика в зависимости от стенки касания
            // для этого в цикле проверяем каждый кирпич на касание
            for (let j = 0; j < gameState.bricks.length; j++) 
            {
                // берём очередной кирпич
                const brick = gameState.bricks[j];
            
                // если было касание
                if (GameObject.collides(ball, brick)) 
                {
                    // воспроизведение звука
                    music.brickSound.play();
                    
                    // убираем кирпич из массива
                    gameState.bricks.splice(j, 1);

                    // генерация бонуса
                    Bonus.generateBonus(brick.x + brick.width / 2, brick.y, gameState);

                    // если шарик коснулся кирпича сверху или снизу — меняем направление движения шарика по оси Y
                    if ((ball.y + ball.height - ball.speed <= brick.y || ball.y >= brick.y + brick.height - ball.speed))
                    {
                        ball.dy *= -1;
                    }
                    // в противном случае меняем направление движения шарика по оси X
                    else 
                    {
                        ball.dx *= -1;
                    }

                    // как нашли касание — сразу выходим из цикла проверки
                    // break;
                }
            }
        }
        
        // проверка столкновения платформы и бонуса
        for (let i = 0; i < gameState.bonuses.length; i++)
        {
            if (GameObject.collides(gameState.paddle, gameState.bonuses[i]))
            {
                Bonus.activateBonus(gameState.bonuses[i].bonusType, gameState);
                music.bonusSound.play();
                gameState.bonuses.splice(i, 1);
            }
        }

        // проверка, если бонус улетел за нижнюю границу
        for (let i = 0; i < gameState.bonuses.length; i++)
        {
            if (gameState.bonuses[i].y > canvas.height)
            {
                gameState.bonuses.splice(i, 1);
            }  
        }


        /////////////////////////////////////////////////
        // ОТРИСОВКА
        /////////////////////////////////////////////////

        // рисуем стены
        context.fillStyle = 'lightgrey';
        context.fillRect(0, 0, canvas.width, wallSize);
        context.fillRect(0, 0, wallSize, canvas.height);
        context.fillRect(canvas.width - wallSize, 0, wallSize, canvas.height);
  
        // если шарик в движении — рисуем его
        for (let ball of gameState.balls)
        {
            if (ball.dx || ball.dy) 
            {
                context.beginPath();
                context.fillStyle = ball.color;
                context.arc(ball.x + ball.radius, ball.y + ball.radius, ball.radius, 0, 2 * Math.PI);
                context.fill(); 
            }
        }

        // рисуем кирпичи
        for (let brick of gameState.bricks)
        {
            context.fillStyle = brick.color;
            context.fillRect(brick.x, brick.y, brick.width, brick.height);
        }
    
        // рисуем платформу
        context.fillStyle = gameState.paddle.color;
        context.fillRect(gameState.paddle.x, gameState.paddle.y, gameState.paddle.width, gameState.paddle.height);

        // рисуем бонусы
        for (let bonus of gameState.bonuses)
        {
            context.drawImage(bonus.image, bonus.x, bonus.y, bonus.width, bonus.height);
        }
    }

    // отслеживаем нажатия игрока на клавиши
    canvas.addEventListener('click', function(e) 
    {
        if (gameState.balls.length == 0)
        {
            music.mainMusicStart();

            gameState.balls.push(new Ball(gameState.paddle.x + gameState.paddle.width / 2 - 3, gameState.paddle.y - gameState.paddle.height / 2, 3, gameState.speed, 'white'));
        }
    });

    document.addEventListener('mousemove', function(e) 
    {
        gameState.paddle.x = e.clientX - canvas.offsetLeft - gameState.paddle.width / 2;
        // gameState.paddle.y = e.clientY - canvas.offsetTop;
    });

    requestAnimationFrame(loop);
}

