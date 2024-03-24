let handpose;
let video;
let predictions = [];

class Ball {
  gravity = 0.3;
  friction = 0.1;
  constructor(x, y, r) {
    this.position = createVector(x, y);
    this.velocity = createVector(0, 0); // No initial velocity
    this.acceleration = createVector(0, 0.1); // Gravity
    this.r = r;
    this.m = r * 0.1;
  }

  update() {
    this.velocity.add(this.acceleration); // Add gravity to velocity
    this.position.add(this.velocity); // Update position
  }

  checkBoundaryCollision() {
    // Check if the ball hits the left or right boundary
    if (this.position.x > width/2+300 - this.r) {
      this.position.x = width/2+300 - this.r;
      this.velocity.x *= -this.gravity; // Reduce the x-velocity upon collision
    } else if (this.position.x < this.r) {
      this.position.x = this.r;
      this.velocity.x *= -this.gravity; // Reduce the x-velocity upon collision
    } else if (this.position.x < width/2-250 - this.r){
      this.position.x = width/2-250 - this.r;
      this.velocity.x *= -this.gravity;
    }



    // Check if the ball hits the top or bottom boundary
    if (this.position.y > height/2 + 100 - this.r) {
      this.position.y = height/2 + 100- this.r; // Prevent the ball from going below the ground
      this.velocity.y *= -this.gravity; // Reduce the y-velocity upon collision

      // Optionally, you can also reduce the velocity in the x-direction to simulate friction
      this.velocity.x *= this.friction; // Adjust the coefficient as needed
    } else if (this.position.y < this.r) {
      this.position.y = this.r;
      this.velocity.y *= -this.gravity; // Reduce the y-velocity upon collision
    }
  }

  checkCollision(other) {
    // Get distances between the balls components
    let distanceVect = p5.Vector.sub(other.position, this.position);

    // Calculate magnitude of the vector separating the balls
    let distanceVectMag = distanceVect.mag();

    // Minimum distance before they are touching
    let minDistance = this.r + other.r;

    if (distanceVectMag < minDistance) {
      let distanceCorrection = (minDistance - distanceVectMag) / 2.0;
      let d = distanceVect.copy();
      let correctionVector = d.normalize().mult(distanceCorrection);
      other.position.add(correctionVector);
      this.position.sub(correctionVector);

      // Adjust the velocities of both balls to reduce the energy upon collision
      let relativeVelocity = p5.Vector.sub(this.velocity, other.velocity);
      let normal = distanceVect.copy().normalize();
      let restitution = 0.9; // Coefficient of restitution (adjust as needed)

      // Calculate impulse
      let impulse = p5.Vector.mult(normal, p5.Vector.dot(relativeVelocity, normal));
      impulse.mult((1 + restitution) / (this.m + other.m));

      // Update velocities
      this.velocity.sub(p5.Vector.div(impulse, this.m));
      other.velocity.add(p5.Vector.div(impulse, other.m));
    }
  }

  display() {
    if (this.r === 100) { // Check if the radius is equal to 300 (big ball)
      noFill(); // Set fill to none
      stroke(255); // Set stroke color to white
    } else { // For other balls
      noStroke(); // Set stroke to none
      fill(226, 50, 50); // Set fill color
    }
    ellipse(this.position.x, this.position.y, this.r * 2, this.r * 2);
  }
}

class Line {
  constructor(x, y1, y2) {
    this.x = x;
    this.y1 = y1;
    this.y2 = y2;
    this.w = 10; // Width of the line
  }

  display() {
    stroke(0);
    strokeWeight(this.w);
    line(this.x, this.y1, this.x, this.y2);
  }

  checkCollision(ball) {
    // Check if the ball is within the vicinity of the line
    if (ball.position.x > this.x - ball.r && ball.position.x < this.x + this.w + ball.r) {
      if (ball.position.y > this.y1 && ball.position.y < this.y2) {
        // Resolve collision
        if (ball.position.y - ball.r < this.y1) {
          // Ball is above the line
          ball.position.y = this.y1 + ball.r;
          ball.velocity.y *= -ball.gravity; // Reverse velocity
        } else if (ball.position.y + ball.r > this.y2) {
          // Ball is below the line
          ball.position.y = this.y2 - ball.r;
          ball.velocity.y *= -ball.gravity; // Reverse velocity
        }
      }
    }
  }
}

let balls = []; // Array to store the balls
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
  // Display lines
  line1.display();
  line2.display();
  fill(205)
  text('Move the balls to reveal the time! (ps.: use your fingertips)', width/2-150, height/2+300)

  // Get the current time components from the system clock
  let currentSeconds = second();
  let currentMinutes = minute();
  let currentHours = hour();

  // Update the number of balls for seconds
  updateBalls(secondBalls, currentSeconds, 60, 10); // Second balls are red
  // Update the number of balls for minutes
  updateBalls(minuteBalls, currentMinutes, 60, 20); // Minute balls are green
  updateBalls(hourBalls, currentHours, 50, 50); // Hour balls are blue

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
      // Create a big ball at fingertip position
      bigBall.display();
      bigBall.checkBoundaryCollision();
            // Check for collisions with other balls
            for (let ball of [...secondBalls, ...minuteBalls, ...hourBalls]) {
              bigBall.checkCollision(ball);
            }
      
            // Check for collisions with lines
            line1.checkCollision(bigBall);
            line2.checkCollision(bigBall);
          }
        }
      }
      
      function updateBalls(ballArray, currentQuantity, maxQuantity, sizeFactor, ballColor) {
        // Reset ball array if the current quantity exceeds the max quantity
        if (currentQuantity >= maxQuantity) {
          ballArray.splice(0);
          return;
        }
      
        // Check if the number of balls matches the given quantity
        if (ballArray.length !== currentQuantity) {
          // If not, adjust the number of balls accordingly
          if (ballArray.length < currentQuantity) {
            // Create new balls if the current number of balls is less than the quantity
            while (ballArray.length < currentQuantity) {
              let x = random(width/2-300, width/2+300); // Random x-coordinate
              let y = random(height); // Random y-coordinate
              let r = sizeFactor; // Radius based on size factor
              ballArray.push(new Ball(x, y, r, ballColor)); // Create a new ball and add it to the array
            }
          } else {
            // Remove excess balls if the current number of balls is greater than the quantity
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
      
          // Collide with balls from the same array
          for (let j = i + 1; j < ballArray1.length; j++) {
            let b2 = ballArray1[j];
            b1.checkCollision(b2);
          }
      
          // Collide with balls from the other array
          for (let j = 0; j < ballArray2.length; j++) {
            let b2 = ballArray2[j];
            b1.checkCollision(b2);
          }
      
          // Collide with lines
          line1.checkCollision(b1);
          line2.checkCollision(b1);
        }
      }
      
      
      function createBalls() {
        for (let i = 0; i < numBalls; i++) {
          let x = random(width/2-300, width/2+300); // Random x-coordinate
          let y = -100; // Random y-coordinate above the screen
          let ball = new Ball(x, y, r);
          balls.push(ball);
        }
      }
      

