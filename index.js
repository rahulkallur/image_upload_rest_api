const express = require("express");
const app = express();
const multer = require("multer");
const dotenv = require("dotenv");
dotenv.config();
const path = require("path");
const Minio = require("minio");
const cloudinary = require("cloudinary");
const SERVER_PORT = process.env.SERVER_PORT || 3000

cloudinary.config({
  cloud_name: process.env.cloud_name,
  api_key: process.env.api_key,
  api_secret: process.env.api_secret,
});

const storage = multer.diskStorage({
  destination: "./",
  filename: (req, file, cb) => {
    let fileExtension = file.originalname.split(".");
    let fileName =
      Math.random().toString(36).substring(2, 15) +
      Math.random().toString(36).substring(2, 15) +
      "." +
      fileExtension[1];
    return cb(null, `${fileName}`);
  },
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10000000,
  },
});
app.use("/profile", express.static("./"));
app.post("/upload", upload.single("profile"), (req, res) => {
  // console.log("Req:",req.body.bucketName)
  var Fs = require("fs");
  if (!req.file) {
    return res
      .status(400)
      .send('File not supplied. Input text name for File should be "profile"');
  }

  if (req.file) {
    var file = req.file.path;
    var fileStream = Fs.createReadStream(file);
    var fileStat = Fs.stat(file, function (err, stats) {
      if (err) {
        console.log(err);
      }
      let path = `./${req.file.path}`;
      cloudinary.v2.uploader.upload(path, function (error, result) {
        // console.log("Result:", result, error);
        if (result) {
          Fs.unlink(req.file.path, function (err) {
            if (err) console.log(err);
            console.log("file deleted successfully");
          });
        }
      });
      res.end(req.file.filename);
    });
  }
});
app.listen(SERVER_PORT, () => {
  console.log("Listening at http://localhost:" + SERVER_PORT);
});
