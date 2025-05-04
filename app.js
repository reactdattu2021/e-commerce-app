const express = require('express');
const multer = require('multer');
const fs = require('fs');
const csv = require('fast-csv');
const mysql = require('mysql2');
const path = require('path');

const app = express();
const port = 3000;

// Setup Multer
const upload = multer({ dest: 'uploads/' });

// MySQL Connection
const connection = mysql.createConnection({
    host: 'localhost',    // Your MySQL server (localhost for local server)
    user: 'root',         // Your MySQL username
    password: 'root', // Your MySQL password
    database: 'userdata'
});

// Upload endpoint
app.post('/upload', upload.single('file'), (req, res) => {
  const filePath = req.file.path;
  const records = [];

  fs.createReadStream(filePath)
    .pipe(csv.parse({ headers: true }))
    .on('error', error => {
      console.error(error);
      return res.status(500).send('Error reading CSV file');
    })
    .on('data', row => {
      const { id, title, price, description, category, image, rating} = row;
      records.push([id, title, price, description, category, image, rating]);
    })
    .on('end', rowCount => {
      const sql = `
        INSERT INTO products 
        (id, title, price, description, category, image, rating)
        VALUES ?
      `;

      connection.query(sql, [records], (err, result) => {
        fs.unlinkSync(filePath); // delete uploaded file
        if (err) {
          console.error(err.sqlMessage || err);
          return res.status(500).send('Database insert failed');
        }
        res.send(`Successfully inserted ${result.affectedRows} rows.`);
      });
    });
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
