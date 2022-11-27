"use strict";

/*****************************
 * Air Hockey By Ivar Fahlén *
 *       Version 0.3         *
 ****************************/

//sätter upp canvas
document.getElementById("body").style = "margin : 0";
document.body.style.overflow = "hidden";
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
canvas.style = "border:1px solid #000000;";
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;
canvas.style.cursor = "none";

// skapar variabler för canvas höjd och bredd
// för att lättare kunna hänvisa till de i koden
let w = canvas.width;
let h = canvas.height;

let collide = false;

//variabler för  de olika ljuden som ska spelas under spelets gång
let click = new Audio("AirHockeyClick.mp3");
let goalSound = new Audio("goal.mp3");

// Variabel som visar om något ljud spelas
// för att kunna stänga av det när nästa ljud ska spelas
let checkAudio = false;

// Variabler som håller koll på målställningen
let score1 = 0;
let score2 = 0;

// skapar objektet puck med element för hastighet i y- och x-led och plats
const puck = {
  x: w / 4,
  y: h / 2,
  vx: 0,
  vy: 0,
};

// skapar objektet paddle med element för hastighet i y- och x-led,
// plats samt senaste x och y värdet, vilket används för att räkna ut vx och vy
const paddle = {
  x: undefined,
  y: undefined,
  lastX: 0,
  lastY: 0,
  vx: 0,
  vy: 0,
};

//creating Opponent
const paddleOpponent = {
  x: w - 150,
  y: h / 2,
  vx: 0,
  vy: 0,
  velocity: 10,
};

// skapar variabler för puckens och paddelns radie, diameter och diameter^2
let rad = w / 32;
let diameter = 2 * rad;
let diameter2 = (2 * rad) ** 2;

// lyssnar efter muspositionen och flyttar paddelns x och y värde dit
canvas.addEventListener("mousemove", function mousePos(e) {
  (paddle.x = e.clientX), (paddle.y = e.clientY);
});

canvas.addEventListener(
  "touchstart",
  (e) => {
    // Cache the client X/Y coordinates
    paddle.x = e.touches[0].clientX;
    paddle.y = e.touches[0].clientY;
  },
  false
);

//touch bre
function touch() {
  canvas.addEventListener(
    "touchmove",
    (e) => {
      // Cache the client X/Y coordinates
      paddle.x = e.touches[0].clientX;
      paddle.y = e.touches[0].clientY;
    },
    false
  );
}
canvas.addEventListener(
  "touchend",
  (e) => {
    let deltaX;
    let deltaY;
    deltaX = e.changedTouches[0].clientX - clientX;
    deltaY = e.changedTouches[0].clientY - clientY;
  },
  false
);

