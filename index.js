const express = require('express');
const mysql = require('mysql2/promise');  // Use the promise-based version of mysql2
const cors = require('cors');
const app = express();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');  // Make sure to include bcrypt if you want to hash passwords

    // Middleware to parse JSON request bodies
    app.use(cors());
    app.use(express.json());

    // MySQL connection settings
    const db = mysql.createPool({
        host: 'localhost',    // Your MySQL server (localhost for local server)
        user: 'root',         // Your MySQL username
        password: 'root',     // Your MySQL password
        database: 'userdata'  // Your database name
    });
    

    // Connect to MySQL
    

    // POST route to create a new user
    app.post('/users/', async (request, response) => {
        console.log('POST /users/ called');
        const { username, name, password, gender, location } = request.body;
        console.log(request.body);
    
        // Hash the password using bcrypt
        const hashedPassword = await bcrypt.hash(password, 10);
    
        // Check if user already exists
        const selectUserQuery = 'SELECT * FROM dbuser WHERE username = ?';
        try {
            const [dbUser] = await db.query(selectUserQuery, [username]);
    
            if (dbUser.length === 0) {  // If user doesn't exist
                const createUserQuery = 'INSERT INTO dbuser (username, name, password, gender, location) VALUES (?, ?, ?, ?, ?)';
                const [dbResponse] = await db.query(createUserQuery, [username, name, hashedPassword, gender, location]);
                const newUserId = dbResponse.insertId;  // Get the ID of the newly created user
                response.send(`Created new user with ID ${newUserId}`);
            } else {
                response.status(409).json({ error_msg: "User already exists" });
            }
        } catch (err) {
            response.status(500).send('Error checking user or creating user');
        }
    });
    
    app.post("/login", async (request, response) => {
        const { username, password } = request.body;
    
        const selectUserQuery = 'SELECT * FROM dbuser WHERE username = ?';
        try {
            const [sqldatabase] = await db.query(selectUserQuery, [username]);
    
            if (sqldatabase.length === 0) {
                response.status(400).json({ error_msg: "User not found" });
            } else {
                const dbUser = sqldatabase[0];
                const isPasswordMatched = await bcrypt.compare(password, dbUser.password);
    
                if (isPasswordMatched) {
                    const payload = { username: username };
                    const jwtToken = jwt.sign(payload, 'secreate-key');
                    response.send({ jwtToken });
                } else {
                    response.status(401).json({ error_msg: "Invalid password" });
                }
            }
        } catch (err) {
            console.error("Login error:", err);
            response.status(500).json({ error_msg: "Internal server error" });
        }
    });
    
    
    app.get("/products", (request, response) => {
        const authHeader = request.headers['authorization'];
        let jwtToken;
      
        if (authHeader !== undefined) {
          jwtToken = authHeader.split(" ")[1]; // ✅ correct space!
        }
      
        if (jwtToken === undefined) {
          return response.status(401).json({ error_msg: 'Invalid Access Token' });
        }
      
        jwt.verify(jwtToken, "secreate-key", async (error, payload) => {
          if (error) {
            return response.status(401).json({ error_msg: 'JWT Token not valid' });
          } else {
            try {
              const getProductsQuery = `SELECT * FROM products;`;
              const AllProducts = await db.query(getProductsQuery);
              // console.log("Sending products:", AllProducts[0]);
              
              return response.json(AllProducts[0]);
            } catch (dbError) {
              console.error("Database error:", dbError);
              return response.status(500).json({ error_msg: "Database error" });
            }
          }
        });
      });
      
    
    
    app.listen(3001, () => {
        console.log(`Server running on http://localhost:3001`);
      });        
