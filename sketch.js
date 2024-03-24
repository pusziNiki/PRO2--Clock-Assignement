let handpose;
let video;
let predictions = [];

class Ball {
  gravity = 0.3;
  friction = 0.1;
  constructor(x, y, r) {
    this.position = createVector(x, y);
    this.velocity = createVector(0, 0); 
    this.acceleration = createVector(0, 0.1); 
    this.r = r;
    this.m = r * 0.1;
  }

  update() {
    this.velocity.add(this.acceleration); 
    this.position.add(this.velocity);
  }

  checkBoundaryCollision() {
    
    if (this.position.x > width/2+300 - this.r) {
      this.position.x = width/2+300 - this.r;
      this.velocity.x *= -this.gravity; 
    } else if (this.position.x < this.r) {
      this.position.x = this.r;
      this.velocity.x *= -this.gravity; 
    } else if (this.position.x < width/2-250 - this.r){
      this.position.x = width/2-250 - this.r;
      this.velocity.x *= -this.gravity;
    }



    
    if (this.position.y > height/2 + 100 - this.r) {
      this.position.y = height/2 + 100- this.r; 
      this.velocity.y *= -this.gravity; 

      
      this.velocity.x *= this.friction; 
    } else if (this.position.y < this.r) {
      this.position.y = this.r;
      this.velocity.y *= -this.gravity; 
    }
  }

  checkCollision(other) {
    let distanceVect = p5.Vector.sub(other.position, this.position);
    let distanceVectMag = distanceVect.mag();
    let minDistance = this.r + other.r;

    if (distanceVectMag < minDistance) {
      let distanceCorrection = (minDistance - distanceVectMag) / 2.0;
      let d = distanceVect.copy();
      let correctionVector = d.normalize().mult(distanceCorrection);
      other.position.add(correctionVector);
      this.position.sub(correctionVector);

      let relativeVelocity = p5.Vector.sub(this.velocity, other.velocity);
      let normal = distanceVect.copy().normalize();
      let restitution = 0.9; // Coefficient of restitution (adjust as needed)

      let impulse = p5.Vector.mult(normal, p5.Vector.dot(relativeVelocity, normal));
      impulse.mult((1 + restitution) / (this.m + other.m));

      this.velocity.sub(p5.Vector.div(impulse, this.m));
      other.velocity.add(p5.Vector.div(impulse, other.m));
    }
  }

  display() {
    if (this.r === 100) { 
      noFill(); 
      stroke(255); 
    } else { 
      stroke(0,0,0,10); 
      strokeWeight(5)
      fill(226, 0, 50);
    }
    ellipse(this.position.x, this.position.y, this.r * 2, this.r * 2);
  }
}

class Line {
  constructor(x, y1, y2) {
    this.x = x;
    this.y1 = y1;
    this.y2 = y2;
    this.w = 10; 
  }

  display() {
    stroke(0);
    strokeWeight(this.w);
    line(this.x, this.y1, this.x, this.y2);
  }

  checkCollision(ball) {
    if (ball.position.x > this.x - ball.r && ball.position.x < this.x + this.w + ball.r) {
      if (ball.position.y > this.y1 && ball.position.y < this.y2) {
        if (ball.position.y - ball.r < this.y1) {
          ball.position.y = this.y1 + ball.r;
          ball.velocity.y *= -ball.gravity; 
        } else if (ball.position.y + ball.r > this.y2) {
          ball.position.y = this.y2 - ball.r;
          ball.velocity.y *= -ball.gravity; 
        }
      }
    }
  }
}

let balls = []; 
let secondBalls = [];
let minuteBalls = [];
let hourBalls = [];
let line1;
let line2;

function setup() {
  createCanvas(windowWidth, windowHeight);
  video = createCapture(VIDEO);
  video.size(width, height);
  video.hide();
  
  handleMLLib().then(()=>{console.log('ml5 loaded')});
  line1 = new Line(width/2-300, 0, height);
  line2 = new Line(width/2+300, 0, height);

}
function modelReady() {
  console.log("Model ready!");
}
async function handleMLLib(){
  handpose = ml5.handpose(video, {
    flipHorizontal: true
  }, modelReady);
  handpose.on("predict", (results) => {
    predictions = results;
  });
}
function draw() {
  background(0);
  line1.display();
  line2.display();
  
  let currentSeconds = second();
  let currentMinutes = minute();
  let currentHours = hour();

  updateBalls(secondBalls, currentSeconds, 60, 10); 
  updateBalls(minuteBalls, currentMinutes, 60, 20); 
  updateBalls(hourBalls, currentHours, 50, 50);

  updateAndDisplayBalls(secondBalls, [...minuteBalls, ...hourBalls]);
  updateAndDisplayBalls(minuteBalls, [...secondBalls, ...hourBalls]);
  updateAndDisplayBalls(hourBalls, [...secondBalls, ...minuteBalls]);


  moveBalls();
}

function moveBalls() {
  for (let i = 0; i < predictions.length; i++) {
    let indexTip = predictions[i].annotations.indexFinger[3];

    if (indexTip[1]) {
      let fingertipPosition = createVector(indexTip[0], indexTip[1]);
      let bigBall = new Ball(fingertipPosition.x, fingertipPosition.y, 100); 
      bigBall.display();
      bigBall.checkBoundaryCollision();
            for (let ball of [...secondBalls, ...minuteBalls, ...hourBalls]) {
              bigBall.checkCollision(ball);
            }
      
            line1.checkCollision(bigBall);
            line2.checkCollision(bigBall);
          }
        }
      }
      
      function updateBalls(ballArray, currentQuantity, maxQuantity, sizeFactor, ballColor) {
        if (currentQuantity >= maxQuantity) {
          ballArray.splice(0);
          return;
        }
              if (ballArray.length !== currentQuantity) {
          if (ballArray.length < currentQuantity) {
            while (ballArray.length < currentQuantity) {
              let x = random(width/2-300, width/2+300); 
              let y = random(height); 
              let r = sizeFactor; 
              ballArray.push(new Ball(x, y, r, ballColor));
            }
          } else {
            ballArray.splice(currentQuantity);
          }
        }
      }
      
      function updateAndDisplayBalls(ballArray1, ballArray2) {
        for (let i = 0; i < ballArray1.length; i++) {
          let b1 = ballArray1[i];
          b1.update();
          b1.display();
          b1.checkBoundaryCollision();
      
          for (let j = i + 1; j < ballArray1.length; j++) {
            let b2 = ballArray1[j];
            b1.checkCollision(b2);
          }
          for (let j = 0; j < ballArray2.length; j++) {
            let b2 = ballArray2[j];
            b1.checkCollision(b2);
          }
          line1.checkCollision(b1);
          line2.checkCollision(b1);
        }
      }
      
      
      function createBalls() {
        for (let i = 0; i < numBalls; i++) {
          let x = random(width/2-300, width/2+300); 
          let y = -100; 
          let ball = new Ball(x, y, r);
          balls.push(ball);
        }
      }
      