// Ritar upp bordet, vilket innefattar kanterna av bordet samt dekoration på bordet.
// Nästan allt som ritas upp har inte enheten pixlar utan använder bredden på canvas
// som en enhet för att allt ska se snyggt ut på vilken skärm som helst.
function drawTable() {
  //ritar en röd något transparent linje i mitten
  ctx.beginPath();
  ctx.lineWidth = w / 122;
  ctx.strokeStyle = "rgba(255, 0, 0, 0.5)";
  ctx.fillStyle = "rgba(255, 0, 0, 0.5)";
  ctx.moveTo(w / 2, 0);
  ctx.lineTo(w / 2, h);
  ctx.stroke();

  //ritar blåa linjer på båda sidor om mitten
  ctx.beginPath();
  ctx.strokeStyle = "rgba(0, 0, 255, 0.5)";
  ctx.fillStyle = "rgba(0, 0, 255, 0.5)";
  ctx.moveTo(w / 4, 0);
  ctx.lineTo(w / 4, h);
  ctx.moveTo((w * 3) / 4, 0);
  ctx.lineTo((w * 3) / 4, h);
  ctx.stroke();

  //ritar en stor blå cirkel i mitten
  ctx.beginPath();
  ctx.lineWidth = w / 182;
  ctx.arc(w / 2, h / 2, w / 13, 0, Math.PI * 2);
  ctx.stroke();

  // ritar en liten blå cirkel i mitten
  ctx.beginPath();
  ctx.arc(w / 2, h / 2, 2, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Ritar de svarta kanterna av canvas med hål för målen på båda sidor
  ctx.beginPath();
  ctx.strokeStyle = "black";
  ctx.fillStyle = "black";
  ctx.rect(0, 0, w - w / 128, w / 128);
  ctx.rect(0, 0, w / 128, h / 2 - w / 17.5 - rad);
  ctx.rect(0, h, w / 128, -h / 2 + w / 17.5 + rad);
  ctx.rect(w, 0, -w / 128, h / 2 - w / 17.5 - rad);
  ctx.rect(w, h, -w / 128, -h / 2 + w / 17.5 + rad);
  ctx.rect(w / 128, h - w / 128, w - w / 128, w / 128);
  ctx.fill();
  ctx.stroke();
}

// Ritar spelarens paddeln
function drawPaddle() {
  if (paddle.x > w / 2) {
    paddle.x = w / 2;
  }
  ctx.beginPath();
  ctx.strokeStyle = "blue";
  ctx.fillStyle = "blue";
  ctx.arc(paddle.x, paddle.y, rad, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
}

// Ränkar ut och ändrar paddelns hastighet genom att använda
// skillnaden mellan x, respektive y, vid två olika tillfällen
// för att räkna ut hur mycket den färdats mellan två uppdateringar
function velPaddle() {
  paddle.vx = paddle.x - paddle.lastX;
  paddle.vy = paddle.y - paddle.lastY;

  paddle.lastX = paddle.x;
  paddle.lastY = paddle.y;

  // Sätter maxhastigheten till 30
  /*if (paddle.vx > 150) {
    paddle.vx = 150;
  }
  if (paddle.vy > 150) {
    paddle.vy = 150;
  }*/
}

// Ritar motståndarens paddel
function drawOpponent() {
  // Deklarerar variabler för uträkning av hastighet och rörelse
  let puckDistance;
  let v;
  let dx;
  let dy;

  // Om pucken är på motståndarens planhalva ska detta göras
  if (puck.x > w / 2) {
    // Tittar om pucken kolliderat med
    if (!collide && puck.vx > -10) {
      // Eftersom vi vill sätta en fast hastighet som paddeln ska röra
      // sig i så måste vi först se hur förhållandena till pucken är.
      // Detta gör vi genom att först ta puckens x- respektive y-värde
      // och subtrahera paddelns x- respektive y-värde.
      dx = puck.x - paddleOpponent.x;
      dy = puck.y - paddleOpponent.y;

      // Här ränkas distansen till pucken ut samt med vilken vinkel från "x-axeln" paddeln ska röra sig
      // vilket görs med pythagoras sats och sin invers.
      puckDistance = Math.sqrt(dx ** 2 + dy ** 2);
      v = Math.asin(dy / puckDistance);

      // Här räknas det ut hur mycket hastigheten i x och y led ska ändras.
      // När vi räknar ut vx multiplicerar vi med -1 eftersom vi vill att
      // motståndarens paddel ska åka åt vänster för att skjuta pucken.
      paddleOpponent.vy = Math.sin(v) * paddleOpponent.velocity;
      paddleOpponent.vx = Math.cos(v) * paddleOpponent.velocity * -1;

      // Här flyttas paddeln med den rätta hastigheten i x- och y-led.
      paddleOpponent.x += paddleOpponent.vx;
      paddleOpponent.y += paddleOpponent.vy;
    }
  }

  // Detta ska ske efter kollisionen med pucken
  if (collide) {
    // Paddeln åker till höger
    paddleOpponent.x += paddleOpponent.velocity;
    // Om paddeln är på nedre halvan åker den tillbaks till mitten
    if (paddleOpponent.y > h / 2) {
      paddleOpponent.y -= paddleOpponent.velocity;
    }
    // Om paddeln är på övre halvan åker den tillbaks till mitten
    if (paddleOpponent.y < h / 2) {
      paddleOpponent.y += paddleOpponent.velocity;
    }
    // När paddeln har åkt tillbaka till sitt ursprungliga x-värde stängs collide
    // av och paddeln kan åka fram igen, förutsatt att pucken är på dess planhalva.
    if (paddleOpponent.x > w - w / 6.4) {
      collide = false;
    }
  }

  // Flyttar motståndarens paddel till vänter om pucken är till vänster om den
  if (puck.x > paddleOpponent.x) {
    paddleOpponent.x += paddleOpponent.velocity;
  }

  // Flyttar tillbaka motståndarens paddel till ursprungspositionen
  // om den är till vänster om positionen
  if (puck.x < w / 2 && paddleOpponent.x < w - w / 6.4) {
    // Om paddeln är på nedre halvan åker den tillbaks till mitten
    if (paddleOpponent.y > h / 2) {
      paddleOpponent.y -= paddleOpponent.velocity;
    }
    // Om paddeln är på övre halvan åker den tillbaks till mitten
    if (paddleOpponent.y < h / 2) {
      paddleOpponent.y += paddleOpponent.velocity;
    }
    paddleOpponent.x += paddleOpponent.velocity;
  }

  // Flyttar tillbaka motståndarens paddel till utgångspunkten
  // om den är till höger om positionen
  if (puck.x < w / 2 && paddleOpponent.x > w - w / 6.4) {
    // Om paddeln är på nedre halvan åker den tillbaka till mitten
    if (paddleOpponent.y > h / 2) {
      paddleOpponent.y -= paddleOpponent.velocity;
    }
    // Om paddeln är på övre halvan åker den tillbaka till mitten
    if (paddleOpponent.y < h / 2) {
      paddleOpponent.y += paddleOpponent.velocity;
    }
    // Paddeln åker till vänster tills den når utgångspunkten
    paddleOpponent.x -= paddleOpponent.velocity;
  }

  ctx.beginPath();
  ctx.strokeStyle = "blue";
  ctx.fillStyle = "blue";
  ctx.arc(paddleOpponent.x, paddleOpponent.y, rad, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
}

// Ritar upp pucken och gör så att den studsar på väggarna
function drawPuck() {
  // Flyttar puckens position
  puck.x += puck.vx;
  puck.y += puck.vy;

  // Här tittar programmet om pucken befinner sig på någon av kanterna till höger
  // eller vänster i canvas. w / 80 är här tjockleken av de svarta kanterna vilket
  // gör att pucken studsar mot de istället för kanterna av canvas.
  if (puck.x > w - rad - w / 80 || puck.x < rad + w / 80) {
    // Här tittar vi om pucken befinner sig inom målet eller inte då den
    // är vid någon av kanterna, är den det så ska den inte studsa mot kanten.
    // Här testas om den är vid undre delen av målet.
    if (puck.y > h / 2 + w / 17.5) {
      puck.vx *= -1;
      if (!checkAudio) {
        click.play();
        checkAudio = true;
      } else {
        click.pause();
        click.currentTime = 0;
        checkAudio = false;
        click.play();
        checkAudio = true;
      }
    }

    // Här testas om den är vid övre delen av målet.
    if (puck.y < h / 2 - w / 17.5) {
      puck.vx *= -1;
      if (!checkAudio) {
        click.play();
        checkAudio = true;
      } else {
        click.pause();
        click.currentTime = 0;
        checkAudio = false;
        click.play();
        checkAudio = true;
      }
    }
  }

  // Här testas om pucken befinner sig vid någon av den undre eller
  // övre kanten, då den ska studsa. Även här är w / 80 tjockleken av de svarta kanterna.
  if (puck.y > h - rad - w / 80 || puck.y < rad + w / 80) {
    puck.vy *= -1;
    if (!checkAudio) {
      click.play();
      checkAudio = true;
    } else {
      click.pause();
      click.currentTime = 0;
      checkAudio = false;
      click.play();
      checkAudio = true;
    }
  }

  //Här Ritas pucken ut i färgen röd
  ctx.beginPath();
  ctx.strokeStyle = "red";
  ctx.fillStyle = "red";
  ctx.arc(puck.x, puck.y, rad, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
}

// Denna funktion tar tillbaka pucken in på spelplanen
// om den skjutits ut ur den. Detta görs genom att flytta
// tillbaka pucken till den högsta eller lägsta kordinaten
// som fortfarande är inne på spelplanen om den åker ut på
// någon kant.
function bringBackPuck() {
  // Överkanten
  if (puck.y < w / 80 + rad) {
    puck.y = w / 80 + rad;
  }
  // Underkanten
  if (puck.y > h - w / 80 - rad) {
    puck.y = h - w / 80 - rad;
  }
  // Vänster kant under målet
  if (puck.x < w / 80 + rad && puck.y > h / 2 + w / 10.5) {
    puck.x = w / 80 + rad;
  }
  // Vänster kant över målet
  if (puck.x < w / 80 + rad && puck.y < h / 2 - w / 10.5) {
    puck.x = w / 80 + rad;
  }
  // Höger kant över målet
  if (puck.x > w - w / 80 - rad && puck.y < h / 2 - w / 10.5) {
    puck.x = w - w / 80 - rad;
  }
  // Höger kant under målet
  if (puck.x > w - w / 80 - rad && puck.y > h / 2 + w / 10.5) {
    puck.x = w - w / 80 - rad;
  }
}

// Tittar efter mål
function goals() {
  // Om pucken befinner sig i vänster mål så ska målljudet spelas,
  // 1 ska adderas  till score1 och funktionen som lägger tillbaka
  // pucken på sidan där målet gick in ska köras.
  if (puck.x > canvas.width + rad) {
    goalSound.play();
    score1++;
    delayNewPuck2();
  }
  if (puck.x < 5 - rad) {
    goalSound.play();
    score2++;
    delayNewPuck1();
  }
}

// Uppdaterar målen på måltavlan
function updateScore() {
  ctx.font = "60px Arial";
  ctx.fillText(score1, (w * 9) / 20, 90);
  ctx.fillText(score2, (w * 11) / 20 - 45, 90);
}

// Lägger tillbaka pucken på vänster sida
function delayNewPuck1() {
  // Sätter puckens koordinater till undefined för att den tidigare
  // funktionen "goals" inte ska upprepas och räkna fler mål än 1.
  puck.x = undefined;
  puck.y = undefined;

  // Väntar i 1 sekund och släpper sedan ner en puck på vänster sida
  setTimeout(function resetOpponent() {
    paddleOpponent.x = w - 50;
    paddleOpponent.y = h / 2;
  }, 50);

  setTimeout(function newPuck() {
    paddleOpponent.x = w - 50;
    paddleOpponent.y = h / 2;
    puck.vx = 0;
    puck.vy = 0;
    puck.x = w / 4;
    puck.y = h / 2;
  }, 1000);
}

// Lägger tillbaka pucken på höger sida
function delayNewPuck2() {
  // Sätter puckens koordinater till undefined för att den tidigare
  // funktionen "goals" inte ska upprepas och räkna fler mål än 1.
  puck.x = undefined;
  puck.y = undefined;
  // Väntar i 1 sekund och släpper sedan ner en puck på höger sida
  setTimeout(function resetOpponent() {
    paddleOpponent.x = w - 50;
    paddleOpponent.y = h / 2;
  }, 50);

  setTimeout(function newPuck() {
    puck.vx = 0;
    puck.vy = 0;
    puck.x = w - w / 4;
    puck.y = h / 2;
  }, 1000);
}

// Friktionen slöar ner pucken med förändringsfaktorn 0.99
function friction() {
  puck.vx *= 0.99;
  puck.vy *= 0.99;
}

// Kollision mellan pucken och spelarens paddel,
// tagen från Mauritz "kolliderande bollar"
function collision() {
  let dx = paddle.x - puck.x;
  if (Math.abs(dx) < diameter) {
    let dy = paddle.y - puck.y;
    let d2 = dx ** 2 + dy ** 2;
    if (d2 < diameter2) {
      let dvx = puck.vx - paddle.vx;
      let dvy = puck.vy - paddle.vy;
      let dvs = dx * dvx + dy * dvy;
      if (dvs > 0) {
        click.play();
        dvs = dvs / d2;
        dvx = dvs * dx;
        dvy = dvs * dy;
        paddle.vx += dvx;
        paddle.vy += dvy;
        puck.vx -= dvx;
        puck.vy -= dvy;
      }
    }
  }
}

// Kollision mellan pucken och motståndarens paddel,
// tagen från Mauritz "kolliderande bollar"
function collisionOpponent() {
  let dx = paddleOpponent.x - puck.x;
  if (Math.abs(dx) < diameter) {
    let dy = paddleOpponent.y - puck.y;
    let d2 = dx ** 2 + dy ** 2;
    if (d2 < diameter2) {
      let dvx = puck.vx - paddleOpponent.vx;
      let dvy = puck.vy - paddleOpponent.vy;
      let dvs = dx * dvx + dy * dvy;
      if (dvs > 0) {
        click.play();
        dvs = dvs / d2;
        dvx = dvs * dx;
        dvy = dvs * dy;
        paddleOpponent.vx += dvx;
        paddleOpponent.vy += dvy;
        puck.vx -= dvx;
        puck.vy -= dvy;
        collide = true;
      }
    }
  }
}

//main function and animation frame
function main() {
  ctx.clearRect(0, 0, w, h);
  console.log(collide);
  drawTable();
  velPaddle();
  drawPaddle();
  drawOpponent();
  drawPuck();
  collision();
  collisionOpponent();
  updateScore();
  friction();
  goals();
  bringBackPuck();
  requestAnimationFrame(main);
}

main();
