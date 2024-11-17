const performCRUD = require('./../dataBase/operation')
const ffmpeg = require("fluent-ffmpeg");
const ffprobe = require("ffprobe-static");
const path = require("path");
const fs = require("fs");
const snapshotPath = 'videos/snap'; // مسیر ذخیره تصاویر
const videoPath = 'videos'; 


//CONTROLL ROUTES
class apiController {
    getVideo(req, res) {
        try {
            const videoFile = req.file; // فایل ویدیو آپلود شده
            const title = req.body.title; // عنوان ویدیوی ارسال شده توسط کاربر

            if (!videoFile) {
                return res.status(400).json({ error: "No video file uploaded!" });
            }

            // مسیر فایل آپلود شده
            const filePath = videoFile.path;

            // استخراج متادیتا با ffmpeg
            ffmpeg.setFfprobePath(ffprobe.path);
            ffmpeg.ffprobe(filePath, (err, metadata) => {
                if (err) {
                    return res.status(500).json({ error: "Failed to analyze video metadata." });
                }

                const { format, streams } = metadata;

                // محاسبه اطلاعات مورد نیاز
                const videoName = videoFile.originalname.slice(0, 15); // نام ویدیو (کوتاه‌شده)
                const durationInSeconds = Math.floor(format.duration); // طول ویدیو بر حسب ثانیه
                const resolution = `${streams[0].width}x${streams[0].height}`; // رزولوشن (عرض * ارتفاع)
                const fileSizeInBytes = videoFile.size * 1e-6; // اندازه فایل به بایت

                const snapshotFileName = `${path.basename(filePath, path.extname(filePath))}.jpg`;
                const snapshotFullPath = path.join(snapshotPath, snapshotFileName);
                if (!fs.existsSync(snapshotPath)) {
                    fs.mkdirSync(snapshotPath, { recursive: true });
                }

                ffmpeg(filePath)
                    .screenshots({
                        timestamps: ["3"], // ثانیه سوم
                        filename: snapshotFileName,
                        folder: snapshotPath,
                    }).on('end', () => {
                        const data = { name: videoName, length: durationInSeconds.toString(), snap_shot: snapshotFullPath ,pixel: resolution, size: fileSizeInBytes , title  };
                        performCRUD('add', 'video', {}, data)
                            .then((result) => res.status(200).json(result))
                            .catch((err) => res.status(500).json(err));
                    })
                // پاسخ به کلاینت
            });
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: "An error occurred while processing the video." });
        }
    }

    delVideo(req, res) {
        const videoName = req.body.videoFileName;
        console.log(videoName)
        if (fs.existsSync(snapshotPath + '/' + videoName +'.jpg')) {
            fs.unlinkSync(snapshotPath + '/' + videoName + '.jpg');
            console.log(`Snapshot file deleted: ${videoName}`);
        } else {
            console.log(`Snapshot file not found: ${videoName}`);
        }
        
        if (fs.existsSync(videoPath + '/' + videoName + '.mp4')) {
            fs.unlinkSync(videoPath + '/' + videoName + '.mp4');
            console.log(`Snapshot file deleted: ${videoName}`);
        } else {
            console.log(`Snapshot file not found: ${videoName}`);
        }

        const condition = { name: videoName+'.mp4' };
        performCRUD('delete', 'video', condition)
            .then((result) => res.status(200).json(result))
            .catch((err) => res.status(500).json(err));
    }

    

}


module.exports = new apiController();