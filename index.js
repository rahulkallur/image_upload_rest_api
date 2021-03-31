const express = require("express");
const app = express();
const multer = require("multer");
const dotenv = require("dotenv");
dotenv.config();
const path = require("path");
const Minio = require("minio");

var client = new Minio.Client({
  endPoint: process.env.MinioEndPoint,
  port: 443,
  useSSL: true,
  accessKey: process.env.MinioAccessKey,
  secretKey: process.env.MinioSecretKey,
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
  if(!req.file){
    return res
      .status(400)
      .send(
        'File not supplied. Input text name for File should be "profile"',
      );
  }

  if (!req.body.bucketName) {
    Fs.unlink(req.file.path, function (err) {
      if (err) console.log(err);
      console.log("file deleted successfully");
    });
    return res
      .status(400)
      .send(
        'BucketName not supplied. Input text name for bucketName should be "bucketName"',
      );
  }
  if(req.file && req.body.bucketName){
  var file = req.file.path;
  var fileStream = Fs.createReadStream(file);
  var fileStat = Fs.stat(file, function (err, stats) {
    if (err) {
      console.log(err);
    }
    client.putObject(
      req.body.bucketName,
      req.file.filename,
      fileStream,
      stats.size,
      function (err, etag) {
        console.log("Response:", err, etag); // err should be null
      },
    );
    res.end(req.file.filename);
  });
  Fs.unlink(req.file.path, function (err) {
    if (err) console.log(err);
    console.log("file deleted successfully");
  });
}
});

app.listen(process.env.SERVER_PORT, () => {
  console.log("Listening at http://localhost:" + process.env.SERVER_PORT);
});
