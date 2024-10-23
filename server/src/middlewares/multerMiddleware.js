import multer from "multer";

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, './public/temp'); 
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const fileExtension = file.mimetype.split('/')[1]; 
    cb(null, file.fieldname + '-' + uniqueSuffix + '.' + fileExtension); 
  }
});

const upload = multer({ storage: storage });

export { upload };

const uploadMiddleware = (req, res, next) => {
  upload.array('picture', 10)(req, res, function (err) {
    if (err) {
      console.log(err);
      return res.status(400).json({ error: 'File upload failed', details: err });
    }

    if (req.files) {
      req.filenames = req.files.map(file => `public/temp/${file.filename}`); // Add full path to filenames
    }

    next();
  });
};

export { uploadMiddleware };
