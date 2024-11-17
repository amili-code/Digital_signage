const performCRUD = require('./../dataBase/operation');
const socketIo = require('socket.io');
const { DateTime } = require('luxon');
require('dotenv').config();
let connectedClients = {};

// تابع تبدیل روز هفته به دیتابیس
const getCurrentDay = () => {
    return DateTime.now().setZone('Asia/Tehran').toFormat('ccc').toLowerCase(); // مثال: "sat", "mon"
};

// بررسی روز تعطیل
async function isHoliday(date) {
    const condition = { holiday_date: date.toISODate() }; // تبدیل تاریخ به فرمت YYYY-MM-DD
    const holidays = await performCRUD('select', 'holidays', condition);
    return holidays.length > 0; // اگر تعطیل بود، true برمی‌گرداند
}

// تابع بررسی بازه‌های زمانی
async function checkSchedules(io) {
    setInterval(async () => {
        const now = DateTime.now().setZone('Asia/Tehran');
        const currentDay = getCurrentDay();

        // بررسی تعطیل بودن روز فعلی
        const today = now.setLocale('fa'); // تاریخ امروز
        const holiday = await isHoliday(now);
        if (holiday) {
            console.log(`روز ${today.toFormat('yyyy/MM/dd')} تعطیل است. فرمانی ارسال نمی‌شود.`);
            return;
        }

        // دریافت بازه‌های روز فعلی از دیتابیس
        const condition = { day: currentDay };
        const timeRanges = await performCRUD('select', 'schedule', condition);

        if (!timeRanges.length) {
            console.log(`هیچ بازه‌ای برای روز ${currentDay} پیدا نشد.`);
            return;
        }

        timeRanges.forEach((range) => {
            const startTime = now.set({
                hour: range.start_hour,
                minute: range.start_min,
                second: 0,
                millisecond: 0,
            });
            const stopTime = now.set({
                hour: range.stop_hour,
                minute: range.stop_min,
                second: 0,
                millisecond: 0,
            });

            // بررسی اگر زمان فعلی برابر با زمان شروع است
            if (now.hasSame(startTime, 'minute')) {
                console.log(`ارسال فرمان روشن شدن به تمام دستگاه‌ها برای بازه ${range.id}`);
                io.emit('command', { type: 'ON', rangeId: range.id }); // ارسال فرمان روشن شدن
            }

            // بررسی اگر زمان فعلی برابر با زمان پایان است
            if (now.hasSame(stopTime, 'minute')) {
                console.log(`ارسال فرمان خاموش شدن به تمام دستگاه‌ها برای بازه ${range.id}`);
                io.emit('command', { type: 'OFF', rangeId: range.id }); // ارسال فرمان خاموش شدن
            }
        });
    }, 1000 * 10); // بررسی هر دقیقه یک بار
}


function setupSocket(server) {
    const io = socketIo(server);
    io.on("connection", (socket) => {
        socket.on('starter', async (json) => {
            console.log(`${json.mac} join the server`)


            const conditione = { mac: json.mac };
            const data = { connection: 1 };
            await performCRUD('update', 'player', conditione, data)



            connectedClients[json.mac] = socket.id
            const condition = { mac: json.mac };
            performCRUD('select', 'player', condition)
                .then((rows) => {
                    let player = rows[0]

                })
                .catch((err) => res.status(500).json(err));
        })


        socket.on('getVideo', async (mac) => {
            const allVideo = await allVide()
            const videoArrey = await videoPlayer(mac.toString())
            let videoList = []
            allVideo.forEach(vid => videoList.push(vid.name));
            videoArrey.forEach(vid => videoList.push(vid.videoName));

            console.log(videoList)
        })






        socket.on('getOnlineClients', () => {
            const macList = Object.keys(connectedClients); // استخراج لیست مک آدرس‌ها
            console.log(macList);
        })
        socket.on("disconnect", async () => {
            for (const mac in connectedClients) {
                if (connectedClients[mac] === socket.id) {
                    console.log(`${mac} disconnected`)
                    const conditione = { mac };
                    const data = { connection: 0 };
                    await performCRUD('update', 'player', conditione, data)
                    delete connectedClients[mac];
                    break;
                }
            }
        });
    });



    checkSchedules(io)
    return io;
}


async function videoPlayer(mac) {
    const condition = { playerMac: mac };
    const videoList = await performCRUD('select', 'video_list', condition)
    return videoList
}
async function allVide() {
    const condition = { disable: 1 };
    const videoList = await performCRUD('select', 'video', condition)
    return videoList
}

module.exports = setupSocket;